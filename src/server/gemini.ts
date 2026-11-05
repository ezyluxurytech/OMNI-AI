import { GoogleGenAI } from '@google/genai';

// Initialize server-side Gemini SDK instance with required aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface StreamChatOptions {
  model?: string;
  speedMode?: 'turbo' | 'standard' | 'deep';
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  webSearch?: boolean;
  systemInstruction?: string;
  temperature?: number;
  attachments?: Array<{ mimeType: string; data: string; name?: string }>;
}

export const OMNI_SYSTEM_PROMPT = `You are Omni, a next-generation multimodal AI assistant engineered for exceptional intelligence, clarity, speed, and deep reasoning.
Identity and Brand:
- You are Omni (represented by a dazzling diamond starlight sparkle cluster symbol with micro-particle bursts).
- Your tone is futuristic, articulate, razor-sharp, supportive, and precise.
- You can perform all tasks of modern frontier models like Gemini and more: multi-turn deep reasoning, live Google Search grounding, multi-page document dissection, academic study synthesis, code architecture audits, and high-fidelity multilingual translation.
- Format responses beautifully using clean Markdown headings (###), bullet points, and numbered lists.
- For code snippets, always use standard language tags (e.g. \`\`\`typescript, \`\`\`python, \`\`\`rust).
- When citing sources or web results, present factual data clearly and distinguish retrieved information from analysis.
- Be concise by default, expanding into deep comprehensive analysis when prompted.
- You excel in coding, scientific analysis, document comprehension, academic study tools (quizzes, flashcards, revision notes), and multilingual translations (including English, Yorùbá, Igbo, Hausa, and other global languages).`;

export const ASTRAEA_SYSTEM_PROMPT = OMNI_SYSTEM_PROMPT;

/**
 * Format conversation history into @google/genai Content format
 */
function buildGeminiContents(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  attachments?: Array<{ mimeType: string; data: string }>
) {
  const contents = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    // Map 'assistant' to 'model' for Gemini
    const role = msg.role === 'assistant' ? 'model' : 'user';

    // If it's the latest user message and has attachments, add them as inline parts
    if (i === messages.length - 1 && role === 'user' && attachments && attachments.length > 0) {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      for (const att of attachments) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      }
      parts.push({ text: msg.content || 'Please analyze the attached document or file.' });
      contents.push({ role, parts });
    } else {
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }
  }

  return contents;
}

/**
 * Stream Chat using @google/genai SDK
 * Optimized for ultra-fast Time-To-First-Token (TTFT) and high streaming throughput
 */
export async function streamChat(
  options: StreamChatOptions,
  onChunk: (text: string) => void,
  onSources?: (sources: GroundingSource[]) => void
): Promise<{ text: string; model: string }> {
  // Select fastest model based on speedMode if model not explicitly specified
  let model = options.model;
  if (!model) {
    if (options.speedMode === 'turbo') {
      model = 'gemini-3.1-flash-lite';
    } else if (options.speedMode === 'deep') {
      model = 'gemini-4-argon';
    } else {
      model = 'gemini-3.8-flash';
    }
  }

  // Latency Optimization: Sliding context window (last 16 messages) to avoid quadratic prompt prefill delays
  const trimmedMessages = options.messages.length > 16
    ? options.messages.slice(-16)
    : options.messages;

  const contents = buildGeminiContents(trimmedMessages, options.attachments);

  const tools: any[] = [];
  if (options.webSearch) {
    tools.push({ googleSearch: {} });
  }

  const config: any = {
    systemInstruction: options.systemInstruction || ASTRAEA_SYSTEM_PROMPT,
    temperature: options.temperature ?? (options.speedMode === 'turbo' ? 0.6 : 0.7),
  };

  if (tools.length > 0) {
    config.tools = tools;
  }

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
    config,
  });

  let fullText = '';
  const collectedSources: GroundingSource[] = [];

  for await (const chunk of responseStream) {
    const textChunk = chunk.text;
    if (textChunk) {
      fullText += textChunk;
      onChunk(textChunk);
    }

    // Extract grounding sources if search was enabled
    const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      for (const gChunk of groundingMetadata.groundingChunks) {
        const web = gChunk.web;
        if (web?.uri && web?.title) {
          const uri = web.uri;
          const title = web.title;
          const exists = collectedSources.some((s) => s.url === uri);
          if (!exists) {
            collectedSources.push({
              title,
              url: uri,
            });
          }
        }
      }
    }
  }

  if (onSources && collectedSources.length > 0) {
    onSources(collectedSources);
  }

  return { text: fullText, model };
}

/**
 * Analyze document (PDF, TXT, CSV)
 */
export async function analyzeDocument(params: {
  filename: string;
  mimeType: string;
  base64Data: string;
  task: 'summary' | 'qa' | 'study_guide' | 'quiz';
  customPrompt?: string;
}) {
  const model = 'gemini-3.8-flash';

  let taskPrompt = '';
  switch (params.task) {
    case 'summary':
      taskPrompt = `Analyze the attached document "${params.filename}". Provide:
1. Executive Summary (2-3 concise paragraphs)
2. Core Findings & Key Takeaways (bulleted)
3. Structural Breakdown (sections/chapters if applicable)
4. Key Terms & Definitions
5. Potential Limitations or Action Items`;
      break;
    case 'study_guide':
      taskPrompt = `Create a structured Study Guide and Revision Sheet based on "${params.filename}":
1. Key Concepts Explained (with easy analogies)
2. Crucial Formulas, Facts, or Chronology
3. Self-Assessment Checkpoints
4. Summary Flashcards`;
      break;
    case 'quiz':
      taskPrompt = `Generate a 5-question multiple choice quiz based strictly on "${params.filename}".
Format each question with:
- Question text
- 4 Options (A, B, C, D)
- Correct Answer
- Clear Explanation referencing the document`;
      break;
    case 'qa':
    default:
      taskPrompt = params.customPrompt || `Analyze "${params.filename}" and provide key insights.`;
      break;
  }

  const parts: any[] = [];
  if (params.mimeType.startsWith('text/') || params.mimeType === 'text/csv') {
    // Decode base64 text
    const textContent = Buffer.from(params.base64Data, 'base64').toString('utf-8');
    parts.push({ text: `Document Name: ${params.filename}\n\nContent:\n${textContent}\n\nTask: ${taskPrompt}` });
  } else {
    // Send as multimodal inlineData (Gemini reads PDFs natively)
    parts.push({
      inlineData: {
        mimeType: params.mimeType,
        data: params.base64Data,
      },
    });
    parts.push({ text: taskPrompt });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: ASTRAEA_SYSTEM_PROMPT,
      temperature: 0.3, // Lower temperature for faithful document extraction
    },
  });

  return response.text;
}

/**
 * Study Assistant: Generate Quiz, Flashcards, or Revision Notes
 */
export async function generateStudyAid(params: {
  type: 'quiz' | 'flashcards' | 'revision';
  topic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}) {
  const model = 'gemini-3.8-flash';
  const difficulty = params.difficulty || 'intermediate';

  let prompt = '';
  if (params.type === 'quiz') {
    prompt = `Create a high-yield 5-question multiple-choice practice quiz on "${params.topic}" for a ${difficulty} level learner.
Format in clean Markdown:
For each question:
### Question X
*Question prompt*
- A) Option A
- B) Option B
- C) Option C
- D) Option D

> **Answer:** Option letter and text
> **Explanation:** Why this is correct and why other options are incorrect.`;
  } else if (params.type === 'flashcards') {
    prompt = `Create 6 effective flashcards on "${params.topic}" for ${difficulty} level.
For each card, format as:
### Card X: [Term / Core Concept]
**Front:** Question or Concept prompt
**Back:** Clear, concise explanation with a practical memory hook.`;
  } else {
    prompt = `Create a structured revision cheat sheet on "${params.topic}" (${difficulty} level).
Include:
1. Core Mental Models
2. Essential Definitions & Key Principles
3. Common Pitfalls & Misconceptions to avoid
4. 3-Minute Rapid Review Summary`;
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: ASTRAEA_SYSTEM_PROMPT,
      temperature: 0.6,
    },
  });

  return response.text;
}

/**
 * Coding Assistant: Explain, Debug, Refactor
 */
export async function analyzeCode(params: {
  action: 'explain' | 'debug' | 'optimize' | 'refactor';
  code: string;
  language?: string;
  context?: string;
}) {
  const model = 'gemini-3.8-flash';
  const lang = params.language || 'code';

  let instructions = '';
  switch (params.action) {
    case 'explain':
      instructions = 'Explain the following code step-by-step, including its time/space complexity and design patterns:';
      break;
    case 'debug':
      instructions = 'Perform a strict static code audit. Identify any bugs, edge cases, vulnerabilities, or unexpected errors, and provide the corrected code:';
      break;
    case 'optimize':
      instructions = 'Analyze this code for performance bottlenecks. Suggest asymptotic and practical optimizations with comparative benchmarks:';
      break;
    case 'refactor':
      instructions = 'Refactor this code to clean architecture, modern idiomatic standards, and maximum readability while preserving functionality:';
      break;
  }

  const prompt = `${instructions}

Language: ${lang}
${params.context ? `Context: ${params.context}\n` : ''}

\`\`\`${lang}
${params.code}
\`\`\``;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: ASTRAEA_SYSTEM_PROMPT,
      temperature: 0.2, // Low temp for code precision
    },
  });

  return response.text;
}

/**
 * Multilingual Translator (with focus on English, Yorùbá, Igbo, Hausa, French, Spanish, etc.)
 */
export async function translateText(params: {
  text: string;
  sourceLang: string;
  targetLang: string;
}) {
  const model = 'gemini-3.8-flash';

  const prompt = `Translate the following text accurately from ${params.sourceLang} to ${params.targetLang}.
Preserve tone, nuances, and idioms. 

Original Text:
"${params.text}"

Format your response cleanly:
### Translation (${params.targetLang})
[The direct, natural translation]

### Cultural Context & Nuances
[Explain any cultural idioms, tone notes, or grammatical features. If translating to or from African languages like Yorùbá, Igbo, or Hausa, note tonal marks and dialect variations where relevant.]

### Alternative Phrasings (Formal vs Colloquial)
- **Formal:** ...
- **Colloquial / Everyday:** ...`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: ASTRAEA_SYSTEM_PROMPT,
      temperature: 0.3,
    },
  });

  return response.text;
}

/**
 * Neural Audio & Voice Speech Synthesis (gemini-3.8-flash-lite-tts)
 */
export async function generateSpeech(text: string, voice: string = 'Kore'): Promise<string | null> {
  try {
    const cleanText = text.replace(/[*#`_~]/g, '').slice(0, 1500); // speech length limit
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.error('[Speech Synthesis Error]:', err);
    return null;
  }
}

/**
 * Check provider health, available models, and 4 Pro Engine APIs
 */
export async function getProviderStatus() {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  return {
    provider: 'Omni Frontier AI Engine (Google Gemini SDK 2.4.0)',
    appName: 'Omni AI',
    status: hasKey ? 'connected' : 'key_missing',
    defaultModel: 'gemini-3.1-flash-lite',
    supportedModels: [
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (⚡ Turbo Speed)', speed: 'turbo', default: true },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (🚀 High Intelligence)', speed: 'standard' },
      { id: 'gemini-4-argon', name: 'Gemini 4 Argon (🧠 Pro STEM & Deep Logic)', speed: 'deep', pro: true },
    ],
    proEngines: [
      {
        id: 'gemini_4_argon',
        name: 'Gemini 4 Argon Cognitive Engine',
        description: 'Multi-step mathematical proofs, advanced code synthesis, and deep deductive reasoning.',
        tag: 'STEM & Coding Flagship',
        active: true,
      },
      {
        id: 'google_search_grounding',
        name: 'Live Web Grounding & Research Engine',
        description: 'Real-time web crawl, autonomous citation synthesis, and multi-source cross-verification.',
        tag: 'Live Factual Retrieval',
        active: true,
      },
      {
        id: 'multimodal_vision_pdf',
        name: 'Multimodal Vision & High-Res Document Engine',
        description: 'Native optical comprehension for multi-page PDFs, CSV spreadsheets, and visual diagrams.',
        tag: 'Multimodal Analysis',
        active: true,
      },
      {
        id: 'neural_voice_speech',
        name: 'Gemini Neural Audio & Speech Engine (Kore)',
        description: 'Expressive, human-like voice narration and natural conversational audio output.',
        tag: 'Neural TTS Voice',
        active: true,
      },
    ],
    features: {
      streaming: true,
      webSearchGrounding: true,
      multimodalDocumentAnalysis: true,
      multilingualTranslation: true,
      studyTools: true,
      codingAudit: true,
      audioSpeech: true,
    },
  };
}

import React from 'react';

interface OmniLogoProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
  glowIntensity?: 'subtle' | 'medium' | 'high' | 'cosmic';
  animated?: boolean;
  variant?: 'color' | 'light' | 'monochrome';
  withExplosions?: boolean;
}

export const AstraeaLogo: React.FC<OmniLogoProps> = ({
  size = 40,
  className = '',
  glow = true,
  glowIntensity = 'medium',
  animated = false,
  variant = 'color',
  withExplosions = true,
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 40;
  const isLarge = numericSize >= 32;

  const glowFilter = glow ? `var(--omni-logo-filter-${glowIntensity})` : undefined;

  // Micro-explosion star particle definitions
  // Radiating outward from the diamond vertices and edges like fireworks
  const explosionParticles = [
    // Top Crimson/Rose bursts
    { color: '#f43f5e', top: '1%', left: '50%', tx: '6px', ty: '-22px', delay: '0s', classN: 'animate-burst-1', s: 4.5 },
    { color: '#fb7185', top: '5%', left: '55%', tx: '16px', ty: '-16px', delay: '0.35s', classN: 'animate-burst-2', s: 3.8 },
    { color: '#fda4af', top: '7%', left: '45%', tx: '-14px', ty: '-18px', delay: '0.7s', classN: 'animate-burst-3', s: 3.2 },
    { color: '#ffffff', top: '2%', left: '52%', tx: '2px', ty: '-26px', delay: '1.2s', classN: 'animate-burst-1', s: 2.8 },
    // Right Sapphire/Electric Blue bursts
    { color: '#0284c7', top: '50%', left: '98%', tx: '24px', ty: '-6px', delay: '0.15s', classN: 'animate-burst-1', s: 4.8 },
    { color: '#38bdf8', top: '44%', left: '93%', tx: '20px', ty: '-18px', delay: '0.5s', classN: 'animate-burst-2', s: 3.8 },
    { color: '#818cf8', top: '56%', left: '93%', tx: '18px', ty: '18px', delay: '0.95s', classN: 'animate-burst-3', s: 3.4 },
    { color: '#ffffff', top: '49%', left: '96%', tx: '28px', ty: '3px', delay: '1.4s', classN: 'animate-burst-1', s: 2.6 },
    // Bottom Cyan/Teal bursts
    { color: '#0d9488', top: '98%', left: '50%', tx: '-6px', ty: '24px', delay: '0.25s', classN: 'animate-burst-1', s: 4.8 },
    { color: '#14b8a6', top: '93%', left: '55%', tx: '15px', ty: '18px', delay: '0.65s', classN: 'animate-burst-2', s: 3.8 },
    { color: '#38bdf8', top: '91%', left: '45%', tx: '-16px', ty: '16px', delay: '1.05s', classN: 'animate-burst-3', s: 3.4 },
    { color: '#ffffff', top: '96%', left: '51%', tx: '0px', ty: '28px', delay: '1.55s', classN: 'animate-burst-1', s: 2.8 },
    // Left Amber/Gold bursts
    { color: '#d97706', top: '50%', left: '2%', tx: '-24px', ty: '4px', delay: '0.1s', classN: 'animate-burst-1', s: 4.8 },
    { color: '#f59e0b', top: '44%', left: '7%', tx: '-18px', ty: '-14px', delay: '0.45s', classN: 'animate-burst-2', s: 3.8 },
    { color: '#fbbf24', top: '56%', left: '7%', tx: '-20px', ty: '16px', delay: '0.85s', classN: 'animate-burst-3', s: 3.4 },
    { color: '#ffffff', top: '51%', left: '3%', tx: '-28px', ty: '-2px', delay: '1.35s', classN: 'animate-burst-1', s: 2.6 },
  ];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        animated ? 'animate-celestial-pulse' : ''
      } ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
      aria-label="Omni AI Celestial Starlight Logo"
      role="img"
    >
      {/* Dynamic Chromatic Aura Glow Underlay (Seamlessly blended, zero dark shadows) */}
      {glow && (
        <div
          className="absolute inset-[-12%] pointer-events-none rounded-full blur-md opacity-35 dark:opacity-80 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(244,63,94,0.18) 35%, rgba(251,191,36,0.16) 65%, transparent 75%)`,
            filter: glowIntensity === 'cosmic' ? 'blur(16px)' : 'blur(8px)',
          }}
        />
      )}

      {/* Tiny Star Particles / Mini-Explosions Radiating Outward */}
      {withExplosions && isLarge && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {explosionParticles.map((p, idx) => (
            <div
              key={idx}
              className={`absolute rounded-full ${p.classN}`}
              style={{
                top: p.top,
                left: p.left,
                width: `${p.s}px`,
                height: `${p.s}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 5px ${p.color}, 0 0 8px ${p.color}`,
                animationDelay: p.delay,
                // Pass CSS variables for explosion trajectory
                ['--tx' as any]: p.tx,
                ['--ty' as any]: p.ty,
              }}
            >
              {/* Micro 4-pointed cross star for explosion sparkles */}
              <div
                className="absolute inset-[-1px] rotate-45"
                style={{
                  backgroundColor: p.color,
                  clipPath: 'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Primary Diamond Sparkle Cluster Celestial Logo Image (Seamless transparent blending) */}
      <img
        src="/assets/aistudio/image_58bd5069.png"
        alt="Omni AI Logo"
        className={`w-full h-full object-contain relative z-10 pointer-events-none transition-all duration-300 ${
          variant === 'monochrome' ? 'grayscale contrast-125' : ''
        }`}
        style={{
          filter: glowFilter,
        }}
        draggable={false}
      />
    </div>
  );
};

export const OmniLogo = AstraeaLogo;

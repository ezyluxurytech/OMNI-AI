import React, { useState } from 'react';
import { AstraeaLogo } from '../brand/AstraeaLogo';
import { Conversation, User, ActiveWorkspace } from '../../types';
import {
  Plus,
  Search,
  MessageSquare,
  FileText,
  GraduationCap,
  Code2,
  Globe2,
  Settings,
  LogOut,
  Trash2,
  MoreVertical,
  Pin,
  X,
  Edit2,
  Check,
  Sparkles,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  user: User;
  conversations: Conversation[];
  activeConversationId: string | null;
  activeWorkspace: ActiveWorkspace;
  isPro?: boolean;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
  onOpenPro: () => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string, currentPin?: boolean) => void;
  onSelectWorkspace: (ws: ActiveWorkspace) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  conversations,
  activeConversationId,
  activeWorkspace,
  isPro = false,
  theme,
  onToggleTheme,
  onOpenPro,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onSelectWorkspace,
  onOpenSettings,
  onSignOut,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const now = new Date().getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filteredConversations.filter((c) => c.pinned);
  const unpinned = filteredConversations.filter((c) => !c.pinned);

  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const pastWeek: Conversation[] = [];
  const older: Conversation[] = [];

  unpinned.forEach((conv) => {
    const convTime = new Date(conv.updatedAt).getTime();
    const diff = now - convTime;
    if (diff < oneDay) {
      today.push(conv);
    } else if (diff < 2 * oneDay) {
      yesterday.push(conv);
    } else if (diff < 7 * oneDay) {
      pastWeek.push(conv);
    } else {
      older.push(conv);
    }
  });

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = activeConversationId === conv.id && activeWorkspace === 'chat';
    const isEditing = editingId === conv.id;

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isActive
            ? 'bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-white font-semibold shadow-sm border border-sky-200 dark:border-slate-700'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
        }`}
        onClick={() => {
          if (!isEditing) {
            onSelectWorkspace('chat');
            onSelectConversation(conv.id);
            onCloseMobile();
          }
        }}
      >
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        />

        {isEditing ? (
          <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(conv.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              className="w-full bg-white dark:bg-slate-950 border border-sky-500 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={() => handleSaveRename(conv.id)}
              className="p-1 hover:text-emerald-500 text-slate-500"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="flex-1 truncate tracking-tight">{conv.title}</span>
        )}

        {conv.pinned && !isEditing && (
          <Pin className="w-3 h-3 text-sky-500 shrink-0 fill-sky-500/20" />
        )}

        {!isEditing && (
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Conversation options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpenId === conv.id && (
              <div className="absolute right-2 top-8 z-30 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-slate-700 dark:text-slate-200 backdrop-blur-md">
                <button
                  onClick={() => {
                    onTogglePinConversation(conv.id, conv.pinned);
                    setMenuOpenId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{conv.pinned ? 'Unpin' : 'Pin to top'}</span>
                </button>
                <button
                  onClick={() => handleStartRename(conv)}
                  className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => {
                    onDeleteConversation(conv.id);
                    setMenuOpenId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out shadow-sm lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              onSelectWorkspace('chat');
              onCloseMobile();
            }}
          >
            <AstraeaLogo size={36} glow={true} glowIntensity="medium" withExplosions={true} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-rose-500 via-sky-500 to-amber-500 bg-clip-text text-transparent">
                  OMNI
                </span>
                {isPro && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-amber-500 dark:text-amber-400 uppercase">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold block">
                Next-Gen AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Dark / Light Mood Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme mood"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" /> : <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />}
            </button>

            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Upgrade to Pro Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenPro();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500/10 via-sky-500/15 to-amber-500/15 hover:from-rose-500/20 hover:via-sky-500/25 hover:to-amber-500/25 border border-sky-400/40 dark:border-sky-500/40 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>{isPro ? 'Omni Pro Settings' : 'Upgrade to Pro'}</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-500 to-sky-500 text-white text-[9px] font-extrabold uppercase shadow-sm">
              {isPro ? 'PRO ACTIVE' : '4 ENGINES'}
            </span>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              onSelectWorkspace('chat');
              onNewConversation();
              onCloseMobile();
            }}
            className="w-full py-2 px-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Workspaces Navigation */}
        <div className="px-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 mb-1.5">
            Workspaces & Tools
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => {
                onSelectWorkspace('chat');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeWorkspace === 'chat'
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>All Conversations</span>
            </button>

            <button
              onClick={() => {
                onSelectWorkspace('documents');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeWorkspace === 'documents'
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Document Synthesis</span>
            </button>

            <button
              onClick={() => {
                onSelectWorkspace('study');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeWorkspace === 'study'
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>Study Studio</span>
            </button>

            <button
              onClick={() => {
                onSelectWorkspace('code');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeWorkspace === 'code'
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span>Coding Lab</span>
            </button>

            <button
              onClick={() => {
                onSelectWorkspace('translate');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeWorkspace === 'translate'
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 shrink-0" />
              <span>Multilingual Nexus</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* History Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {pinned.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 mb-1 flex items-center gap-1">
                <Pin className="w-2.5 h-2.5 text-sky-500" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">{pinned.map(renderConversationItem)}</div>
            </div>
          )}

          {today.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 mb-1">
                Today
              </div>
              <div className="space-y-0.5">{today.map(renderConversationItem)}</div>
            </div>
          )}

          {yesterday.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 mb-1">
                Yesterday
              </div>
              <div className="space-y-0.5">{yesterday.map(renderConversationItem)}</div>
            </div>
          )}

          {pastWeek.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 mb-1">
                Previous 7 Days
              </div>
              <div className="space-y-0.5">{pastWeek.map(renderConversationItem)}</div>
            </div>
          )}

          {older.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 mb-1">
                Older
              </div>
              <div className="space-y-0.5">{older.map(renderConversationItem)}</div>
            </div>
          )}

          {filteredConversations.length === 0 && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
              No conversations found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-sky-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.name}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Settings & Diagnostics"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

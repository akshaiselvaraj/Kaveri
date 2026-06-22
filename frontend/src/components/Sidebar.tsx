import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, Settings, Shield, MessageSquare, Terminal } from 'lucide-react';
import type { Session } from '../types';

interface SidebarProps {
  history: Session[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onExportPdf: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({

  history,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onExportPdf,
  onOpenSettings
}) => {
  const { t } = useTranslation();
  return (
    <aside className="w-80 h-screen bg-[#0B1F3A] border-r border-[#D9E1E8]/20 flex flex-col justify-between shrink-0 select-none">
      {/* Upper Area */}
      <div className="flex flex-col overflow-hidden flex-1">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-[#D9E1E8]/10 bg-[#071526]/30">
          <div className="w-9 h-9 rounded bg-[#1E4E8C] flex items-center justify-center border border-[#C79A2B]/40">
            <Shield className="w-5 h-5 text-[#C79A2B]" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-xs">{t('sidebar.title')}</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('sidebar.subtitle')}</p>
          </div>
        </div>

        {/* New Investigation Button */}
        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full h-11 rounded border border-[#C79A2B]/40 bg-[#1E4E8C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1E4E8C]/85 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C79A2B]" />
            {t('sidebar.new_chat')}
          </button>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            {t('sidebar.recent_chats')}
          </div>
          {history.length === 0 ? (
            <div className="text-xs text-slate-500 text-center italic mt-6 px-4">
              {t('sidebar.no_history')}
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((session) => {
                const isActive = session.sessionId === currentSessionId;
                return (
                  <button
                    key={session.sessionId}
                    onClick={() => onSelectSession(session.sessionId)}
                    className={`w-full text-left px-3 py-2.5 rounded text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#1E4E8C] text-white font-semibold border-l-4 border-[#C79A2B]'
                        : 'text-slate-300 hover:bg-[#1E4E8C]/15 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-[#C79A2B]' : 'text-slate-500'}`} />
                    <span className="truncate flex-1">{session.snippet}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls Area */}
      <div className="p-4 border-t border-[#D9E1E8]/10 bg-[#071526]/30 flex flex-col gap-2">
        <button
          onClick={onExportPdf}
          disabled={history.length === 0}
          className="w-full py-2.5 rounded bg-[#C79A2B] hover:bg-[#A37B1B] text-[#0B1F3A] font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <FileText className="w-4 h-4" />
          {t('sidebar.export')}
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full h-10 rounded text-slate-300 hover:text-white text-xs flex items-center justify-center gap-2 hover:bg-[#1E4E8C]/20 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          {t('sidebar.settings')}
        </button>
        
        {/* User Role Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071526]/50 border border-[#D9E1E8]/10 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></div>
          <span className="text-[9px] font-bold text-slate-400 tracking-wider">{t('sidebar.connected')}</span>
        </div>
      </div>
    </aside>
  );
};

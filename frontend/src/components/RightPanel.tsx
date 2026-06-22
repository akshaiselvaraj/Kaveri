import React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Database, Cpu, ChevronRight, Info, BookOpen } from 'lucide-react';
import type { Message } from '../types';

interface RightPanelProps {
  lastMessage?: Message;
  isOpen: boolean;
  onToggle: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ lastMessage, isOpen, onToggle }) => {
  const { t } = useTranslation();
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-12 h-screen bg-[#0B1F3A] border-l border-[#D9E1E8]/20 flex flex-col items-center py-6 gap-6 cursor-pointer hover:bg-[#071526] transition-colors shrink-0"
        title="Open Operations panel"
      >
        <ChevronRight className="w-5 h-5 text-[#C79A2B] rotate-180" />
        <Filter className="w-4 h-4 text-slate-400" />
        <Database className="w-4 h-4 text-slate-400" />
        <Cpu className="w-4 h-4 text-slate-400" />
      </button>
    );
  }

  const activeFilters = lastMessage?.activeFilters || {};
  const activeEntities = lastMessage?.activeEntities || {};
  const metadata = lastMessage?.queryMetadata;
  const sql = lastMessage?.sql;

  const hasFilters = Object.keys(activeFilters).length > 0;
  const hasEntities = Object.keys(activeEntities).length > 0;

  return (
    <aside className="w-80 h-screen bg-[#FFFFFF] border-l border-[#D9E1E8] flex flex-col shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-[#0B1F3A] border-b border-[#C79A2B] flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Info className="w-4.5 h-4.5 text-[#C79A2B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider">{t('right_panel.title')}</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[#1E4E8C] text-slate-300 hover:text-white transition-colors"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 bg-[#F4F6F8] flex-1">
        {/* Active Filters */}
        <div className="bg-white border border-[#D9E1E8] rounded p-3.5 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#D9E1E8] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#1E4E8C]" />
            {t('right_panel.active_filters')}
          </h3>
          {hasFilters ? (
            <div className="space-y-1.5">
              {Object.entries(activeFilters).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs border-b border-slate-50 pb-1">
                  <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-[#1E4E8C] font-semibold">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">{t('right_panel.no_filters')}</p>
          )}
        </div>

        {/* Query Metadata */}
        <div className="bg-white border border-[#D9E1E8] rounded p-3.5 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#D9E1E8] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#1E4E8C]" />
            {t('right_panel.metrics')}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('right_panel.intent')}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                metadata?.intent === 'DATABASE_QUERY' 
                  ? 'bg-blue-50 border-blue-200 text-blue-800' 
                  : metadata?.intent === 'GENERAL'
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {metadata?.intent || 'IDLE'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-500">{t('right_panel.latency')}</span>
              <span className="text-[#1A1A1A] font-semibold">
                {metadata?.executionTimeMs ? `${metadata.executionTimeMs}ms` : '0ms'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">{t('right_panel.dialect')}</span>
              <span className="text-[#1A1A1A] font-semibold">
                {lastMessage?.detectedLang === 'kn' ? 'Kannada' : 'English'}
              </span>
            </div>
          </div>
        </div>

        {/* SQL Console Query */}
        <div className="bg-white border border-[#D9E1E8] rounded p-3.5 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#D9E1E8] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#1E4E8C]" />
            {t('right_panel.sql_title')}
          </h3>
          <div className="bg-slate-900 border border-slate-950 rounded p-2.5 overflow-x-auto max-h-56 font-mono text-[10px]">
            {sql ? (
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed select-all cursor-text">{sql}</pre>
            ) : (
              <p className="text-slate-500 italic font-sans">{t('right_panel.no_sql')}</p>
            )}
          </div>
        </div>

        {/* Entities Highlighted */}
        <div className="bg-white border border-[#D9E1E8] rounded p-3.5 shadow-sm">
          <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2.5 pb-1 border-b border-[#D9E1E8] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#1E4E8C]" />
            {t('right_panel.dossier')}
          </h3>
          {hasEntities ? (
            <div className="space-y-1.5">
              {Object.entries(activeEntities).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs border-b border-slate-50 pb-1">
                  <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-[#1A1A1A] font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">{t('right_panel.no_dossier')}</p>
          )}
        </div>
      </div>
    </aside>
  );
};

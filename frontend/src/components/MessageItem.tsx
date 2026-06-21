import React from 'react';
import { Shield, FileText, Activity, AlertTriangle, Play, Square, Database } from 'lucide-react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  onEntityClick: (type: 'fir' | 'accused' | 'victim', id: string) => void;
  onSpeak: (text: string, isSpeaking: boolean) => void;
  activeSpeechId: string | null;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onEntityClick,
  onSpeak,
  activeSpeechId
}) => {
  const isModel = message.role === 'model';
  const isSpeaking = activeSpeechId === message.id;

  // Custom parser to format bold, tables, lists, and make FIR IDs / Accused names clickable
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    const processTextLine = (text: string) => {
      let parts: React.ReactNode[] = [];
      let lastIndex = 0;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match;

      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        const boldText = match[1];
        
        if (/^FIR-\d{4}$/i.test(boldText)) {
          parts.push(
            <button
              key={`fir-${match.index}`}
              onClick={() => onEntityClick('fir', boldText)}
              className="px-2 py-0.5 rounded bg-[#1E4E8C]/15 hover:bg-[#1E4E8C] border border-[#1E4E8C]/30 text-[#1E4E8C] hover:text-white font-mono text-xs transition-colors cursor-pointer inline-block"
            >
              {boldText}
            </button>
          );
        } else {
          parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-[#0B1F3A]">{boldText}</strong>);
        }
        
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    };

    const flushTable = (index: number) => {
      if (tableHeaders.length > 0 || tableRows.length > 0) {
        elements.push(
          <div key={`table-wrapper-${index}`} className="overflow-x-auto my-3 border border-[#D9E1E8] rounded">
            <table className="chat-markdown-table">
              <thead>
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={`th-${i}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={`tr-${ri}`}>
                    {row.map((cell, ci) => {
                      const trimmedCell = cell.trim();
                      
                      if (/^FIR-\d{4}$/i.test(trimmedCell)) {
                        return (
                          <td key={`td-${ri}-${ci}`}>
                            <button
                              onClick={() => onEntityClick('fir', trimmedCell)}
                              className="px-2 py-0.5 rounded bg-[#1E4E8C]/10 border border-[#1E4E8C]/20 text-[#1E4E8C] hover:bg-[#1E4E8C] hover:text-white font-mono text-[11px] cursor-pointer"
                            >
                              {trimmedCell}
                            </button>
                          </td>
                        );
                      }
                      
                      const isAccusedId = tableHeaders[ci]?.toLowerCase().includes('accused_id') || tableHeaders[ci]?.toLowerCase().includes('accused id');
                      const isVictimId = tableHeaders[ci]?.toLowerCase().includes('victim_id') || tableHeaders[ci]?.toLowerCase().includes('victim id');
                      
                      if (isAccusedId && /^\d+$/.test(trimmedCell)) {
                        return (
                          <td key={`td-${ri}-${ci}`}>
                            <button
                              onClick={() => onEntityClick('accused', trimmedCell)}
                              className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-600 hover:text-white font-mono text-[11px] cursor-pointer"
                            >
                              Suspect #{trimmedCell}
                            </button>
                          </td>
                        );
                      }

                      if (isVictimId && /^\d+$/.test(trimmedCell)) {
                        return (
                          <td key={`td-${ri}-${ci}`}>
                            <button
                              onClick={() => onEntityClick('victim', trimmedCell)}
                              className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-600 hover:text-white font-mono text-[11px] cursor-pointer"
                            >
                              Victim #{trimmedCell}
                            </button>
                          </td>
                        );
                      }

                      return <td key={`td-${ri}-${ci}`}>{trimmedCell}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableHeaders = [];
        tableRows = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('|')) {
        inTable = true;
        if (trimmed.includes('---')) {
          return;
        }
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (tableHeaders.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else {
        if (inTable) {
          flushTable(index);
          inTable = false;
        }
      }

      if (trimmed.startsWith('###')) {
        elements.push(
          <h4 key={`h4-${index}`} className="text-xs font-bold text-[#1E4E8C] uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1.5 border-b border-[#D9E1E8] pb-1">
            <Activity className="w-3.5 h-3.5" />
            {processTextLine(trimmed.replace('###', '').trim())}
          </h4>
        );
      } else if (trimmed.startsWith('##')) {
        elements.push(
          <h3 key={`h3-${index}`} className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wider mt-4 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C79A2B]" />
            {processTextLine(trimmed.replace('##', '').trim())}
          </h3>
        );
      } else if (trimmed.startsWith('#')) {
        elements.push(
          <h2 key={`h2-${index}`} className="text-base font-bold text-[#0B1F3A] border-l-4 border-[#C79A2B] pl-2 mt-4 mb-2">
            {processTextLine(trimmed.replace('#', '').trim())}
          </h2>
        );
      }
      else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        elements.push(
          <li key={`li-${index}`} className="text-xs text-slate-700 ml-4 mb-1 list-none flex items-start gap-1.5">
            <span className="text-[#C79A2B] mt-0.5">•</span>
            <span>{processTextLine(trimmed.substring(1).trim())}</span>
          </li>
        );
      }
      else if (trimmed === '') {
        elements.push(<div key={`br-${index}`} className="h-2" />);
      }
      else {
        elements.push(
          <p key={`p-${index}`} className="text-xs text-slate-700 leading-relaxed mb-2">
            {processTextLine(trimmed)}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  // Helper to dynamically slice text into clean structural sections for the official grid
  const parseIntoSections = (content: string) => {
    const lines = content.split('\n');
    let summary: string[] = [];
    let evidence: string[] = [];
    let recommendations: string[] = [];
    let currentSection: 'summary' | 'evidence' | 'recommendations' = 'summary';

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.startsWith('### evidence') || lower.startsWith('### results') || line.includes('|')) {
        currentSection = 'evidence';
      } else if (lower.startsWith('### recommendations') || lower.startsWith('### insights') || lower.startsWith('### caution') || lower.startsWith('### alert')) {
        currentSection = 'recommendations';
      }

      if (currentSection === 'summary') {
        summary.push(line);
      } else if (currentSection === 'evidence') {
        evidence.push(line);
      } else {
        recommendations.push(line);
      }
    });

    return {
      summary: summary.join('\n').trim(),
      evidence: evidence.join('\n').trim(),
      recommendations: recommendations.join('\n').trim(),
    };
  };

  const sections = isModel ? parseIntoSections(message.content) : null;

  // 1. Investigator Query (User Message) - Aligned Right
  if (!isModel) {
    return (
      <div className="flex justify-end px-6 py-2 animate-in fade-in duration-200">
        <div className="max-w-2xl bg-[#EBF1F6] border border-[#1E4E8C]/20 rounded-lg p-4 shadow-sm text-right select-text">
          <div className="flex justify-between items-center gap-10 text-[9px] font-bold text-[#1E4E8C] uppercase tracking-wider mb-1">
            <span className="font-mono">Log ID: #USR-{message.id.slice(-4)}</span>
            <span>Investigator Query</span>
          </div>
          <p className="text-xs font-mono font-semibold text-[#0B1F3A] leading-relaxed text-left">
            &gt; {message.content}
          </p>
        </div>
      </div>
    );
  }

  // 2. Crime Intelligence Findings (AI Response) - Aligned Left
  return (
    <div className="flex justify-start px-6 py-2.5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-[#D9E1E8] rounded-lg shadow-sm overflow-hidden select-text">
        {/* Findings Header */}
        <div className="bg-[#0B1F3A] px-4 py-2.5 border-b border-[#C79A2B] flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C79A2B]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Crime Intelligence Findings</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSpeak(message.content, isSpeaking)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${
                isSpeaking
                  ? 'bg-red-700 hover:bg-red-800 border-red-500 text-white'
                  : 'bg-[#1E4E8C] hover:bg-[#1E4E8C]/80 border-[#C79A2B]/40 text-[#C79A2B]'
              }`}
              title={isSpeaking ? 'Mute Speech' : 'Play audio transcript'}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-2.5 h-2.5 text-white fill-white shrink-0" />
                  Mute
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 text-[#C79A2B] fill-[#C79A2B] shrink-0" />
                  Speak
                </>
              )}
            </button>
          </div>
        </div>

        {/* Grid of Sections */}
        <div className="p-4 space-y-3.5">
          {/* Row 1: Summary Card */}
          {sections && sections.summary && (
            <div className="bg-[#F4F6F8]/30 border border-[#D9E1E8] rounded p-3">
              <h4 className="text-[9px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5 pb-0.5 border-b border-[#D9E1E8]/70 flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#1E4E8C]" /> Summary
              </h4>
              <div className="text-xs text-slate-700 leading-relaxed">
                {renderFormattedContent(sections.summary)}
              </div>
            </div>
          )}

          {/* Row 2: Evidence & Grid Results Card */}
          {sections && sections.evidence && (
            <div className="bg-[#F4F6F8]/30 border border-[#D9E1E8] rounded p-3">
              <h4 className="text-[9px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5 pb-0.5 border-b border-[#D9E1E8]/70 flex items-center gap-1">
                <Database className="w-3 h-3 text-[#1E4E8C]" /> Evidence
              </h4>
              <div className="text-xs text-slate-700">
                {renderFormattedContent(sections.evidence)}
              </div>
            </div>
          )}

          {/* Row 3: Insights and Recommendations Card */}
          {sections && sections.recommendations && (
            <div className="bg-amber-50/20 border border-amber-200/50 rounded p-3">
              <h4 className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1.5 pb-0.5 border-b border-amber-200/60 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-700" /> Recommendations
              </h4>
              <div className="text-xs text-slate-700 leading-relaxed">
                {renderFormattedContent(sections.recommendations)}
              </div>
            </div>
          )}

          {/* SQL & Latency indicator */}
          {message.sql && (
            <div className="pt-2 border-t border-[#D9E1E8] flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span className="flex items-center gap-1"><Database className="w-3 h-3 text-emerald-600"/> Secure Query executed successfully</span>
              {message.queryMetadata?.executionTimeMs && <span>Latency: {message.queryMetadata.executionTimeMs}ms</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

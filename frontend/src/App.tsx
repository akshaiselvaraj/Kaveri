import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, MicOff, Languages, Shield, Loader2, 
  Bell, Activity, AlertTriangle
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { MessageItem } from './components/MessageItem';
import { DetailModal } from './components/DetailViews';
import { api } from './services/api';
import type { Message, Session } from './types';
import { useSpeechToText } from './hooks/useSpeechToText';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';

export default function App() {
  const { t, i18n } = useTranslation();
  const [sessionId, setSessionId] = useState<string>('session-' + Date.now());
  const [history, setHistory] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  
  // Layout toggles
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Lead Investigator');

  // Overlay state
  const [activeModal, setActiveModal] = useState<{ type: 'fir' | 'accused' | 'victim'; id: string } | null>(null);

  // Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Hooks
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();
  const { speak, stop } = useSpeechSynthesis();
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  // Load history list
  useEffect(() => {
    loadSessionHistory();
  }, []);

  // Update text box if speech input completes
  useEffect(() => {
    if (transcript) {
      setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
    }
  }, [transcript]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const loadSessionHistory = async () => {
    try {
      const list = await api.getHistory();
      setHistory(list);
    } catch (e) {
      console.error('Failed to load session logs:', e);
    }
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setMessages([]);
    setErrorText(null);
    setMessages([
      {
        id: 'sys-' + Date.now(),
        role: 'model',
        content: t('system.loaded_session', { id }),
      }
    ]);
  };

  const handleNewChat = () => {
    const newId = 'session-' + Date.now();
    setSessionId(newId);
    setMessages([]);
    setErrorText(null);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userText = inputValue;
    setInputValue('');
    setErrorText(null);

    stop();
    setActiveSpeechId(null);

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userText,
      detectedLang: language
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await api.sendMessage(userText, sessionId, language);
      
      const assistantMessage: Message = {
        id: 'ai-' + Date.now(),
        role: 'model',
        content: response.text,
        sql: response.sql,
        sqlResults: response.sqlResults,
        activeFilters: response.activeFilters,
        activeEntities: response.activeEntities,
        detectedLang: response.detectedLang,
        queryMetadata: response.queryMetadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      loadSessionHistory();

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || t('system.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(language);
    }
  };

  const handleSpeakResponse = (text: string, alreadySpeaking: boolean) => {
    if (alreadySpeaking) {
      stop();
      setActiveSpeechId(null);
    } else {
      const msg = messages.find(m => m.content === text);
      if (msg) {
        speak(text, language);
        setActiveSpeechId(msg.id);
      }
    }
  };

  const triggerExport = async () => {
    try {
      await api.exportPDF(sessionId);
    } catch (e: any) {
      alert(`Report compilation error: ${e.message}`);
    }
  };

  const handleEntityClick = (type: 'fir' | 'accused' | 'victim', id: string) => {
    setActiveModal({ type, id });
  };

  const handleModalNavigate = (type: 'fir' | 'accused' | 'victim', id: string) => {
    setActiveModal({ type, id });
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col w-screen h-screen bg-[#F4F6F8] text-[#1A1A1A] overflow-hidden font-sans">
      
      {/* 1. FIXED TOP HEADER (64px) */}
      <header className="h-16 shrink-0 bg-[#0B1F3A] border-b-2 border-[#C79A2B] px-6 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3.5">
          {/* Government emblems placeholders */}
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center border border-white/20">
              <Shield className="w-4.5 h-4.5 text-[#C79A2B]" />
            </div>
            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center border border-white/20">
              <Activity className="w-4.5 h-4.5 text-[#C79A2B]" />
            </div>
          </div>
          <div className="border-l border-white/20 pl-3.5">
            <h1 className="font-bold text-sm tracking-wide text-white">{t('header.title')}</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#C79A2B] font-bold">{t('header.subtitle')}</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-4">
          {/* Secure Role Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1E4E8C] border border-[#D9E1E8]/20 rounded text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
            <span>{selectedRole === 'Lead Investigator' ? t('header.role') : selectedRole === 'Intelligence Officer' ? t('header.role_io') : t('header.role_dgp')}</span>
          </div>

          {/* Secure Dialect Selector */}
          <button
            onClick={() => { const newLang = language === 'en' ? 'kn' : 'en'; setLanguage(newLang); i18n.changeLanguage(newLang); }}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded text-xs transition-colors cursor-pointer"
            title="Change translation language"
          >
            <Languages className="w-3.5 h-3.5 text-[#C79A2B]" />
            <span className="font-bold">{language === 'en' ? 'EN' : 'ಕನ್ನಡ'}</span>
          </button>

          {/* Secure notification system */}
          <button className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/15 relative text-slate-300 hover:text-white transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#D32F2F] rounded-full" />
          </button>

          {/* User profile settings trigger */}
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 p-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 cursor-pointer"
          >
            <div className="w-6 h-6 rounded bg-[#1E4E8C] flex items-center justify-center text-[10px] font-bold text-white uppercase border border-[#C79A2B]/40">
              KA
            </div>
            <span className="text-xs font-medium text-slate-200 hidden md:inline">{t('header.admin')}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. Left Navigation Sidebar */}
        <Sidebar
          history={history}
          currentSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onExportPdf={triggerExport}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* 3. Center Chat Viewport */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/50">
          
          {/* Scrollable Conversation History Feed */}
          <div className="flex-1 overflow-y-auto py-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-5 select-none animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded bg-[#1E4E8C]/10 border border-[#1E4E8C]/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#1E4E8C]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-[#0B1F3A] uppercase tracking-wide">{t('main.assistant_title')}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t('main.assistant_desc')}
                  </p>
                </div>

                {/* Suggestions queries prompts chips */}
                <div className="grid grid-cols-2 gap-2.5 w-full pt-4">
                  {[
                    t('main.prompt1'),
                    t('main.prompt2'),
                    t('main.prompt3'),
                    t('main.prompt4'),
                    t('main.prompt5')
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => setInputValue(promptText)}
                      className="p-3 text-left rounded bg-white border border-[#D9E1E8] hover:bg-[#F4F6F8] text-slate-600 hover:text-[#1E4E8C] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-5xl mx-auto">
                {messages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onEntityClick={handleEntityClick}
                    onSpeak={handleSpeakResponse}
                    activeSpeechId={activeSpeechId}
                  />
                ))}
                
                {/* Secure loading pipeline */}
                {isProcessing && (
                  <div className="flex justify-start px-6 py-2.5 animate-pulse">
                    <div className="w-full max-w-4xl bg-white border border-[#D9E1E8] rounded-lg shadow-sm p-4 flex gap-4">
                      <div className="w-6 h-6 rounded bg-[#1E4E8C]/15 flex items-center justify-center text-[#1E4E8C] shrink-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider flex gap-1">
                          {t('main.compiling')}
                          <span className="flex gap-0.5 ml-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E4E8C] typing-dot"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E4E8C] typing-dot"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E4E8C] typing-dot"></span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Secure pipeline error panel */}
            {errorText && (
              <div className="max-w-5xl mx-auto px-6 py-2">
                <div className="p-4 border border-[#D32F2F]/20 bg-red-50 text-[#D32F2F] rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D32F2F]" />
                  <span className="font-semibold">{errorText}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Fixed secure input command bar */}
          <div className="p-4 border-t border-[#D9E1E8] bg-white shrink-0 shadow-xs">
            <form onSubmit={handleSendMessage} className="relative flex gap-3 max-w-4xl mx-auto">
              
              {/* Dialect Switch */}
              <div className="relative flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => { const newLang = language === 'en' ? 'kn' : 'en'; setLanguage(newLang); i18n.changeLanguage(newLang); }}
                  className="h-11 px-3.5 rounded border border-[#D9E1E8] bg-white hover:bg-slate-50 text-[#1E4E8C] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Toggle translation dialects"
                >
                  <Languages className="w-3.5 h-3.5 text-[#C79A2B]" />
                  <span>{language === 'en' ? 'EN' : 'KN'}</span>
                </button>
              </div>

              {/* Secure Input prompt field */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('main.input_placeholder')}
                  disabled={isProcessing}
                  className="w-full h-11 pl-4 pr-12 rounded border border-[#D9E1E8] bg-[#F4F6F8]/60 text-[#1A1A1A] placeholder-slate-400 focus:outline-none focus:border-[#1E4E8C] text-xs font-mono"
                />
                
                {/* Speech Dictation micro toggle */}
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded transition-all cursor-pointer ${
                    isListening
                      ? 'text-[#D32F2F] bg-red-50 border border-[#D32F2F]/20 animate-pulse'
                      : 'text-slate-400 hover:text-[#1E4E8C]'
                  }`}
                  title="Speech transcription dictation"
                >
                  {isListening ? <Mic className="w-4 h-4 text-[#D32F2F]" /> : <MicOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Query submission action */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="h-11 px-5 rounded bg-[#1E4E8C] hover:bg-[#1E4E8C]/80 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                Execute query
              </button>
            </form>
          </div>
        </main>

        {/* 4. Collapsible Right Context Panel */}
        <RightPanel
          lastMessage={lastMessage}
          isOpen={isRightPanelOpen}
          onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />
      </div>

      {/* 5. Dossier Details Overlay Drawer */}
      {activeModal && (
        <DetailModal
          type={activeModal.type}
          id={activeModal.id}
          onClose={() => setActiveModal(null)}
          onNavigate={handleModalNavigate}
        />
      )}

      {/* Settings Modal Popup Dialog */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-[#D9E1E8] rounded-lg overflow-hidden shadow-2xl flex flex-col p-6 animate-in fade-in zoom-in duration-150 space-y-4">
            <h2 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wide border-b border-[#D9E1E8] pb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C79A2B]" /> {t('settings.title')}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">{t('settings.role_label')}</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#D9E1E8] bg-[#F4F6F8]/30 text-xs focus:outline-none"
                >
                  <option value="Lead Investigator">{t('header.role')}</option>
                  <option value="Intelligence Officer">{t('header.role_io')}</option>
                  <option value="Director General of Police">{t('header.role_dgp')}</option>
                </select>
              </div>

              <div className="pt-2">
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{t('settings.model_label')}</span>
                <div className="p-3 bg-slate-50 border border-[#D9E1E8] rounded flex justify-between items-center text-xs">
                  <span className="text-[#0B1F3A] font-semibold">Gemini 1.5 Flash</span>
                  <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-[#2E7D32] font-bold text-[9px] rounded">{t('settings.active_secure')}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{t('settings.db_label')}</span>
                <div className="p-3 bg-slate-50 border border-[#D9E1E8] rounded flex justify-between items-center text-xs">
                  <span className="text-[#0B1F3A] font-semibold">SQLite Engine // pgsql fallback</span>
                  <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-[#2E7D32] font-bold text-[9px] rounded">{t('settings.local_seed')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-[#1E4E8C] hover:bg-[#1E4E8C]/80 text-white rounded font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                {t('settings.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

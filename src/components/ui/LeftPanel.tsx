import React, { useRef, useState, useEffect } from 'react';
import { Send, Bot, KeyRound, Play, Square, Video, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { RunwayCameraAngle } from '../../types';

const QUICK_COMMANDS = ['앉아', '손', '점프', '런웨이 걷자', '산책 가자', '사랑해'];

export const LeftPanel: React.FC = () => {
  const worldMode = useMetaverseStore((s) => s.worldMode);
  const messages = useMetaverseStore((s) => s.messages);
  const isAiThinking = useMetaverseStore((s) => s.isAiThinking);
  const llmProvider = useMetaverseStore((s) => s.llmProvider);
  const llmApiKey = useMetaverseStore((s) => s.llmApiKey);
  const runway = useMetaverseStore((s) => s.runway);

  const sendChatCommand = useMetaverseStore((s) => s.sendChatCommand);
  const setLlmConfig = useMetaverseStore((s) => s.setLlmConfig);
  const toggleRunwayShow = useMetaverseStore((s) => s.toggleRunwayShow);
  const setRunwayCameraAngle = useMetaverseStore((s) => s.setRunwayCameraAngle);
  const toggleRunwayAutoCamera = useMetaverseStore((s) => s.toggleRunwayAutoCamera);

  const [input, setInput] = useState('');
  const [showLlmSettings, setShowLlmSettings] = useState(false);
  const [keyDraft, setKeyDraft] = useState(llmApiKey);
  const [providerDraft, setProviderDraft] = useState<'gemini' | 'openai'>(llmProvider);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    void sendChatCommand(input);
    setInput('');
  };

  const camButtons: { id: RunwayCameraAngle; label: string }[] = [
    { id: 'front', label: '정면 트래킹' },
    { id: 'low', label: '로우 앵글' },
    { id: 'orbit360', label: '360° 회전' }
  ];

  return (
    <aside className="fixed left-3 top-[76px] bottom-[92px] w-[310px] max-w-[calc(100vw-24px)] z-30 flex flex-col gap-2.5 pointer-events-none">
      {/* World 3 Runway Director Control Card */}
      {worldMode === 'runway' && (
        <div className="glass-panel pointer-events-auto rounded-2xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>AI 패션쇼 런웨이 디렉터</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500">
              {runway.isActive ? 'ON AIR' : 'STANDBY'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{runway.phaseLabel}</p>

          <button
            onClick={toggleRunwayShow}
            className={`w-full py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-md ${
              runway.isActive
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500 text-white hover:brightness-110'
            }`}
          >
            {runway.isActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> 패션쇼 일시정지
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> 패션쇼 시작
              </>
            )}
          </button>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold">
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> 시네마틱 카메라
              </span>
              <button
                onClick={toggleRunwayAutoCamera}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  runway.autoCamera
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-600 dark:text-emerald-300'
                    : 'border-black/15 dark:border-white/15 text-slate-500'
                }`}
              >
                자동 전환 {runway.autoCamera ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {camButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setRunwayCameraAngle(btn.id)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                    !runway.autoCamera && runway.cameraAngle === btn.id
                      ? 'bg-rose-500 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/15'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Companion Chat & Training Panel */}
      <div className="glass-panel pointer-events-auto rounded-2xl p-3.5 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span>AI 교감 &amp; 명령 훈련</span>
          </div>
          <button
            onClick={() => setShowLlmSettings((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10"
          >
            <KeyRound className="w-3 h-3" />
            <span>{llmApiKey ? 'LLM 연결됨' : 'API 설정'}</span>
            {showLlmSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Optional Real LLM API Key Config */}
        {showLlmSettings && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
            <div className="flex gap-1">
              {(['gemini', 'openai'] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setProviderDraft(prov)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold ${
                    providerDraft === prov
                      ? 'bg-indigo-500 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {prov === 'gemini' ? 'Gemini API' : 'OpenAI API'}
                </button>
              ))}
            </div>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="API 키 입력 (미입력 시 내장 AI 작동)"
              className="w-full px-2.5 py-1.5 rounded-lg text-[11px] bg-white/80 dark:bg-slate-800/90 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setLlmConfig(providerDraft, keyDraft);
                setShowLlmSettings(false);
              }}
              className="w-full py-1 rounded-lg bg-indigo-500 text-white text-[11px] font-bold hover:bg-indigo-600"
            >
              설정 적용
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 mb-2.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-2.5 py-2 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'ml-6 bg-rose-500 text-white'
                  : m.sender === 'visitor'
                  ? 'mr-4 bg-emerald-500/15 border border-emerald-400/30 text-emerald-900 dark:text-emerald-100'
                  : m.sender === 'system'
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 text-[11px]'
                  : 'mr-4 bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-100'
              }`}
            >
              {m.senderName && m.sender !== 'system' && (
                <div className="text-[10px] font-extrabold opacity-80 mb-0.5">{m.senderName}</div>
              )}
              <div>{m.text}</div>
              <div className="text-[9px] opacity-60 mt-0.5 text-right">{m.timestamp}</div>
            </div>
          ))}
          {isAiThinking && (
            <div className="mr-8 rounded-xl px-2.5 py-1.5 text-[11px] bg-black/5 dark:bg-white/10 text-slate-500 animate-pulse">
              AI 두뇌가 생각하는 중...
            </div>
          )}
        </div>

        {/* Quick Command Chips */}
        <div className="flex flex-wrap gap-1 mb-2">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => void sendChatCommand(cmd)}
              className="px-2 py-1 rounded-full text-[10.5px] font-bold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-rose-500 hover:text-white transition"
            >
              "{cmd}"
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="명령어나 대화를 입력하세요..."
            className="flex-1 min-w-0 px-3 py-2 rounded-xl text-xs bg-white/80 dark:bg-slate-800/85 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 outline-none focus:border-rose-400"
          />
          <button
            type="submit"
            aria-label="전송"
            className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};

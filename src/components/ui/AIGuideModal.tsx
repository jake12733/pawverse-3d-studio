import React, { useState } from 'react';
import { X, ExternalLink, FolderCode, Layers } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { AI_GUIDE_CATEGORIES, AI_PIPELINE_GUIDE } from '../../data/catalog';
import { AIToolGuideItem } from '../../types';

export const AIGuideModal: React.FC = () => {
  const showGuideModal = useMetaverseStore((s) => s.showGuideModal);
  const setShowGuideModal = useMetaverseStore((s) => s.setShowGuideModal);
  const [category, setCategory] = useState<AIToolGuideItem['category'] | 'all'>('all');

  if (!showGuideModal) return null;

  const filtered =
    category === 'all' ? AI_PIPELINE_GUIDE : AI_PIPELINE_GUIDE.filter((item) => item.category === category);

  const badgeStyle = (p: AIToolGuideItem['pricing']) => {
    if (p === '무료') return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400/40';
    if (p === '부분무료') return 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-400/40';
    return 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-400/40';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          <div>
            <span className="inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 mb-1">
              WORLD 4 · INTERACTIVE AI PIPELINE HUB
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              AI 메타버스 에셋 제작 &amp; 교체 파이프라인 가이드
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              현재 절차적 3D 프로토타입의 각 요소를 상용 수준의 고퀄리티 AI 콘텐츠로 업그레이드할 때 사용하는 핵심 AI 도구 가이드입니다.
            </p>
          </div>
          <button
            onClick={() => setShowGuideModal(false)}
            className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-6 py-3 border-b border-black/10 dark:border-white/10 flex flex-wrap gap-2">
          {AI_GUIDE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                category === c.id
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow'
                  : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/15'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="p-6 overflow-y-auto custom-scroll grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl p-4 bg-white/70 dark:bg-slate-800/70 border border-black/10 dark:border-white/10 flex flex-col gap-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{item.name}</h3>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${badgeStyle(item.pricing)}`}>
                  {item.pricing}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-indigo-600 dark:text-indigo-300">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>{item.stage}</span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{item.summary}</p>

              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-slate-900/70 border border-black/10 dark:border-white/10 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-rose-600 dark:text-rose-300">
                  <FolderCode className="w-3.5 h-3.5 shrink-0" />
                  <span>에셋 교체 경로</span>
                </div>
                <div className="font-mono text-[10.5px] text-slate-700 dark:text-slate-300 break-all">{item.assetPath}</div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">💡 {item.tip}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold shrink-0 hover:opacity-85"
                >
                  열기 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

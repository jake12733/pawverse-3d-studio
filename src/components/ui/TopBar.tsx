import React from 'react';
import { Home, Trees, Sparkles, BookOpen, Sun, Moon, HelpCircle, SlidersHorizontal, Coins } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { WorldMode } from '../../types';

const WORLD_TABS: { id: WorldMode; label: string; icon: React.ReactNode }[] = [
  { id: 'myroom', label: '내 펫 하우스', icon: <Home className="w-4 h-4" /> },
  { id: 'park', label: '커뮤니티 광장', icon: <Trees className="w-4 h-4" /> },
  { id: 'runway', label: 'AI 패션쇼', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'guide', label: 'AI 제작 가이드', icon: <BookOpen className="w-4 h-4" /> }
];

export const TopBar: React.FC = () => {
  const worldMode = useMetaverseStore((s) => s.worldMode);
  const showGuideModal = useMetaverseStore((s) => s.showGuideModal);
  const theme = useMetaverseStore((s) => s.theme);
  const points = useMetaverseStore((s) => s.points);
  const stats = useMetaverseStore((s) => s.stats);
  const pet = useMetaverseStore((s) => s.pet);
  const showRightDrawer = useMetaverseStore((s) => s.showRightDrawer);

  const setWorldMode = useMetaverseStore((s) => s.setWorldMode);
  const toggleTheme = useMetaverseStore((s) => s.toggleTheme);
  const setShowWelcomeModal = useMetaverseStore((s) => s.setShowWelcomeModal);
  const setShowRightDrawer = useMetaverseStore((s) => s.setShowRightDrawer);

  const gauges = [
    { label: '포만감', value: stats.fullness, color: 'bg-amber-400' },
    { label: '청결도', value: stats.cleanliness, color: 'bg-sky-400' },
    { label: '에너지', value: stats.energy, color: 'bg-emerald-400' },
    { label: '친밀도', value: stats.affection, color: 'bg-rose-400' }
  ];

  return (
    <header className="fixed top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      {/* Brand + Pet Status */}
      <div className="glass-panel pointer-events-auto rounded-2xl px-3.5 py-2 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-400 flex items-center justify-center text-white text-lg shadow-lg">
          🐾
        </div>
        <div className="leading-tight">
          <div className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
            PawVerse <span className="text-rose-500">3D</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {pet.name} · All-in-One AI Metaverse
          </div>
        </div>
      </div>

      {/* 4-World Mode Switcher */}
      <nav
        aria-label="4대 3D 월드 전환"
        className="glass-panel pointer-events-auto rounded-2xl p-1.5 flex items-center gap-1"
      >
        {WORLD_TABS.map((tab) => {
          const isActive = tab.id === 'guide' ? showGuideModal : worldMode === tab.id && !showGuideModal;
          return (
            <button
              key={tab.id}
              onClick={() => setWorldMode(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Live 4-Stat Gauges + Points + Controls */}
      <div className="glass-panel pointer-events-auto rounded-2xl px-3 py-2 flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-2.5 pr-2 border-r border-black/10 dark:border-white/15">
          {gauges.map((g) => (
            <div key={g.label} className="w-16">
              <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5">
                <span>{g.label}</span>
                <span>{g.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${g.color}`} style={{ width: `${g.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-extrabold">
          <Coins className="w-3.5 h-3.5" />
          <span>{points.toLocaleString()} P</span>
        </div>

        <button
          onClick={toggleTheme}
          title="라이트 / 다크 모드 전환"
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowWelcomeModal(true)}
          title="웰컴 가이드 보기"
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowRightDrawer(!showRightDrawer)}
          title="커스터마이징 패널 토글"
          className={`p-2 rounded-xl transition ${
            showRightDrawer
              ? 'bg-rose-500 text-white'
              : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

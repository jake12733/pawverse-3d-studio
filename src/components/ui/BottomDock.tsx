import React from 'react';
import { Utensils, Heart, Droplets, Moon, Camera, Hammer, Footprints } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';

export const BottomDock: React.FC = () => {
  const worldMode = useMetaverseStore((s) => s.worldMode);
  const petAction = useMetaverseStore((s) => s.petAction);
  const petFollowPlayer = useMetaverseStore((s) => s.petFollowPlayer);
  const decorateMode = useMetaverseStore((s) => s.room.decorateMode);

  const careFeed = useMetaverseStore((s) => s.careFeed);
  const carePet = useMetaverseStore((s) => s.carePet);
  const careBath = useMetaverseStore((s) => s.careBath);
  const careSleep = useMetaverseStore((s) => s.careSleep);
  const togglePetFollow = useMetaverseStore((s) => s.togglePetFollow);
  const toggleDecorateMode = useMetaverseStore((s) => s.toggleDecorateMode);
  const showToast = useMetaverseStore((s) => s.showToast);

  const handleScreenshot = () => {
    const dataUrl = window.__capturePawVerse3D?.();
    if (!dataUrl) {
      showToast('⚠️ 3D 캔버스 캡처에 실패했습니다.');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pawverse-3d-${worldMode}-${Date.now()}.png`;
    a.click();
    showToast('📸 현재 3D 화면이 고화질 PNG로 저장되었습니다!');
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none">
      {/* Crisp Requested Control Guide */}
      <div className="glass-chip px-3.5 py-1 rounded-full text-[11px] font-bold text-slate-800 dark:text-slate-100 shadow-md">
        {worldMode === 'myroom' && decorateMode
          ? '🛠️ 꾸미기 모드: 가구 클릭 선택 → 바닥 클릭으로 위치 이동 | 마우스 드래그: 시점 회전'
          : 'WASD: 이동 | 마우스 드래그: 시점 회전 | 클릭: 상호작용'}
      </div>

      <div className="glass-panel pointer-events-auto rounded-2xl p-1.5 flex items-center gap-1.5 flex-wrap justify-center">
        {worldMode === 'myroom' && (
          <button
            onClick={toggleDecorateMode}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
              decorateMode
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-500 hover:text-white'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>{decorateMode ? '꾸미기 종료' : '3D 공간 꾸미기'}</span>
          </button>
        )}

        <button
          onClick={togglePetFollow}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            petFollowPlayer
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white'
              : 'bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-100 hover:bg-emerald-500 hover:text-white'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span className="hidden sm:inline">{petFollowPlayer ? '같이 걷기 ON' : '자유 탐험'}</span>
        </button>

        <button
          onClick={carePet}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-black/5 dark:bg-white/10 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">쓰다듬기</span>
        </button>

        <button
          onClick={careFeed}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-black/5 dark:bg-white/10 hover:bg-amber-500 hover:text-white transition-all active:scale-95"
        >
          <Utensils className="w-4 h-4" />
          <span className="hidden sm:inline">간식 주기</span>
        </button>

        <button
          onClick={careBath}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-black/5 dark:bg-white/10 hover:bg-sky-500 hover:text-white transition-all active:scale-95"
        >
          <Droplets className="w-4 h-4" />
          <span className="hidden sm:inline">목욕/빗질</span>
        </button>

        <button
          onClick={careSleep}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-black/5 dark:bg-white/10 hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
        >
          <Moon className="w-4 h-4" />
          <span className="hidden sm:inline">{petAction === 'sleep' ? '깨우기' : '재우기'}</span>
        </button>

        <button
          onClick={handleScreenshot}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-black/5 dark:bg-white/10 hover:bg-fuchsia-500 hover:text-white transition-all active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">사진 촬영</span>
        </button>
      </div>
    </div>
  );
};

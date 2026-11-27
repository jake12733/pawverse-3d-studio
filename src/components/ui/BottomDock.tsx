import React from 'react';
import { Utensils, Heart, Droplets, Moon, Camera, CircleDot } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';

export const BottomDock: React.FC = () => {
  const worldMode = useMetaverseStore((s) => s.worldMode);
  const petAction = useMetaverseStore((s) => s.petAction);
  const careFeed = useMetaverseStore((s) => s.careFeed);
  const carePet = useMetaverseStore((s) => s.carePet);
  const careBath = useMetaverseStore((s) => s.careBath);
  const careSleep = useMetaverseStore((s) => s.careSleep);
  const triggerRoomBallFetch = useMetaverseStore((s) => s.triggerRoomBallFetch);
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

  const actions = [
    { label: '밥/간식', icon: <Utensils className="w-4 h-4" />, onClick: careFeed, accent: 'hover:bg-amber-500' },
    { label: '쓰다듬기', icon: <Heart className="w-4 h-4" />, onClick: carePet, accent: 'hover:bg-rose-500' },
    { label: '목욕/빗질', icon: <Droplets className="w-4 h-4" />, onClick: careBath, accent: 'hover:bg-sky-500' },
    {
      label: petAction === 'sleep' ? '깨우기' : '재우기',
      icon: <Moon className="w-4 h-4" />,
      onClick: careSleep,
      accent: 'hover:bg-indigo-500'
    },
    ...(worldMode === 'myroom'
      ? [{ label: '공 던지기', icon: <CircleDot className="w-4 h-4" />, onClick: triggerRoomBallFetch, accent: 'hover:bg-lime-600' }]
      : []),
    { label: '사진 촬영', icon: <Camera className="w-4 h-4" />, onClick: handleScreenshot, accent: 'hover:bg-fuchsia-500' }
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none">
      <div className="glass-chip px-3 py-0.5 rounded-full text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        {worldMode === 'myroom' && '🖱️ 마우스 드래그 회전 · 바닥의 초록 공 클릭 시 자율 물어오기'}
        {worldMode === 'park' && '⌨️ WASD / 방향키 또는 잔디 클릭 산책 · 보물상자(+150P) & NPC 인사'}
        {worldMode === 'runway' && '✨ 좌측 패널 [패션쇼 시작] 클릭 · 우측 패널에서 런웨이 의상 실시간 교체'}
      </div>

      <div className="glass-panel pointer-events-auto rounded-2xl p-1.5 flex items-center gap-1.5">
        {actions.map((act) => (
          <button
            key={act.label}
            onClick={act.onClick}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-black/5 dark:bg-white/10 ${act.accent} hover:text-white transition-all active:scale-95`}
          >
            {act.icon}
            <span className="hidden sm:inline">{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

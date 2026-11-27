import React from 'react';
import { Home, Trees, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';

export const WelcomeModal: React.FC = () => {
  const showWelcomeModal = useMetaverseStore((s) => s.showWelcomeModal);
  const setShowWelcomeModal = useMetaverseStore((s) => s.setShowWelcomeModal);
  const setWorldMode = useMetaverseStore((s) => s.setWorldMode);

  if (!showWelcomeModal) return null;

  const worlds = [
    {
      icon: <Home className="w-5 h-5 text-amber-400" />,
      title: '1. 마이룸 & 3D 인테리어',
      desc: '벽지·바닥재·낮/밤/네온 조명 전환 및 바닥의 장난감 공 클릭 시 자율 물어오기!'
    },
    {
      icon: <Trees className="w-5 h-5 text-emerald-400" />,
      title: '2. 가상 산책 공원 & 광장',
      desc: 'WASD·클릭 산책, 숨겨진 보물상자(+150P), AI NPC 3마리와 꼬리 흔들기 하트 교감!'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-rose-400" />,
      title: '3. AI 패션쇼 런웨이',
      desc: '네온 후드·한복 퓨전 망토 입고 스포트라이트 워킹 + 자동 시네마틱 카메라 연출!'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
      title: '4. AI 파이프라인 & GLB 교체',
      desc: 'Meshy/TripoSR/Skybox/Kling/Suno AI 제작 가이드 + 로컬 .GLB 3D 모델 즉시 교체!'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl max-w-2xl w-full p-6 md:p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-400 flex items-center justify-center text-2xl shadow-lg">
            🐾
          </div>
          <div>
            <span className="text-[11px] font-extrabold tracking-wider text-rose-500 uppercase">
              ALL-IN-ONE 3D PET METAVERSE &amp; AI SHOWCASE
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              PawVerse 3D Studio에 오신 걸 환영합니다!
            </h1>
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Three.js(@react-three/fiber) 기반 절차적 3D 그래픽으로 외부 유료 에셋 없이 즉시 실행되며,
          우측 패널에서 <strong>테스트 포인트 5,000 P</strong>로 의상·인테리어를 바로 꾸미거나
          외부 AI 툴로 뽑은 <code>.glb</code> 3D 모델을 즉시 교체할 수 있습니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {worlds.map((w) => (
            <div
              key={w.title}
              className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1"
            >
              <div className="flex items-center gap-2 font-extrabold text-xs text-slate-900 dark:text-white">
                {w.icon}
                <span>{w.title}</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            onClick={() => {
              setShowWelcomeModal(false);
              setWorldMode('guide');
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/10"
          >
            🤖 AI 제작 가이드 먼저 보기
          </button>
          <button
            onClick={() => setShowWelcomeModal(false)}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg flex items-center gap-1.5 hover:brightness-110"
          >
            <span>3D 메타버스 입장하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { MetaverseScene } from './components/three/MetaverseScene';
import { TopBar } from './components/ui/TopBar';
import { LeftPanel } from './components/ui/LeftPanel';
import { BottomDock } from './components/ui/BottomDock';
import { RightDrawer } from './components/ui/RightDrawer';
import { AIGuideModal } from './components/ui/AIGuideModal';
import { WelcomeModal } from './components/ui/WelcomeModal';
import { useMetaverseStore } from './store/useMetaverseStore';

export const App: React.FC = () => {
  const toastMessage = useMetaverseStore((s) => s.toastMessage);
  const tickStatsDecay = useMetaverseStore((s) => s.tickStatsDecay);

  // Real-time gentle stat tick loop
  useEffect(() => {
    const id = setInterval(() => {
      tickStatsDecay();
    }, 30000);
    return () => clearInterval(id);
  }, [tickStatsDecay]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 text-slate-900 dark:text-white">
      {/* Fullscreen Interactive Three.js 3D Canvas */}
      <MetaverseScene />

      {/* Minimalist Glassmorphism HUD Overlays */}
      <TopBar />
      <LeftPanel />
      <RightDrawer />
      <BottomDock />

      {/* Interactive Modals */}
      <WelcomeModal />
      <AIGuideModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-2xl border border-white/15 pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;

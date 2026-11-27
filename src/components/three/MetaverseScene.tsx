import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { MyRoomWorld } from './MyRoomWorld';
import { WalkParkWorld } from './WalkParkWorld';
import { RunwayWorld } from './RunwayWorld';

declare global {
  interface Window {
    __capturePawVerse3D?: () => string | null;
  }
}

function SceneCameraResetAndCapture() {
  const { gl, camera } = useThree();
  const worldMode = useMetaverseStore((s) => s.worldMode);

  useEffect(() => {
    window.__capturePawVerse3D = () => {
      try {
        return gl.domElement.toDataURL('image/png');
      } catch {
        return null;
      }
    };
    return () => {
      delete window.__capturePawVerse3D;
    };
  }, [gl]);

  useEffect(() => {
    if (worldMode === 'myroom') {
      camera.position.set(0, 2.9, 6.2);
      camera.lookAt(0, 0.8, 0);
    } else if (worldMode === 'park') {
      camera.position.set(0, 5.8, 10.5);
      camera.lookAt(0, 0.7, 2);
    } else if (worldMode === 'runway') {
      camera.position.set(0, 1.85, 6.4);
      camera.lookAt(0, 0.9, 1);
    }
  }, [worldMode, camera]);

  return null;
}

export const MetaverseScene: React.FC = () => {
  const worldMode = useMetaverseStore((s) => s.worldMode);
  const runwayActive = useMetaverseStore((s) => s.runway.isActive);

  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 46, near: 0.1, far: 120, position: [0, 2.9, 6.2] }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <SceneCameraResetAndCapture />

        {worldMode === 'myroom' && <MyRoomWorld />}
        {worldMode === 'park' && <WalkParkWorld />}
        {worldMode === 'runway' && <RunwayWorld />}

        {!(worldMode === 'runway' && runwayActive) && worldMode !== 'park' && (
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={2.8}
            maxDistance={11}
            maxPolarAngle={Math.PI / 2 - 0.06}
            target={[0, 0.85, 0]}
          />
        )}

        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={1.05} intensity={0.72} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

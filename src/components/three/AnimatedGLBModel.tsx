import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

export type GLBMotionState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'sit'
  | 'paw'
  | 'sleep'
  | 'eat'
  | 'bath'
  | 'pet'
  | 'runway_pose';

interface AnimatedGLBModelProps {
  url: string;
  targetHeight: number;
  motionState: GLBMotionState;
  facingOffsetY?: number;
  fallback: React.ReactNode;
  onLoadedInfo?: (info: { clipNames: string[]; hasWalkClip: boolean }) => void;
}

/** Cache HEAD availability checks so missing public/models/*.glb never spam 404 errors */
const availabilityCache = new Map<string, boolean>();

export function useGlbAvailable(url: string | null): boolean {
  const [available, setAvailable] = useState<boolean>(() => {
    if (!url) return false;
    if (url.startsWith('blob:') || url.startsWith('data:')) return true;
    return availabilityCache.get(url) ?? false;
  });

  useEffect(() => {
    if (!url) {
      setAvailable(false);
      return;
    }
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      setAvailable(true);
      return;
    }
    if (availabilityCache.has(url)) {
      setAvailable(availabilityCache.get(url)!);
      return;
    }

    let cancelled = false;
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        // GitHub Pages / Vite SPA fallback returns text/html for missing files
        const ok = res.ok && !ct.includes('text/html');
        availabilityCache.set(url, ok);
        if (!cancelled) setAvailable(ok);
      })
      .catch(() => {
        availabilityCache.set(url, false);
        if (!cancelled) setAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return available;
}

class GLBErrorBoundary extends Component<
  { fallback: React.ReactNode; resetKey: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; resetKey: string; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function GLBInner({
  url,
  targetHeight,
  motionState,
  facingOffsetY = 0,
  onLoadedInfo
}: Omit<AnimatedGLBModelProps, 'fallback'>) {
  const { scene, animations } = useGLTF(url);
  const rootRef = useRef<THREE.Group>(null);
  const proceduralRef = useRef<THREE.Group>(null);

  // Clone with SkeletonUtils so SkinnedMesh bones remain cleanly bound per instance
  const { clonedScene, scaleFactor, offset } = useMemo(() => {
    const cloned = cloneSkinned(scene) as THREE.Group;
    cloned.updateMatrixWorld(true);

    // Measure original bounding box
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const rawHeight = size.y > 0.001 ? size.y : Math.max(size.x, size.z, 1);
    const s = targetHeight / rawHeight;

    // Apply castShadow / receiveShadow and disable frustum culling for rigged bones
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });

    return {
      clonedScene: cloned,
      scaleFactor: s,
      offset: new THREE.Vector3(-center.x * s, -box.min.y * s, -center.z * s)
    };
  }, [scene, targetHeight]);

  // Bind AnimationMixer via useAnimations
  const { actions, names } = useAnimations(animations, rootRef);

  // Smart clip auto-detection (Mixamo, ReadyPlayerMe, Meshy, Tripo, Khronos Fox, Sketchfab naming)
  const clipMap = useMemo(() => {
    const find = (re: RegExp) => names.find((n) => re.test(n)) || null;
    const walk = find(/walk|trot|stroll|locomotion|move/i);
    const run = find(/run|gallop|sprint|jog|fast/i);
    const idle = find(/idle|stand|breath|rest|wait|survey/i) || names.find((n) => n !== walk && n !== run) || null;
    const jump = find(/jump|hop|leap|happy|bark|dance|wave|agree/i);
    const sit = find(/sit|lay|sleep|down|sad/i);
    return { idle, walk, run, jump, sit };
  }, [names]);

  useEffect(() => {
    if (onLoadedInfo) {
      onLoadedInfo({ clipNames: names, hasWalkClip: Boolean(clipMap.walk || clipMap.run) });
    }
  }, [names, clipMap, onLoadedInfo]);

  // Smooth crossFadeTo animation blending
  const currentClipRef = useRef<string | null>(null);
  useEffect(() => {
    let desired: string | null = clipMap.idle;
    if (motionState === 'walk') desired = clipMap.walk || clipMap.run || clipMap.idle;
    else if (motionState === 'run') desired = clipMap.run || clipMap.walk || clipMap.idle;
    else if (motionState === 'jump' || motionState === 'runway_pose' || motionState === 'pet') {
      desired = clipMap.jump || clipMap.idle;
    } else if (motionState === 'sit' || motionState === 'sleep') {
      desired = clipMap.sit || clipMap.idle;
    }

    if (!desired || !actions[desired]) return;
    if (currentClipRef.current === desired) return;

    const nextAction = actions[desired]!;
    const prevAction = currentClipRef.current ? actions[currentClipRef.current] : null;

    nextAction.reset();
    nextAction.setEffectiveTimeScale(motionState === 'run' ? 1.25 : 1.0);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (prevAction && prevAction !== nextAction) {
      prevAction.crossFadeTo(nextAction, 0.25, true);
    } else {
      nextAction.fadeIn(0.2);
    }

    currentClipRef.current = desired;
  }, [motionState, actions, clipMap]);

  // Procedural motion assistance for static .glb models (or when Walk/Jump clip is missing)
  const hasWalkClip = Boolean(clipMap.walk || clipMap.run);
  const hasIdleClip = Boolean(clipMap.idle);

  useFrame(({ clock }) => {
    if (!proceduralRef.current) return;
    const t = clock.getElapsedTime();

    let yBounce = 0;
    let tiltZ = 0;
    let tiltX = 0;
    let spinY = 0;
    let scaleY = 1;

    if ((motionState === 'walk' || motionState === 'run') && !hasWalkClip) {
      const freq = motionState === 'run' ? 13 : 10;
      const amp = targetHeight * 0.055;
      yBounce = Math.abs(Math.sin(t * freq)) * amp;
      tiltZ = Math.sin(t * freq) * 0.055;
      tiltX = 0.05;
    } else if (motionState === 'jump') {
      yBounce = Math.abs(Math.sin(t * 6.5)) * (targetHeight * 0.42);
      tiltX = -0.1 * Math.sin(t * 6.5);
    } else if (motionState === 'runway_pose') {
      spinY = Math.sin(t * 3.5) * Math.PI * 2;
      yBounce = Math.max(0, Math.sin(t * 7)) * (targetHeight * 0.22);
    } else if (motionState === 'eat') {
      tiltX = 0.22 + Math.sin(t * 9) * 0.07;
    } else if (motionState === 'pet' || motionState === 'bath') {
      tiltZ = Math.sin(t * 9) * 0.075;
      yBounce = Math.abs(Math.sin(t * 9)) * (targetHeight * 0.04);
    } else if (motionState === 'sleep') {
      scaleY = 0.88 + Math.sin(t * 1.8) * 0.02;
      tiltZ = 0.08;
    } else if (!hasIdleClip) {
      // Gentle lifelike breathing for static models
      scaleY = 1 + Math.sin(t * 2.4) * 0.015;
    }

    proceduralRef.current.position.y = THREE.MathUtils.lerp(proceduralRef.current.position.y, yBounce, 0.22);
    proceduralRef.current.rotation.z = THREE.MathUtils.lerp(proceduralRef.current.rotation.z, tiltZ, 0.2);
    proceduralRef.current.rotation.x = THREE.MathUtils.lerp(proceduralRef.current.rotation.x, tiltX, 0.2);
    proceduralRef.current.rotation.y =
      motionState === 'runway_pose'
        ? spinY + facingOffsetY
        : THREE.MathUtils.lerp(proceduralRef.current.rotation.y, facingOffsetY, 0.16);
    proceduralRef.current.scale.y = THREE.MathUtils.lerp(proceduralRef.current.scale.y, scaleY, 0.18);
  });

  return (
    <group ref={proceduralRef}>
      <group ref={rootRef} position={[offset.x, offset.y, offset.z]} scale={scaleFactor}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
}

export const AnimatedGLBModel: React.FC<AnimatedGLBModelProps> = ({
  url,
  targetHeight,
  motionState,
  facingOffsetY = 0,
  fallback,
  onLoadedInfo
}) => {
  return (
    <GLBErrorBoundary fallback={fallback} resetKey={url}>
      <Suspense fallback={fallback}>
        <GLBInner
          url={url}
          targetHeight={targetHeight}
          motionState={motionState}
          facingOffsetY={facingOffsetY}
          onLoadedInfo={onLoadedInfo}
        />
      </Suspense>
    </GLBErrorBoundary>
  );
};

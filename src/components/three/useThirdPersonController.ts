import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ThirdPersonOptions {
  initialPos: [number, number, number];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  speed?: number;
  initialDistance?: number;
  initialPitch?: number;
  initialYaw?: number;
  onMove?: (pos: [number, number, number], rotY: number) => void;
}

/**
 * True 3rd-person metaverse avatar controller:
 * - WASD / Arrow Keys move relative to the current camera yaw
 * - Mouse drag rotates the 3rd-person orbit camera around the player smoothly
 * - Mouse wheel zooms camera distance in/out
 */
export function useThirdPersonController({
  initialPos,
  bounds,
  speed = 4.2,
  initialDistance = 6.2,
  initialPitch = 0.42,
  initialYaw = 0,
  onMove
}: ThirdPersonOptions) {
  const { camera, gl } = useThree();

  const playerPos = useRef(new THREE.Vector3(...initialPos));
  const playerRotY = useRef(0);
  const playerGroupRef = useRef<THREE.Group>(null);
  const [isWalking, setIsWalking] = useState(false);

  const keysRef = useRef<Set<string>>(new Set());
  const yawRef = useRef(initialYaw);
  const pitchRef = useRef(initialPitch);
  const distRef = useRef(initialDistance);
  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  useEffect(() => {
    const dom = gl.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      keysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      dragDistanceRef.current = 0;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      dragDistanceRef.current += Math.hypot(dx, dy);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current -= dx * 0.0065;
      pitchRef.current = THREE.MathUtils.clamp(pitchRef.current + dy * 0.005, 0.16, 1.18);
    };
    const onPointerUp = () => {
      draggingRef.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      distRef.current = THREE.MathUtils.clamp(distRef.current + e.deltaY * 0.004, 3.8, 12.5);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = keysRef.current;

    let forward = 0;
    let right = 0;
    if (keys.has('w') || keys.has('arrowup')) forward += 1;
    if (keys.has('s') || keys.has('arrowdown')) forward -= 1;
    if (keys.has('d') || keys.has('arrowright')) right += 1;
    if (keys.has('a') || keys.has('arrowleft')) right -= 1;

    let moving = false;
    if (forward !== 0 || right !== 0) {
      // Camera-relative horizontal forward & right vectors
      const camForwardX = -Math.sin(yawRef.current);
      const camForwardZ = -Math.cos(yawRef.current);
      const camRightX = Math.cos(yawRef.current);
      const camRightZ = -Math.sin(yawRef.current);

      let moveX = camForwardX * forward + camRightX * right;
      let moveZ = camForwardZ * forward + camRightZ * right;
      const len = Math.hypot(moveX, moveZ) || 1;
      moveX /= len;
      moveZ /= len;

      playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x + moveX * speed * dt, bounds.minX, bounds.maxX);
      playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z + moveZ * speed * dt, bounds.minZ, bounds.maxZ);
      playerRotY.current = Math.atan2(moveX, moveZ);
      moving = true;

      if (onMove) {
        onMove([playerPos.current.x, playerPos.current.y, playerPos.current.z], playerRotY.current);
      }
    }

    if (moving !== isWalking) setIsWalking(moving);

    if (playerGroupRef.current) {
      playerGroupRef.current.position.copy(playerPos.current);
      // Smooth angular interpolation
      let diff = playerRotY.current - playerGroupRef.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      playerGroupRef.current.rotation.y += diff * 0.2;
    }

    // Smooth 3rd-person orbit camera tracking behind & above avatar
    const targetLook = new THREE.Vector3(playerPos.current.x, 1.35, playerPos.current.z);
    const camX = targetLook.x + Math.sin(yawRef.current) * Math.cos(pitchRef.current) * distRef.current;
    const camY = targetLook.y + Math.sin(pitchRef.current) * distRef.current;
    const camZ = targetLook.z + Math.cos(yawRef.current) * Math.cos(pitchRef.current) * distRef.current;

    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.14);
    camera.lookAt(targetLook);
  });

  const wasClick = () => dragDistanceRef.current < 8;

  return {
    playerPos,
    playerRotY,
    playerGroupRef,
    isWalking,
    wasClick
  };
}

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatedGLBModel, useGlbAvailable } from './AnimatedGLBModel';

interface PlayerAvatarProps {
  nickname: string;
  shirtColor: string;
  hairColor?: string;
  skinColor?: string;
  isWalking: boolean;
  isLocalPlayer?: boolean;
  speechText?: string | null;
  waving?: boolean;
  glbUrl?: string | null;
  glbFacingOffsetY?: number;
}

const AVATAR_TARGET_HEIGHT = 1.65;

/**
 * High-quality GLB Human Avatar (1.6m auto-scaled, grounded at y=0, AnimationMixer Idle/Walk blending)
 * with seamless fallback to the articulated procedural 3D avatar when avatar.glb is absent.
 */
export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  nickname,
  shirtColor,
  hairColor = '#1e1b18',
  skinColor = '#f5d0b5',
  isWalking,
  isLocalPlayer = false,
  speechText = null,
  waving = false,
  glbUrl = './models/avatar.glb',
  glbFacingOffsetY = 0
}) => {
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  const hasGlb = useGlbAvailable(glbUrl);

  useFrame(({ clock }) => {
    if (hasGlb) return;
    const t = clock.getElapsedTime();
    const walkSwing = isWalking ? Math.sin(t * 10) * 0.55 : 0;
    const bounce = isWalking ? Math.abs(Math.sin(t * 10)) * 0.06 : Math.sin(t * 2.2) * 0.015;

    if (bodyRef.current) bodyRef.current.position.y = bounce;
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, walkSwing, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -walkSwing, 0.2);
    }
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -walkSwing * 0.8, 0.2);
      if (waving) {
        rightArmRef.current.rotation.x = -2.4;
        rightArmRef.current.rotation.z = -0.35 + Math.sin(t * 10) * 0.28;
      } else {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, walkSwing * 0.8, 0.2);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.08, 0.2);
      }
    }
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * 1.1) * 0.06;
  });

  const proceduralFallback = (
    <group ref={bodyRef}>
      <mesh ref={leftLegRef} castShadow position={[-0.14, 0.42, 0]}>
        <capsuleGeometry args={[0.095, 0.52, 8, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.75} />
      </mesh>
      <mesh ref={rightLegRef} castShadow position={[0.14, 0.42, 0]}>
        <capsuleGeometry args={[0.095, 0.52, 8, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.75} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.06, 0]}>
        <capsuleGeometry args={[0.25, 0.44, 10, 18]} />
        <meshStandardMaterial color={shirtColor} roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0, 1.4, -0.02]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.18, 0.055, 10, 20]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      <mesh ref={leftArmRef} castShadow position={[-0.34, 1.06, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.075, 0.46, 8, 12]} />
        <meshStandardMaterial color={shirtColor} roughness={0.65} />
      </mesh>
      <mesh ref={rightArmRef} castShadow position={[0.34, 1.06, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.075, 0.46, 8, 12]} />
        <meshStandardMaterial color={shirtColor} roughness={0.65} />
      </mesh>
      <group ref={headRef} position={[0, 1.66, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color={skinColor} roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0, 0.06, -0.03]}>
          <sphereGeometry args={[0.255, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color={hairColor} roughness={0.7} />
        </mesh>
        <mesh position={[-0.085, 0.02, 0.215]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color="#18181b" roughness={0.2} />
        </mesh>
        <mesh position={[0.085, 0.02, 0.215]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color="#18181b" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );

  // Calibrated overhead anchor: 1.82m above 1.6m GLB avatar head, or 2.08m above procedural avatar
  const labelHeightY = hasGlb ? AVATAR_TARGET_HEIGHT + 0.24 : 2.08;

  return (
    <group>
      {hasGlb && glbUrl ? (
        <AnimatedGLBModel
          url={glbUrl}
          targetHeight={AVATAR_TARGET_HEIGHT}
          motionState={isWalking ? 'walk' : waving ? 'pet' : 'idle'}
          facingOffsetY={glbFacingOffsetY}
          fallback={proceduralFallback}
        />
      ) : (
        proceduralFallback
      )}

      {/* Ground Player Indicator Ring */}
      {isLocalPlayer && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.42, 0.49, 32]} />
          <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}

      {/* Unified Overhead Stack: Speech Bubble cleanly stacked ABOVE Nameplate */}
      <Html
        position={[0, labelHeightY, 0]}
        center
        zIndexRange={speechText ? [29, 20] : [12, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="flex flex-col items-center gap-1.5 -translate-y-1/2">
          {speechText && (
            <div className="relative w-max max-w-[210px] px-3 py-1.5 rounded-2xl bg-white/95 text-slate-900 text-[12px] font-bold shadow-lg border border-slate-200 text-center leading-snug break-keep">
              {speechText}
              <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45" />
            </div>
          )}
          <div
            className={`w-max px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap border backdrop-blur-md shadow ${
              isLocalPlayer
                ? 'bg-rose-500/92 text-white border-white/35'
                : 'bg-slate-900/80 text-white border-white/20'
            }`}
          >
            {isLocalPlayer ? '★ ' : '👤 '}
            {nickname}
          </div>
        </div>
      </Html>
    </group>
  );
};

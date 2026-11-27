import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerAvatarProps {
  nickname: string;
  shirtColor: string;
  hairColor?: string;
  skinColor?: string;
  isWalking: boolean;
  isLocalPlayer?: boolean;
  speechText?: string | null;
  waving?: boolean;
}

/**
 * Modular 3D Human Avatar (cleanly replaceable with a Ready Player Me / Meshy .glb model).
 * Features articulated walking legs, swinging arms, waving gesture, overhead nickname, and live speech bubble.
 */
export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  nickname,
  shirtColor,
  hairColor = '#1e1b18',
  skinColor = '#f5d0b5',
  isWalking,
  isLocalPlayer = false,
  speechText = null,
  waving = false
}) => {
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const walkSwing = isWalking ? Math.sin(t * 10) * 0.55 : 0;
    const bounce = isWalking ? Math.abs(Math.sin(t * 10)) * 0.06 : Math.sin(t * 2.2) * 0.015;

    if (bodyRef.current) {
      bodyRef.current.position.y = bounce;
    }
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
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.1) * 0.06;
    }
  });

  return (
    <group>
      <group ref={bodyRef}>
        {/* Legs & Sneakers */}
        <mesh ref={leftLegRef} castShadow position={[-0.14, 0.42, 0]}>
          <capsuleGeometry args={[0.095, 0.52, 8, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>
        <mesh ref={rightLegRef} castShadow position={[0.14, 0.42, 0]}>
          <capsuleGeometry args={[0.095, 0.52, 8, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.75} />
        </mesh>

        {/* Hoodie / Shirt Torso */}
        <mesh castShadow receiveShadow position={[0, 1.06, 0]}>
          <capsuleGeometry args={[0.25, 0.44, 10, 18]} />
          <meshStandardMaterial color={shirtColor} roughness={0.62} />
        </mesh>
        {/* Hoodie collar */}
        <mesh castShadow position={[0, 1.4, -0.02]} rotation={[0.25, 0, 0]}>
          <torusGeometry args={[0.18, 0.055, 10, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>

        {/* Articulated Arms */}
        <mesh ref={leftArmRef} castShadow position={[-0.34, 1.06, 0]} rotation={[0, 0, 0.08]}>
          <capsuleGeometry args={[0.075, 0.46, 8, 12]} />
          <meshStandardMaterial color={shirtColor} roughness={0.65} />
        </mesh>
        <mesh ref={rightArmRef} castShadow position={[0.34, 1.06, 0]} rotation={[0, 0, -0.08]}>
          <capsuleGeometry args={[0.075, 0.46, 8, 12]} />
          <meshStandardMaterial color={shirtColor} roughness={0.65} />
        </mesh>

        {/* Head & Stylized Hair */}
        <group ref={headRef} position={[0, 1.66, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.24, 20, 20]} />
            <meshStandardMaterial color={skinColor} roughness={0.65} />
          </mesh>
          {/* Hair Cap */}
          <mesh castShadow position={[0, 0.06, -0.03]}>
            <sphereGeometry args={[0.255, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            <meshStandardMaterial color={hairColor} roughness={0.7} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.085, 0.02, 0.215]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} />
          </mesh>
          <mesh position={[0.085, 0.02, 0.215]}>
            <sphereGeometry args={[0.028, 10, 10]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} />
          </mesh>
          {/* Warm Smile Cheek Highlights */}
          <mesh position={[-0.13, -0.04, 0.19]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#fda4af" transparent opacity={0.55} />
          </mesh>
          <mesh position={[0.13, -0.04, 0.19]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#fda4af" transparent opacity={0.55} />
          </mesh>
        </group>

        {/* Ground Player Indicator Ring */}
        {isLocalPlayer && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.42, 0.49, 32]} />
            <meshStandardMaterial color="#fb7185" emissive="#f43f5e" emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* Overhead Nickname Pill — Lower layer (zIndexRange [10,0]), generous clearance from speech bubble */}
      <Html position={[0, 2.22, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <div
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold whitespace-nowrap border backdrop-blur-md shadow pointer-events-none select-none ${
            isLocalPlayer
              ? 'bg-rose-500/92 text-white border-white/35'
              : 'bg-slate-900/78 text-white border-white/20'
          }`}
        >
          {isLocalPlayer ? '★ ' : '👤 '}
          {nickname}
        </div>
      </Html>

      {/* Live Overhead Speech Bubble — Dedicated high Y offset (2.92) & top zIndexRange [29,20] so it NEVER collides with nameplates */}
      {speechText && (
        <Html position={[0, 2.92, 0]} center distanceFactor={10} zIndexRange={[29, 20]}>
          <div className="relative px-3 py-1.5 rounded-2xl bg-white/96 text-slate-900 text-xs font-bold shadow-xl border border-slate-200 max-w-[210px] text-center leading-snug break-words pointer-events-none select-none">
            {speechText}
            <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
          </div>
        </Html>
      )}
    </group>
  );
};

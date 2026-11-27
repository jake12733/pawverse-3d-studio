import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleEffect, PetAction, PetConfig } from '../../types';
import { AnimatedGLBModel, useGlbAvailable } from './AnimatedGLBModel';

const DOG_TARGET_HEIGHT = 0.65;

interface ProceduralPetProps {
  pet: PetConfig;
  action: PetAction;
  position?: [number, number, number];
  rotationY?: number;
  speechText?: string | null;
  nicknameTag?: string | null;
  particles?: ParticleEffect;
  showHeartBadge?: boolean;
  onClick?: () => void;
}

function PetParticles({ type }: { type: ParticleEffect }) {
  const groupRef = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        angle: (i / 12) * Math.PI * 2,
        radius: 0.45 + (i % 3) * 0.25,
        speed: 0.8 + (i % 4) * 0.25,
        offset: i * 0.4
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      const s = seeds[idx];
      const cycle = ((t * s.speed + s.offset) % 1.4) / 1.4;
      child.position.set(
        Math.cos(s.angle + t * 0.9) * s.radius,
        0.5 + cycle * 1.4,
        Math.sin(s.angle + t * 0.9) * s.radius
      );
      const scale = Math.sin(cycle * Math.PI) * 0.16;
      child.scale.setScalar(Math.max(0.001, scale));
    });
  });

  if (!type) return null;

  const color = type === 'heart' ? '#ff4d79' : type === 'bubble' ? '#7dd3fc' : '#facc15';
  return (
    <group ref={groupRef}>
      {seeds.map((_, i) => (
        <mesh key={i}>
          {type === 'bubble' ? (
            <sphereGeometry args={[1, 14, 14]} />
          ) : type === 'heart' ? (
            <dodecahedronGeometry args={[1, 0]} />
          ) : (
            <octahedronGeometry args={[1, 0]} />
          )}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={type === 'bubble' ? 0.45 : 1.4}
            transparent
            opacity={type === 'bubble' ? 0.65 : 0.95}
            roughness={0.15}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

export const ProceduralPet: React.FC<ProceduralPetProps> = ({
  pet,
  action,
  position = [0, 0, 0],
  rotationY = 0,
  speechText,
  nicknameTag,
  particles = null,
  showHeartBadge = false,
  onClick
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);

  const dims = useMemo(() => {
    switch (pet.breed) {
      case 'corgi':
        return { legH: 0.32, bodyLen: 1.05, bodyR: 0.34, headR: 0.34, earType: 'pointyBig' as const };
      case 'cat':
        return { legH: 0.48, bodyLen: 0.92, bodyR: 0.27, headR: 0.31, earType: 'cat' as const };
      case 'rabbit':
        return { legH: 0.34, bodyLen: 0.78, bodyR: 0.32, headR: 0.30, earType: 'rabbit' as const };
      case 'retriever':
        return { legH: 0.56, bodyLen: 1.08, bodyR: 0.34, headR: 0.35, earType: 'floppy' as const };
      default: // shiba
        return { legH: 0.50, bodyLen: 0.96, bodyR: 0.32, headR: 0.34, earType: 'pointy' as const };
    }
  }, [pet.breed]);

  const lighterFur = useMemo(() => {
    const c = new THREE.Color(pet.furColor);
    c.lerp(new THREE.Color('#fff9f0'), 0.42);
    return `#${c.getHexString()}`;
  }, [pet.furColor]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!bodyRef.current || !headRef.current || !tailRef.current) return;

    // Reset baseline
    let yOffset = 0;
    let bodyPitch = 0;
    let bodySpin = 0;
    let headPitch = 0;
    let headRoll = Math.sin(t * 1.4) * 0.04;
    let tailSpeed = 5;
    let legSwing = 0;
    let pawRaise = 0;

    if (action === 'walk') {
      legSwing = Math.sin(t * 11) * 0.55;
      yOffset = Math.abs(Math.sin(t * 11)) * 0.09;
      bodyPitch = Math.sin(t * 11) * 0.05;
      tailSpeed = 12;
    } else if (action === 'jump') {
      yOffset = Math.abs(Math.sin(t * 6.5)) * 0.85;
      bodyPitch = -0.18 * Math.sin(t * 6.5);
      tailSpeed = 15;
    } else if (action === 'sit') {
      yOffset = -0.16;
      bodyPitch = -0.35;
      headPitch = 0.28;
      tailSpeed = 8;
    } else if (action === 'paw') {
      yOffset = -0.12;
      bodyPitch = -0.3;
      headPitch = 0.2;
      pawRaise = -1.25 + Math.sin(t * 8) * 0.18;
      tailSpeed = 12;
    } else if (action === 'sleep') {
      yOffset = -dims.legH * 0.72;
      headPitch = 0.38;
      headRoll = 0.18;
      tailSpeed = 1.2;
    } else if (action === 'eat') {
      headPitch = 0.55 + Math.sin(t * 10) * 0.14;
      tailSpeed = 14;
    } else if (action === 'bath' || action === 'pet') {
      yOffset = Math.abs(Math.sin(t * 9)) * 0.08;
      headRoll = Math.sin(t * 8) * 0.16;
      tailSpeed = 16;
    } else if (action === 'runway_pose') {
      bodySpin = Math.sin(t * 3.5) * Math.PI * 2;
      yOffset = Math.max(0, Math.sin(t * 7)) * 0.42;
      tailSpeed = 18;
    } else {
      // Idle gentle breathing
      yOffset = Math.sin(t * 2.4) * 0.025;
    }

    bodyRef.current.position.y = dims.legH + yOffset;
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, bodyPitch, 0.16);
    bodyRef.current.rotation.y = action === 'runway_pose' ? bodySpin : THREE.MathUtils.lerp(bodyRef.current.rotation.y, 0, 0.12);

    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headPitch, 0.15);
    headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, headRoll, 0.15);
    tailRef.current.rotation.z = Math.sin(t * tailSpeed) * 0.42;

    if (legFL.current && legFR.current && legBL.current && legBR.current) {
      legFL.current.rotation.x = legSwing;
      legFR.current.rotation.x = pawRaise !== 0 ? pawRaise : -legSwing;
      legBL.current.rotation.x = -legSwing;
      legBR.current.rotation.x = legSwing;
    }
  });

  const proceduralBody = (
    <group ref={bodyRef} position={[0, dims.legH, 0]}>
      {/* Torso */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[dims.bodyR, dims.bodyLen * 0.55, 12, 20]} />
        <meshStandardMaterial color={pet.furColor} roughness={0.78} metalness={0.04} />
      </mesh>
      {/* Chest fluffy cream belly */}
      <mesh castShadow position={[0, -0.04, dims.bodyLen * 0.34]}>
        <sphereGeometry args={[dims.bodyR * 0.78, 16, 16]} />
        <meshStandardMaterial color={lighterFur} roughness={0.85} />
      </mesh>

      {/* 4 Articulated Legs */}
      <mesh ref={legFL} castShadow position={[-dims.bodyR * 0.55, -dims.legH * 0.48, dims.bodyLen * 0.28]}>
        <capsuleGeometry args={[0.095, dims.legH * 0.65, 8, 12]} />
        <meshStandardMaterial color={pet.furColor} roughness={0.8} />
      </mesh>
      <mesh ref={legFR} castShadow position={[dims.bodyR * 0.55, -dims.legH * 0.48, dims.bodyLen * 0.28]}>
        <capsuleGeometry args={[0.095, dims.legH * 0.65, 8, 12]} />
        <meshStandardMaterial color={pet.furColor} roughness={0.8} />
      </mesh>
      <mesh ref={legBL} castShadow position={[-dims.bodyR * 0.55, -dims.legH * 0.48, -dims.bodyLen * 0.28]}>
        <capsuleGeometry args={[0.1, dims.legH * 0.65, 8, 12]} />
        <meshStandardMaterial color={pet.furColor} roughness={0.8} />
      </mesh>
      <mesh ref={legBR} castShadow position={[dims.bodyR * 0.55, -dims.legH * 0.48, -dims.bodyLen * 0.28]}>
        <capsuleGeometry args={[0.1, dims.legH * 0.65, 8, 12]} />
        <meshStandardMaterial color={pet.furColor} roughness={0.8} />
      </mesh>

      {/* Wagging Tail */}
      <group ref={tailRef} position={[0, 0.14, -dims.bodyLen * 0.48]}>
        {pet.breed === 'rabbit' ? (
          <mesh castShadow position={[0, 0.04, -0.1]}>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        ) : (
          <mesh castShadow position={[0, 0.18, -0.12]} rotation={[-0.65, 0, 0]}>
            <capsuleGeometry args={[0.075, pet.breed === 'cat' ? 0.52 : 0.34, 8, 12]} />
            <meshStandardMaterial color={pet.furColor} roughness={0.78} />
          </mesh>
        )}
      </group>

      {/* FASHION OUTFIT 1: Street Neon Hoodie */}
      {pet.outfit === 'neon_hoodie' && (
        <group position={[0, 0.02, 0.03]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[dims.bodyR + 0.045, dims.bodyLen * 0.48, 12, 18]} />
            <meshStandardMaterial color="#181825" roughness={0.45} metalness={0.25} />
          </mesh>
          {/* Neon Cyan & Magenta glowing stripes */}
          <mesh position={[0, dims.bodyR + 0.04, 0]}>
            <boxGeometry args={[0.08, 0.03, dims.bodyLen * 0.55]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
          <mesh position={[dims.bodyR + 0.04, 0.04, 0]}>
            <boxGeometry args={[0.03, 0.05, dims.bodyLen * 0.5]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2.0} toneMapped={false} />
          </mesh>
          <mesh position={[-(dims.bodyR + 0.04), 0.04, 0]}>
            <boxGeometry args={[0.03, 0.05, dims.bodyLen * 0.5]} />
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2.0} toneMapped={false} />
          </mesh>
          {/* Street Hood behind neck */}
          <mesh castShadow position={[0, 0.24, dims.bodyLen * 0.24]} rotation={[0.45, 0, 0]}>
            <torusGeometry args={[0.25, 0.075, 10, 20]} />
            <meshStandardMaterial color="#1e1b4b" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* FASHION OUTFIT 2: Hanbok Fusion Royal Cape */}
      {pet.outfit === 'royal_hanbok' && (
        <group position={[0, 0.12, -0.02]}>
          <mesh castShadow position={[0, 0.04, -0.08]} rotation={[0.18, 0, 0]}>
            <cylinderGeometry args={[dims.bodyR * 0.85, dims.bodyR * 1.38, dims.bodyLen * 0.72, 18, 1, true, -Math.PI * 0.72, Math.PI * 1.44]} />
            <meshStandardMaterial color="#9f1239" roughness={0.42} metalness={0.18} side={THREE.DoubleSide} />
          </mesh>
          {/* Golden embroidery trim */}
          <mesh position={[0, 0.22, 0.16]} rotation={[0.5, 0, 0]}>
            <torusGeometry args={[dims.bodyR * 0.88, 0.045, 10, 24]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.1} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Traditional ribbon tie */}
          <mesh position={[0.16, 0.02, dims.bodyLen * 0.34]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[0.06, 0.28, 0.02]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* FASHION OUTFIT 3: Red Tartan Dress & Green Satin Bow (PIU Siorae Inspired) */}
      {pet.outfit === 'tartan_dress' && (
        <group position={[0, 0.04, -0.02]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[dims.bodyR + 0.04, dims.bodyLen * 0.45, 10, 18]} />
            <meshStandardMaterial color="#be123c" roughness={0.55} />
          </mesh>
          {/* Plaid Gold/White Accent Bands */}
          <mesh position={[0, dims.bodyR + 0.035, 0]}>
            <boxGeometry args={[0.05, 0.025, dims.bodyLen * 0.5]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.02, -dims.bodyLen * 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[dims.bodyR + 0.045, 0.022, 8, 22]} />
            <meshStandardMaterial color="#15803d" roughness={0.35} />
          </mesh>
          {/* Green Satin Bow on Back */}
          <group position={[0, dims.bodyR + 0.09, -0.1]}>
            <mesh position={[-0.1, 0, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.16, 0.09, 0.04]} />
              <meshStandardMaterial color="#16a34a" roughness={0.3} metalness={0.15} />
            </mesh>
            <mesh position={[0.1, 0, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.16, 0.09, 0.04]} />
              <meshStandardMaterial color="#16a34a" roughness={0.3} metalness={0.15} />
            </mesh>
          </group>
        </group>
      )}

      {/* FASHION OUTFIT 4: Blush Pink Ruffled Tutu Dress */}
      {pet.outfit === 'pink_tutu' && (
        <group position={[0, 0.04, -0.04]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[dims.bodyR + 0.038, dims.bodyLen * 0.42, 10, 18]} />
            <meshStandardMaterial color="#f472b6" roughness={0.5} />
          </mesh>
          {/* Layered Ruffled Tutu Skirt */}
          <mesh castShadow position={[0, -0.02, -dims.bodyLen * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[dims.bodyR + 0.11, 0.11, 10, 24]} />
            <meshStandardMaterial color="#fbcfe8" emissive="#f472b6" emissiveIntensity={0.28} roughness={0.65} />
          </mesh>
        </group>
      )}

      {/* LED Neon Collar */}
      {pet.collar === 'led_collar' && (
        <mesh position={[0, 0.18, dims.bodyLen * 0.36]} rotation={[0.85, 0, 0]}>
          <torusGeometry args={[0.26, 0.036, 10, 28]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.3} toneMapped={false} />
        </mesh>
      )}

      {/* Head Group */}
      <group ref={headRef} position={[0, 0.36, dims.bodyLen * 0.44]}>
        {/* Skull */}
        <mesh castShadow>
          <sphereGeometry args={[dims.headR, 22, 22]} />
          <meshStandardMaterial color={pet.furColor} roughness={0.76} />
        </mesh>

        {/* Snout */}
        <mesh castShadow position={[0, -0.07, dims.headR * 0.82]}>
          <sphereGeometry args={[dims.headR * 0.48, 16, 16]} />
          <meshStandardMaterial color={lighterFur} roughness={0.82} />
        </mesh>

        {/* Cute Nose */}
        <mesh position={[0, -0.02, dims.headR * 1.24]}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshStandardMaterial color="#1f1a17" roughness={0.2} metalness={0.2} />
        </mesh>

        {/* Expressive Eyes with Iris Color & Highlight */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.135, 0.07, dims.headR * 0.86]}>
            <mesh>
              <sphereGeometry args={[0.062, 14, 14]} />
              <meshStandardMaterial color={pet.eyeColor} roughness={0.12} metalness={0.1} />
            </mesh>
            <mesh position={[side * 0.015, 0.02, 0.048]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ))}

        {/* Breed-Specific Ears */}
        {dims.earType === 'floppy' &&
          [-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * 0.31, -0.02, -0.02]} rotation={[0.1, 0, side * 0.38]}>
              <capsuleGeometry args={[0.095, 0.24, 8, 12]} />
              <meshStandardMaterial color={pet.furColor} roughness={0.8} />
            </mesh>
          ))}

        {(dims.earType === 'pointy' || dims.earType === 'pointyBig' || dims.earType === 'cat') &&
          [-1, 1].map((side) => (
            <mesh
              key={side}
              castShadow
              position={[side * 0.19, dims.headR * 0.92, -0.02]}
              rotation={[0.08, 0, -side * 0.24]}
            >
              <coneGeometry
                args={[
                  dims.earType === 'pointyBig' ? 0.13 : 0.105,
                  dims.earType === 'pointyBig' ? 0.34 : 0.26,
                  12
                ]}
              />
              <meshStandardMaterial color={pet.furColor} roughness={0.78} />
            </mesh>
          ))}

        {dims.earType === 'rabbit' &&
          [-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * 0.13, dims.headR * 1.28, -0.04]} rotation={[-0.12, 0, -side * 0.14]}>
              <capsuleGeometry args={[0.075, 0.44, 8, 12]} />
              <meshStandardMaterial color={pet.furColor} roughness={0.82} />
            </mesh>
          ))}

        {/* ACCESSORY: Cyber Sunglasses */}
        {pet.eyewear === 'sunglasses' && (
          <group position={[0, 0.07, dims.headR * 0.98]}>
            <mesh position={[-0.13, 0, 0]}>
              <boxGeometry args={[0.19, 0.1, 0.05]} />
              <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.45} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0.13, 0, 0]}>
              <boxGeometry args={[0.19, 0.1, 0.05]} />
              <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.45} metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.1, 0.025, 0.04]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* ACCESSORY: Golden Crown */}
        {pet.hat === 'crown' && (
          <group position={[0, dims.headR + 0.07, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.16, 0.13, 0.14, 6]} />
              <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.7} metalness={0.88} roughness={0.16} />
            </mesh>
            <mesh position={[0, 0.02, 0.14]}>
              <octahedronGeometry args={[0.045, 0]} />
              <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );

  const hasGlb = useGlbAvailable(pet.customGlbUrl);
  const labelHeightY = hasGlb ? DOG_TARGET_HEIGHT + 0.28 : 1.24;

  return (
    <group ref={rootRef} position={position} rotation={[0, rotationY, 0]} onClick={onClick}>
      {/* Automatically uses public/models/dog.glb (0.6m auto-scaled & animated) when present, falling back cleanly */}
      {hasGlb && pet.customGlbUrl ? (
        <AnimatedGLBModel
          url={pet.customGlbUrl}
          targetHeight={DOG_TARGET_HEIGHT}
          motionState={action}
          facingOffsetY={pet.glbFacingOffsetY ?? 0}
          fallback={proceduralBody}
        />
      ) : (
        proceduralBody
      )}

      {/* Active Care/Reaction 3D Particles */}
      <PetParticles type={particles} />

      {/* Unified Overhead Stack for Pet: Height calibrated accurately for 0.6m GLB dog or procedural pet */}
      {(nicknameTag || speechText) && (
        <Html
          position={[0, labelHeightY, 0]}
          center
          zIndexRange={speechText ? [24, 15] : [8, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="flex flex-col items-center gap-1.5 -translate-y-1/2">
            {speechText && (
              <div className="relative w-max max-w-[200px] px-2.5 py-1.5 rounded-2xl bg-amber-50/96 text-slate-900 text-[11.5px] font-semibold shadow-lg border border-amber-200 text-center leading-snug break-keep">
                {speechText}
                <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2.5 h-2.5 bg-amber-50 border-r border-b border-amber-200 rotate-45" />
              </div>
            )}
            {nicknameTag && (
              <div className="w-max px-2.5 py-0.5 rounded-full bg-slate-900/82 text-white text-[10.5px] font-bold whitespace-nowrap border border-white/25 backdrop-blur-md shadow">
                {showHeartBadge ? '❤️ ' : '🐾 '}
                {nicknameTag}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

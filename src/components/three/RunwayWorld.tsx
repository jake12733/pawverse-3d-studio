import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, MeshReflectorMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { ProceduralPet } from './ProceduralPet';
import { PetAction, PetConfig } from '../../types';

function CameraFlashes({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const positions = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => [
        (i % 2 === 0 ? -1 : 1) * (3.2 + (i % 3) * 0.7),
        1.3 + (i % 4) * 0.45,
        -7 + i * 0.85
      ] as [number, number, number]),
    []
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.children.forEach((child, i) => {
      const pulse = active ? Math.pow(Math.max(0, Math.sin(t * 7.5 + i * 2.3)), 18) : 0;
      child.scale.setScalar(0.01 + pulse * 0.45);
    });
  });

  return (
    <group ref={ref}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Floating Low-Poly Crystalline Pet Sculpture (PIU Hey, Chales! Showroom inspired) */
function FloatingCrystalSculpture({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 1.4 + position[2]) * 0.25;
    ref.current.rotation.y = t * 0.45;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.18} metalness={0.35} flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0.32]}>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.18} metalness={0.35} flatShading />
      </mesh>
    </group>
  );
}

/** Fluffy Pastel Sakura / Cloud Mound (PIU Siorae Showroom inspired) */
function SakuraCloudCluster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <dodecahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#fbcfe8" emissive="#f472b6" emissiveIntensity={0.22} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0.48, 0.35, 0.25]}>
        <dodecahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial color="#f9a8d4" emissive="#ec4899" emissiveIntensity={0.2} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[-0.45, 0.32, -0.18]}>
        <dodecahedronGeometry args={[0.48, 1]} />
        <meshStandardMaterial color="#fce7f3" roughness={0.85} />
      </mesh>
    </group>
  );
}

export const RunwayWorld: React.FC = () => {
  const { camera } = useThree();
  const pet = useMetaverseStore((s) => s.pet);
  const runway = useMetaverseStore((s) => s.runway);
  const theme = useMetaverseStore((s) => s.theme);
  const speechBubble = useMetaverseStore((s) => s.speechBubble);
  const setRunwayPhaseLabel = useMetaverseStore((s) => s.setRunwayPhaseLabel);

  const petGroupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const lastPhaseRef = useRef('');
  const [runwayAction, setRunwayAction] = useState<PetAction>('idle');

  const isPastelMode = theme === 'light';

  // Two co-star rescue pets modeling brand outfits on left/right showroom plinths!
  const showroomModels = useMemo<{ config: PetConfig; pos: [number, number, number]; rotY: number; tag: string }[]>(
    () => [
      {
        config: {
          name: '보리',
          breed: 'retriever',
          furColor: '#F6F4EE',
          eyeColor: '#1F1A17',
          outfit: 'tartan_dress',
          hat: 'none',
          eyewear: 'none',
          collar: 'none',
          customGlbUrl: null
        },
        pos: [-5.1, 0.45, 0.8],
        rotY: Math.PI / 2.2,
        tag: 'Siorae 쇼룸 · 보리'
      },
      {
        config: {
          name: '찰스',
          breed: 'corgi',
          furColor: '#D98245',
          eyeColor: '#2563EB',
          outfit: 'pink_tutu',
          hat: 'crown',
          eyewear: 'sunglasses',
          collar: 'none',
          customGlbUrl: null
        },
        pos: [5.1, 0.45, 0.8],
        rotY: -Math.PI / 2.2,
        tag: 'Hey, Chales! · 찰스'
      }
    ],
    []
  );

  const audience = useMemo(() => {
    const items: { pos: [number, number, number]; scaleY: number }[] = [];
    for (let z = -6.5; z <= 5.5; z += 1.45) {
      if (Math.abs(z - 0.8) < 1.5) continue; // Keep dual showroom sightlines open!
      items.push({ pos: [-3.4, 0.7, z], scaleY: 0.9 + ((Math.abs(z * 10) % 3) * 0.1) });
      items.push({ pos: [3.4, 0.7, z], scaleY: 0.9 + ((Math.abs(z * 7) % 3) * 0.1) });
    }
    return items;
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    let zPos = 0;
    let rotY = 0;
    let nextAction: PetAction = 'idle';
    let phaseText = '대기 중 · [패션쇼 시작]을 눌러 런웨이를 시작하세요';
    let activeCamAngle = runway.cameraAngle;

    if (runway.isActive) {
      progressRef.current = (progressRef.current + dt) % 14;
      const p = progressRef.current;

      if (p < 5.5) {
        const u = p / 5.5;
        zPos = THREE.MathUtils.lerp(-6.8, 4.6, u);
        rotY = 0;
        nextAction = 'walk';
        phaseText = '🎬 1단계 · 스카이브릿지 런웨이 워킹 (정면 트래킹)';
        if (runway.autoCamera) activeCamAngle = u < 0.55 ? 'front' : 'low';
      } else if (p < 9.0) {
        zPos = 4.6;
        rotY = 0;
        nextAction = 'runway_pose';
        phaseText = '📸 2단계 · 원형 스테이지 시그니처 점프 & 360° 포즈!';
        if (runway.autoCamera) activeCamAngle = 'orbit360';
      } else {
        const u = (p - 9.0) / 5.0;
        zPos = THREE.MathUtils.lerp(4.6, -6.8, u);
        rotY = Math.PI;
        nextAction = 'walk';
        phaseText = '✨ 3단계 · 듀얼 브랜드 쇼룸 피날레 워킹';
        if (runway.autoCamera) activeCamAngle = 'low';
      }
    } else {
      progressRef.current = 0;
      zPos = 1.5;
      rotY = Math.sin(t * 0.6) * 0.35;
      nextAction = 'idle';
    }

    if (nextAction !== runwayAction) setRunwayAction(nextAction);
    if (phaseText !== lastPhaseRef.current) {
      lastPhaseRef.current = phaseText;
      setRunwayPhaseLabel(phaseText);
    }

    if (petGroupRef.current) {
      petGroupRef.current.position.set(0, 0.25, zPos);
      petGroupRef.current.rotation.y = THREE.MathUtils.lerp(petGroupRef.current.rotation.y, rotY, 0.14);
    }

    if (runway.isActive) {
      const targetCam = new THREE.Vector3();
      if (activeCamAngle === 'front') {
        targetCam.set(Math.sin(t * 0.5) * 0.85, 1.7, zPos + 3.9);
      } else if (activeCamAngle === 'low') {
        targetCam.set(2.35, 0.75, zPos + 2.45);
      } else {
        targetCam.set(Math.cos(t * 1.4) * 3.2, 1.55, zPos + Math.sin(t * 1.4) * 3.2);
      }
      camera.position.lerp(targetCam, 0.08);
      camera.lookAt(0, 0.9, zPos);
    }
  });

  const visibleSpeech = speechBubble && speechBubble.expiresAt > Date.now() ? speechBubble.text : null;

  return (
    <group>
      {/* Pastel Dusk Twilight Skybox (Light Mode) vs Dramatic Neon Runway (Dark Mode) */}
      <color attach="background" args={[isPastelMode ? '#ddd6fe' : '#090916']} />
      <fog attach="fog" args={[isPastelMode ? '#f5d0fe' : '#090916', 14, 38]} />
      <Environment preset={isPastelMode ? 'sunset' : 'city'} environmentIntensity={0.68} />

      <ambientLight intensity={isPastelMode ? 0.95 : 0.52} />
      <spotLight position={[0, 8.5, 6]} angle={0.44} penumbra={0.6} intensity={55} color="#ffffff" castShadow />
      <spotLight position={[-6, 6.5, 1]} angle={0.55} penumbra={0.7} intensity={36} color="#f472b6" />
      <spotLight position={[6, 6.5, 1]} angle={0.55} penumbra={0.7} intensity={36} color="#38bdf8" />

      {/* Glossy Reflective Elevated Catwalk Bridge */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, -0.8]}>
        <planeGeometry args={[3.4, 15.5]} />
        <MeshReflectorMaterial
          mirror={0.65}
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={isPastelMode ? 0.85 : 1.55}
          roughness={0.2}
          color={isPastelMode ? '#f8fafc' : '#121526'}
          metalness={isPastelMode ? 0.25 : 0.6}
        />
      </mesh>

      {/* Circular Finale Junction Stage with Concentric Glowing Rings (PIU Spatial Homage) */}
      <group position={[0, 0.24, 4.9]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.55, 2.75, 0.24, 40]} />
          <meshStandardMaterial color={isPastelMode ? '#ffffff' : '#131629'} roughness={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
          <ringGeometry args={[1.95, 2.04, 48]} />
          <meshStandardMaterial color="#ffffff" emissive={isPastelMode ? '#f472b6' : '#38bdf8'} emissiveIntensity={2.3} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
          <ringGeometry args={[1.15, 1.21, 48]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} toneMapped={false} />
        </mesh>
      </group>

      {/* Catwalk Platform Base & Luminous Edge Strips */}
      <mesh receiveShadow position={[0, 0.12, -0.8]}>
        <boxGeometry args={[3.6, 0.24, 15.7]} />
        <meshStandardMaterial color={isPastelMode ? '#e2e8f0' : '#0b0d17'} roughness={0.4} />
      </mesh>
      {[-1.76, 1.76].map((x) => (
        <mesh key={x} position={[x, 0.26, -0.8]}>
          <boxGeometry args={[0.06, 0.04, 15.5]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={isPastelMode ? '#ffffff' : '#38bdf8'}
            emissiveIntensity={2.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Tall Illuminated White Portal Arch & Glowing Halo Ring Backdrop */}
      <group position={[0, 2.7, -8.3]}>
        <mesh>
          <torusGeometry args={[2.9, 0.11, 16, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={isPastelMode ? '#f9a8d4' : '#c084fc'}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.2, -0.28]}>
          <planeGeometry args={[6.4, 5.4]} />
          <meshStandardMaterial
            color={isPastelMode ? '#f3e8ff' : '#0f172a'}
            emissive={isPastelMode ? '#e9d5ff' : '#1e1b4b'}
            emissiveIntensity={0.65}
            roughness={0.3}
          />
        </mesh>
        <Html position={[0, 1.85, 0.1]} center distanceFactor={14}>
          <div className="px-4 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-extrabold tracking-widest shadow-lg border border-pink-200 whitespace-nowrap">
            PAWVERSE · RESCUE &amp; AI PET FASHION SHOW
          </div>
        </Html>
      </group>

      {/* LEFT WING: Blush Sakura Boutique Showroom (PIU Siorae Inspired) */}
      <group position={[-5.1, 0, 0.8]}>
        <mesh receiveShadow position={[0, 0.22, 0]}>
          <cylinderGeometry args={[1.65, 1.85, 0.44, 32]} />
          <meshStandardMaterial color="#fff5f8" roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.2, -1.6]}>
          <torusGeometry args={[1.35, 0.06, 12, 36]} />
          <meshStandardMaterial color="#ffffff" emissive="#f472b6" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        <SakuraCloudCluster position={[-1.4, 0, -1.2]} />
        <SakuraCloudCluster position={[1.1, 0, -1.7]} />
      </group>

      {/* RIGHT WING: Pastel Crystal Gallery Showroom (PIU Hey, Chales! Inspired) */}
      <group position={[5.1, 0, 0.8]}>
        <mesh receiveShadow position={[0, 0.22, 0]}>
          <cylinderGeometry args={[1.65, 1.85, 0.44, 32]} />
          <meshStandardMaterial color="#f0f9ff" roughness={0.35} />
        </mesh>
        <FloatingCrystalSculpture position={[-0.7, 2.5, -1.1]} color="#93c5fd" />
        <FloatingCrystalSculpture position={[0.9, 2.9, -0.6]} color="#c4b5fd" />
        <FloatingCrystalSculpture position={[0.2, 2.1, -1.7]} color="#f9a8d4" />
      </group>

      {/* Co-Star Showroom Model Pets */}
      {showroomModels.map((m) => (
        <ProceduralPet
          key={m.tag}
          pet={m.config}
          action="idle"
          position={m.pos}
          rotationY={m.rotY}
          nicknameTag={m.tag}
        />
      ))}

      {/* Base Floor & Audience */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[38, 38]} />
        <meshStandardMaterial color={isPastelMode ? '#27273a' : '#070910'} roughness={0.82} />
      </mesh>

      {audience.map((aud, idx) => (
        <group key={idx} position={aud.pos}>
          <mesh position={[0, 0, 0]} scale={[1, aud.scaleY, 1]}>
            <capsuleGeometry args={[0.24, 0.65, 6, 10]} />
            <meshStandardMaterial color="#1e1b2e" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.65 * aud.scaleY, 0]}>
            <sphereGeometry args={[0.19, 10, 10]} />
            <meshStandardMaterial color="#1e1b2e" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <CameraFlashes active={runway.isActive} />

      {/* Main Runway Star Pet */}
      <group ref={petGroupRef} position={[0, 0.25, 1.5]}>
        <ProceduralPet
          pet={pet}
          action={runwayAction}
          speechText={visibleSpeech}
          particles={runwayAction === 'runway_pose' ? 'sparkle' : null}
        />
      </group>

      <Sparkles
        count={85}
        scale={[15, 7, 18]}
        size={2.8}
        speed={0.45}
        opacity={0.7}
        color={isPastelMode ? '#ffffff' : '#38bdf8'}
      />
    </group>
  );
};

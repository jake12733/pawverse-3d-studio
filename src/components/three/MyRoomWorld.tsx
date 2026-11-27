import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { ProceduralPet } from './ProceduralPet';
import { PlayerAvatar } from './PlayerAvatar';
import { FurnitureItem3D } from './FurnitureItem3D';
import { useThirdPersonController } from './useThirdPersonController';
import {
  createFabricTexture,
  createMarbleFloorTextures,
  createOakFloorTextures,
  createTerrazzoFloorTextures
} from './proceduralTextures';
import { PetAction } from '../../types';

/** Framed Architectural Wall Artwork (Model-House Detail) */
function WallArtFrame({
  position,
  rotation = [0, 0, 0],
  accentA,
  accentB,
  width = 1.0,
  height = 1.28
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  accentA: string;
  accentB: string;
  width?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Satin Oak / Charcoal Outer Frame */}
      <mesh castShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color="#2b2623" roughness={0.35} metalness={0.18} />
      </mesh>
      {/* Crisp White Matboard */}
      <mesh position={[0, 0, 0.028]}>
        <planeGeometry args={[width - 0.1, height - 0.1]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.88} />
      </mesh>
      {/* Minimalist Geometric Art Canvas */}
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[width - 0.24, height - 0.28]} />
        <meshStandardMaterial color={accentA} roughness={0.82} />
      </mesh>
      <mesh position={[0.06, -0.08, 0.036]}>
        <circleGeometry args={[Math.min(width, height) * 0.24, 28]} />
        <meshStandardMaterial color={accentB} roughness={0.78} />
      </mesh>
    </group>
  );
}

/** Draped Matte Linen Curtain Panel */
function CurtainPanel({ position, color }: { position: [number, number, number]; color: string }) {
  const fabricMap = useMemo(() => createFabricTexture('#ffffff'), []);
  return (
    <group position={position}>
      {[-0.18, -0.06, 0.06, 0.18].map((ox, i) => (
        <mesh key={i} castShadow receiveShadow position={[ox, 0, (i % 2) * 0.045]}>
          <cylinderGeometry args={[0.095, 0.115, 2.55, 14]} />
          <meshStandardMaterial color={color} map={fabricMap} roughness={0.95} metalness={0.0} />
        </mesh>
      ))}
    </group>
  );
}

export const MyRoomWorld: React.FC = () => {
  const player = useMetaverseStore((s) => s.player);
  const playerSpeechBubble = useMetaverseStore((s) => s.playerSpeechBubble);
  const pet = useMetaverseStore((s) => s.pet);
  const petAction = useMetaverseStore((s) => s.petAction);
  const petFollowPlayer = useMetaverseStore((s) => s.petFollowPlayer);
  const petInteractTarget = useMetaverseStore((s) => s.petInteractTarget);
  const speechBubble = useMetaverseStore((s) => s.speechBubble);
  const activeParticles = useMetaverseStore((s) => s.activeParticles);
  const room = useMetaverseStore((s) => s.room);

  const selectFurniture = useMetaverseStore((s) => s.selectFurniture);
  const moveSelectedFurniture = useMetaverseStore((s) => s.moveSelectedFurniture);
  const interactWithFurniture = useMetaverseStore((s) => s.interactWithFurniture);
  const carePet = useMetaverseStore((s) => s.carePet);
  const triggerPetAction = useMetaverseStore((s) => s.triggerPetAction);

  // Procedural PBR Floor & Rug Textures
  const oakTex = useMemo(() => createOakFloorTextures(), []);
  const marbleTex = useMemo(() => createMarbleFloorTextures(), []);
  const terrazzoTex = useMemo(() => createTerrazzoFloorTextures(), []);
  const rugTex = useMemo(() => createFabricTexture('#f6f0e6'), []);

  const floorMatProps = useMemo(() => {
    if (room.floorType === 'marble') {
      return { map: marbleTex.map, bumpMap: marbleTex.bumpMap, bumpScale: 0.008, roughness: 0.14, metalness: 0.12 };
    }
    if (room.floorType === 'terrazzo') {
      return { map: terrazzoTex.map, bumpMap: terrazzoTex.bumpMap, bumpScale: 0.012, roughness: 0.42, metalness: 0.05 };
    }
    return { map: oakTex.map, bumpMap: oakTex.bumpMap, bumpScale: 0.018, roughness: 0.34, metalness: 0.08 };
  }, [room.floorType, oakTex, marbleTex, terrazzoTex]);

  // 1. Playable 3D Human Avatar + 3rd-person orbit camera
  const { playerPos, playerGroupRef, isWalking, wasClick } = useThirdPersonController({
    initialPos: [-0.35, 0, 1.85],
    bounds: { minX: -3.7, maxX: 3.7, minZ: -3.2, maxZ: 3.2 },
    speed: 3.8,
    initialDistance: 5.9,
    initialPitch: 0.42
  });

  // 2. 3D Companion Pet with natural side separation so speech bubbles & nameplates never collide
  const petPos = useRef(new THREE.Vector3(1.35, 0, 1.35));
  const petRotY = useRef(-0.4);
  const petGroupRef = useRef<THREE.Group>(null);
  const roamTarget = useRef(new THREE.Vector3(1.1, 0, 0.7));
  const roamWait = useRef(2.0);
  const activeFurnitureGoal = useRef<{ pos: THREE.Vector3; kind: string } | null>(null);
  const [petMoving, setPetMoving] = useState(false);

  useEffect(() => {
    if (!petInteractTarget) return;
    activeFurnitureGoal.current = {
      pos: new THREE.Vector3(petInteractTarget.pos[0], 0, petInteractTarget.pos[2]),
      kind: petInteractTarget.kind
    };
  }, [petInteractTarget]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    let moving = false;

    if (activeFurnitureGoal.current) {
      const goal = activeFurnitureGoal.current;
      const dx = goal.pos.x - petPos.current.x;
      const dz = goal.pos.z - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.68) {
        petPos.current.x += (dx / dist) * 3.1 * dt;
        petPos.current.z += (dz / dist) * 3.1 * dt;
        petRotY.current = Math.atan2(dx, dz);
        moving = true;
      } else {
        const reactAction: PetAction =
          goal.kind === 'bowl' ? 'eat' : goal.kind === 'toy' ? 'jump' : goal.kind === 'bed' ? 'sleep' : 'pet';
        const reactParticles = goal.kind === 'toy' ? 'sparkle' : 'heart';
        triggerPetAction(reactAction, undefined, reactParticles, 2600);
        activeFurnitureGoal.current = null;
      }
    } else if (petFollowPlayer && petAction !== 'sleep') {
      // Aim for a comfortable side spot (right of player) to keep screen labels cleanly separated
      const desiredX = THREE.MathUtils.clamp(playerPos.current.x + 1.35, -3.5, 3.5);
      const desiredZ = THREE.MathUtils.clamp(playerPos.current.z - 0.35, -3.0, 3.0);
      const dx = desiredX - petPos.current.x;
      const dz = desiredZ - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.65) {
        petPos.current.x += (dx / dist) * 3.1 * dt;
        petPos.current.z += (dz / dist) * 3.1 * dt;
        petRotY.current = Math.atan2(dx, dz);
        moving = true;
      }
    } else if (petAction !== 'sleep') {
      const dx = roamTarget.current.x - petPos.current.x;
      const dz = roamTarget.current.z - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
        petPos.current.x += (dx / dist) * 1.65 * dt;
        petPos.current.z += (dz / dist) * 1.65 * dt;
        petRotY.current = Math.atan2(dx, dz);
        moving = true;
      } else {
        roamWait.current -= dt;
        if (roamWait.current <= 0) {
          roamTarget.current.set((Math.random() - 0.5) * 5.8, 0, (Math.random() - 0.5) * 4.8);
          roamWait.current = 2.5 + Math.random() * 2.5;
        }
      }
    }

    if (moving !== petMoving) setPetMoving(moving);

    if (petGroupRef.current) {
      petGroupRef.current.position.copy(petPos.current);
      let diff = petRotY.current - petGroupRef.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      petGroupRef.current.rotation.y += diff * 0.16;
    }
  });

  const lighting = useMemo(() => {
    switch (room.lightingMood) {
      case 'sunset':
        return {
          envPreset: 'sunset' as const,
          envInt: 0.72,
          ambient: 0.35,
          main: '#ffab73',
          mainInt: 2.35,
          windowSky: '#fb923c',
          sunbeam: '#fdba74',
          sunbeamOpacity: 0.16,
          bg: '#261922'
        };
      case 'night':
        return {
          envPreset: 'night' as const,
          envInt: 0.32,
          ambient: 0.2,
          main: '#93c5fd',
          mainInt: 0.65,
          windowSky: '#1e293b',
          sunbeam: '#93c5fd',
          sunbeamOpacity: 0.05,
          bg: '#0b1020'
        };
      case 'cyberpunk':
        return {
          envPreset: 'city' as const,
          envInt: 0.52,
          ambient: 0.26,
          main: '#e879f9',
          mainInt: 1.45,
          windowSky: '#4c1d95',
          sunbeam: '#e879f9',
          sunbeamOpacity: 0.12,
          bg: '#120826'
        };
      default:
        return {
          envPreset: 'apartment' as const,
          envInt: 0.75,
          ambient: 0.42,
          main: '#fff4df',
          mainInt: 2.3,
          windowSky: '#bae6fd',
          sunbeam: '#fff3c4',
          sunbeamOpacity: 0.14,
          bg: '#1c2331'
        };
    }
  }, [room.lightingMood]);

  const visiblePetSpeech = speechBubble && speechBubble.expiresAt > Date.now() ? speechBubble.text : null;
  const visiblePlayerSpeech =
    playerSpeechBubble && playerSpeechBubble.expiresAt > Date.now() ? playerSpeechBubble.text : null;

  return (
    <group>
      <color attach="background" args={[lighting.bg]} />

      {/* IBL Environment Reflections */}
      <Environment preset={lighting.envPreset} environmentIntensity={lighting.envInt} />

      {/* Soft Window-Direction Directional Sunlight + Warm Room Bounce */}
      <ambientLight intensity={lighting.ambient} />
      <hemisphereLight args={['#fff9ef', '#7c6550', room.lightingMood === 'night' ? 0.2 : 0.48]} />
      <directionalLight
        position={[1.8, 6.4, -5.2]}
        intensity={lighting.mainInt}
        color={lighting.main}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />

      {room.lightingMood === 'cyberpunk' && (
        <>
          <pointLight position={[-3.2, 2.5, 1]} color="#22d3ee" intensity={3.6} distance={10} />
          <pointLight position={[3.2, 2.5, -1]} color="#f43f5e" intensity={3.6} distance={10} />
        </>
      )}

      {/* Interactive PBR Textured Room Floor */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          if (!wasClick()) return;
          if (room.decorateMode && room.selectedFurnitureId) {
            e.stopPropagation();
            moveSelectedFurniture([e.point.x, 0, e.point.z]);
          }
        }}
      >
        <planeGeometry args={[9.4, 8.4]} />
        <meshStandardMaterial {...floorMatProps} />
      </mesh>

      {/* Architectural Placement Grid in Decorate Mode */}
      {room.decorateMode && (
        <Grid
          position={[0, 0.016, 0]}
          args={[9, 8]}
          cellSize={0.5}
          sectionSize={1.5}
          cellColor="#94a3b8"
          sectionColor="#f43f5e"
          fadeDistance={16}
        />
      )}

      {/* Woven Matte Bouclé Center Rug with Subtle Raised Thickness */}
      <mesh receiveShadow position={[0, 0.012, 0.35]}>
        <cylinderGeometry args={[2.15, 2.18, 0.024, 48]} />
        <meshStandardMaterial map={rugTex} roughness={0.96} metalness={0.0} />
      </mesh>

      {/* Back Wall & Left Wall */}
      <mesh receiveShadow position={[0, 2.4, -4.15]}>
        <boxGeometry args={[9.4, 4.8, 0.22]} />
        <meshStandardMaterial color={room.wallColor} roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh receiveShadow position={[-4.65, 2.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8.4, 4.8, 0.22]} />
        <meshStandardMaterial color={room.wallColor} roughness={0.88} metalness={0.02} />
      </mesh>

      {/* === ARCHITECTURAL MODEL-HOUSE DETAILS === */}

      {/* 1. Satin White Baseboards (걸레받이) */}
      <mesh receiveShadow position={[0, 0.09, -4.02]}>
        <boxGeometry args={[9.3, 0.18, 0.05]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.35} metalness={0.04} />
      </mesh>
      <mesh receiveShadow position={[-4.52, 0.09, 0]}>
        <boxGeometry args={[0.05, 0.18, 8.3]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.35} metalness={0.04} />
      </mesh>

      {/* 2. Ceiling Crown Molding (천장 몰딩) */}
      <mesh position={[0, 4.7, -4.0]}>
        <boxGeometry args={[9.35, 0.16, 0.12]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.4} />
      </mesh>
      <mesh position={[-4.5, 4.7, 0]}>
        <boxGeometry args={[0.12, 0.16, 8.35]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.4} />
      </mesh>

      {/* 3. Vertical Natural Oak Wood Slat Accent Wall (우드 루버 포인트 월) */}
      <group position={[-3.35, 2.4, -4.0]}>
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} castShadow receiveShadow position={[(i - 5) * 0.16, 0, 0]}>
            <boxGeometry args={[0.08, 4.42, 0.07]} />
            <meshStandardMaterial color="#b8895a" roughness={0.42} metalness={0.05} />
          </mesh>
        ))}
      </group>

      {/* 4. Classic Wainscoting Wall Molding Panels on Left Wall (웨인스코팅 몰딩) */}
      {[-2.2, 0.1, 2.4].map((wz, idx) => (
        <group key={idx} position={[-4.53, 1.05, wz]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 0.04, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.42} />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <boxGeometry args={[1.7, 0.04, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.42} />
          </mesh>
          <mesh position={[-0.85, -0.35, 0]}>
            <boxGeometry args={[0.04, 0.72, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.42} />
          </mesh>
          <mesh position={[0.85, -0.35, 0]}>
            <boxGeometry args={[0.04, 0.72, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.42} />
          </mesh>
        </group>
      ))}

      {/* 5. Framed Gallery Artworks on Left Wall (벽면 액자 2점) */}
      <WallArtFrame position={[-4.51, 2.55, -1.1]} rotation={[0, Math.PI / 2, 0]} accentA="#f1dfd1" accentB="#d97757" />
      <WallArtFrame position={[-4.51, 2.55, 1.3]} rotation={[0, Math.PI / 2, 0]} accentA="#dce7df" accentB="#4d9078" />
      <WallArtFrame position={[3.45, 2.55, -4.01]} accentA="#e8e2f4" accentB="#7f74f2" width={0.95} height={1.2} />

      {/* 6. Architectural Window + Marble Sill + Brass Curtain Rod + Draped Linen Curtains + Sunbeam */}
      <group position={[0.55, 2.58, -4.0]}>
        {/* Outer Architectural Frame */}
        <mesh castShadow>
          <boxGeometry args={[3.26, 2.16, 0.12]} />
          <meshStandardMaterial color="#f5f3ef" roughness={0.32} />
        </mesh>
        {/* Dark Interior Mullion Frame */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[3.04, 1.94, 0.08]} />
          <meshStandardMaterial color="#272c36" roughness={0.32} metalness={0.35} />
        </mesh>
        {/* Luminous Window Glass Sky Glow (catches Bloom softly!) */}
        <mesh position={[0, 0, 0.072]}>
          <planeGeometry args={[2.88, 1.78]} />
          <meshStandardMaterial
            color={lighting.windowSky}
            emissive={lighting.windowSky}
            emissiveIntensity={room.lightingMood === 'night' ? 0.55 : 1.35}
            toneMapped={false}
          />
        </mesh>
        {/* Mullion Crossbars */}
        <mesh position={[0, 0, 0.095]}>
          <boxGeometry args={[0.06, 1.84, 0.04]} />
          <meshStandardMaterial color="#272c36" roughness={0.35} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.095]}>
          <boxGeometry args={[2.94, 0.06, 0.04]} />
          <meshStandardMaterial color="#272c36" roughness={0.35} metalness={0.35} />
        </mesh>
        {/* Polished White Marble Windowsill (창턱) */}
        <mesh castShadow receiveShadow position={[0, -1.09, 0.14]}>
          <boxGeometry args={[3.48, 0.09, 0.34]} />
          <meshPhysicalMaterial color="#f5f6f7" roughness={0.14} clearcoat={0.75} />
        </mesh>
        {/* Brushed Brass Curtain Rod */}
        <mesh position={[0, 1.24, 0.22]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 4.15, 14]} />
          <meshStandardMaterial color="#d4a853" metalness={0.9} roughness={0.22} />
        </mesh>
        {/* Draped Matte Linen Curtains on Left & Right */}
        <CurtainPanel position={[-1.76, -0.02, 0.2]} color="#f7f2ea" />
        <CurtainPanel position={[1.76, -0.02, 0.2]} color="#f7f2ea" />

        {/* Subtle Volumetric Window Sunbeam Shaft */}
        <mesh position={[0, -1.0, 1.8]} rotation={[-0.65, 0, 0]}>
          <planeGeometry args={[2.75, 4.2]} />
          <meshBasicMaterial
            color={lighting.sunbeam}
            transparent
            opacity={lighting.sunbeamOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Dynamic Placeable & Movable 3D Furniture Items */}
      {room.furniture.map((item) => (
        <FurnitureItem3D
          key={item.id}
          item={item}
          decorateMode={room.decorateMode}
          isSelected={room.selectedFurnitureId === item.id}
          isNightMood={room.lightingMood === 'night'}
          isCyberpunk={room.lightingMood === 'cyberpunk'}
          onSelect={() => selectFurniture(item.id)}
          onInteract={() => interactWithFurniture(item)}
        />
      ))}

      {/* Playable 3D Human Player Avatar */}
      <group ref={playerGroupRef} position={[-0.35, 0, 1.85]}>
        <PlayerAvatar
          nickname={player.nickname}
          shirtColor={player.shirtColor}
          hairColor={player.hairColor}
          skinColor={player.skinColor}
          isWalking={isWalking}
          isLocalPlayer
          speechText={visiblePlayerSpeech}
        />
      </group>

      {/* 3D Companion Pet following beside Player Avatar */}
      <group ref={petGroupRef} position={[1.35, 0, 1.35]}>
        <ProceduralPet
          pet={pet}
          action={petMoving ? 'walk' : petAction}
          nicknameTag={pet.name}
          speechText={visiblePetSpeech}
          particles={activeParticles}
          onClick={() => carePet()}
        />
      </group>

      <Sparkles
        count={24}
        scale={[7.5, 3.5, 6.5]}
        size={1.8}
        speed={0.25}
        opacity={0.35}
        color={room.lightingMood === 'cyberpunk' ? '#22d3ee' : '#fef08a'}
      />
      <ContactShadows position={[0, 0.025, 0]} resolution={512} opacity={0.48} scale={12} blur={2.4} far={4.5} />
    </group>
  );
};

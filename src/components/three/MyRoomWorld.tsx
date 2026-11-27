import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Grid, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { ProceduralPet } from './ProceduralPet';
import { PlayerAvatar } from './PlayerAvatar';
import { FurnitureItem3D } from './FurnitureItem3D';
import { useThirdPersonController } from './useThirdPersonController';
import { ROOM_FLOOR_OPTIONS } from '../../data/catalog';
import { PetAction } from '../../types';

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

  // 1. Playable 3D Human Avatar + 3rd-person orbit camera
  const { playerPos, playerGroupRef, isWalking, wasClick } = useThirdPersonController({
    initialPos: [0, 0, 1.8],
    bounds: { minX: -3.7, maxX: 3.7, minZ: -3.2, maxZ: 3.2 },
    speed: 3.8,
    initialDistance: 5.8,
    initialPitch: 0.44
  });

  // 2. 3D Companion Pet following Player Avatar OR reacting to placed furniture
  const petPos = useRef(new THREE.Vector3(0.95, 0, 1.2));
  const petRotY = useRef(0);
  const petGroupRef = useRef<THREE.Group>(null);
  const roamTarget = useRef(new THREE.Vector3(0.8, 0, 0.5));
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
      if (dist > 0.65) {
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
      // Follow smoothly beside/behind the Player Avatar
      const dx = playerPos.current.x - petPos.current.x;
      const dz = playerPos.current.z - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.45) {
        petPos.current.x += (dx / dist) * 3.2 * dt;
        petPos.current.z += (dz / dist) * 3.2 * dt;
        petRotY.current = Math.atan2(dx, dz);
        moving = true;
      }
    } else if (petAction !== 'sleep') {
      // Autonomous free roaming inside Pet House
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

  const floorSpec = ROOM_FLOOR_OPTIONS.find((f) => f.id === room.floorType) || ROOM_FLOOR_OPTIONS[0];
  const floorRoughness = room.floorType === 'marble' ? 0.16 : room.floorType === 'terrazzo' ? 0.42 : 0.68;

  const lighting = useMemo(() => {
    switch (room.lightingMood) {
      case 'sunset':
        return { ambient: 0.55, main: '#ffb07c', mainInt: 2.1, windowSky: '#fb923c', bg: '#2c1e24' };
      case 'night':
        return { ambient: 0.28, main: '#93c5fd', mainInt: 0.65, windowSky: '#0f172a', bg: '#0b1020' };
      case 'cyberpunk':
        return { ambient: 0.38, main: '#e879f9', mainInt: 1.5, windowSky: '#3b0764', bg: '#120826' };
      default:
        return { ambient: 0.8, main: '#fff7e8', mainInt: 2.2, windowSky: '#7dd3fc', bg: '#1b2230' };
    }
  }, [room.lightingMood]);

  const visiblePetSpeech = speechBubble && speechBubble.expiresAt > Date.now() ? speechBubble.text : null;
  const visiblePlayerSpeech =
    playerSpeechBubble && playerSpeechBubble.expiresAt > Date.now() ? playerSpeechBubble.text : null;

  return (
    <group>
      <color attach="background" args={[lighting.bg]} />
      <ambientLight intensity={lighting.ambient} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={lighting.mainInt}
        color={lighting.main}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {room.lightingMood === 'cyberpunk' && (
        <>
          <pointLight position={[-3, 2.5, 1]} color="#22d3ee" intensity={3.2} distance={10} />
          <pointLight position={[3, 2.5, -1]} color="#f43f5e" intensity={3.2} distance={10} />
        </>
      )}

      {/* Interactive Room Floor (click to move selected furniture in Decorate Mode!) */}
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
        <planeGeometry args={[9.2, 8.2]} />
        <meshStandardMaterial
          color={floorSpec.color}
          roughness={floorRoughness}
          metalness={room.floorType === 'marble' ? 0.15 : 0.04}
        />
      </mesh>

      {/* Architectural Placement Grid visible in 3D Decorate Mode */}
      {room.decorateMode && (
        <Grid
          position={[0, 0.015, 0]}
          args={[9, 8]}
          cellSize={0.5}
          sectionSize={1.5}
          cellColor="#94a3b8"
          sectionColor="#f43f5e"
          fadeDistance={16}
        />
      )}

      {/* Center Rug */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.25]}>
        <circleGeometry args={[2.0, 40]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.95} />
      </mesh>

      {/* Back Wall & Left Wall */}
      <mesh receiveShadow position={[0, 2.4, -4.1]}>
        <boxGeometry args={[9.2, 4.8, 0.22]} />
        <meshStandardMaterial color={room.wallColor} roughness={0.85} />
      </mesh>
      <mesh receiveShadow position={[-4.6, 2.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8.2, 4.8, 0.22]} />
        <meshStandardMaterial color={room.wallColor} roughness={0.85} />
      </mesh>

      {/* Architectural Window */}
      <group position={[0.4, 2.6, -3.96]}>
        <mesh>
          <boxGeometry args={[3.1, 2.0, 0.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.86, 1.78]} />
          <meshStandardMaterial
            color={lighting.windowSky}
            emissive={lighting.windowSky}
            emissiveIntensity={room.lightingMood === 'night' ? 0.45 : 0.85}
          />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[0.07, 1.85, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[2.9, 0.07, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
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
      <group ref={playerGroupRef} position={[0, 0, 1.8]}>
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

      {/* 3D Companion Pet following Player Avatar & interacting with furniture */}
      <group ref={petGroupRef} position={[0.95, 0, 1.2]}>
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
        size={2}
        speed={0.3}
        opacity={0.4}
        color={room.lightingMood === 'cyberpunk' ? '#22d3ee' : '#fef08a'}
      />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.42} scale={11.5} blur={2} far={4} />
    </group>
  );
};

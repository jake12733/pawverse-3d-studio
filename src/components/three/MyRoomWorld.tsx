import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { ProceduralPet } from './ProceduralPet';
import { ROOM_FLOOR_OPTIONS } from '../../data/catalog';

export const MyRoomWorld: React.FC = () => {
  const pet = useMetaverseStore((s) => s.pet);
  const petAction = useMetaverseStore((s) => s.petAction);
  const speechBubble = useMetaverseStore((s) => s.speechBubble);
  const activeParticles = useMetaverseStore((s) => s.activeParticles);
  const room = useMetaverseStore((s) => s.room);
  const ballTriggerId = useMetaverseStore((s) => s.ballTriggerId);
  const triggerRoomBallFetch = useMetaverseStore((s) => s.triggerRoomBallFetch);
  const carePet = useMetaverseStore((s) => s.carePet);

  // Autonomous fetch state for the 3D toy ball
  const petPos = useRef(new THREE.Vector3(0, 0, 0.2));
  const petRotY = useRef(0);
  const ballPos = useRef(new THREE.Vector3(1.85, 0.24, 1.35));
  const ballMeshRef = useRef<THREE.Mesh>(null);
  const petGroupRef = useRef<THREE.Group>(null);
  const fetchPhase = useRef<'idle' | 'chasing' | 'returning'>('idle');
  const [isChasing, setIsChasing] = useState(false);

  useEffect(() => {
    if (ballTriggerId === 0) return;
    // Toss the ball to a playful random spot inside the room
    const angle = Math.random() * Math.PI * 2;
    const rx = Math.max(-2.6, Math.min(2.6, Math.cos(angle) * 2.4));
    const rz = Math.max(-1.6, Math.min(2.4, Math.sin(angle) * 2.0));
    ballPos.current.set(rx, 0.24, rz);
    fetchPhase.current = 'chasing';
    setIsChasing(true);
  }, [ballTriggerId]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (fetchPhase.current === 'chasing') {
      const dx = ballPos.current.x - petPos.current.x;
      const dz = ballPos.current.z - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
        petPos.current.x += (dx / dist) * 3.1 * dt;
        petPos.current.z += (dz / dist) * 3.1 * dt;
        petRotY.current = Math.atan2(dx, dz);
      } else {
        fetchPhase.current = 'returning';
      }
    } else if (fetchPhase.current === 'returning') {
      const dx = 0 - petPos.current.x;
      const dz = 0.2 - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.25) {
        petPos.current.x += (dx / dist) * 2.6 * dt;
        petPos.current.z += (dz / dist) * 2.6 * dt;
        petRotY.current = Math.atan2(dx, dz);
        // Carry ball in front of mouth!
        ballPos.current.set(
          petPos.current.x + Math.sin(petRotY.current) * 0.65,
          0.52,
          petPos.current.z + Math.cos(petRotY.current) * 0.65
        );
      } else {
        fetchPhase.current = 'idle';
        setIsChasing(false);
        ballPos.current.set(1.6, 0.24, 1.3);
        petRotY.current = 0;
      }
    }

    if (petGroupRef.current) {
      petGroupRef.current.position.copy(petPos.current);
      petGroupRef.current.rotation.y = THREE.MathUtils.lerp(petGroupRef.current.rotation.y, petRotY.current, 0.18);
    }
    if (ballMeshRef.current) {
      ballMeshRef.current.position.copy(ballPos.current);
      if (fetchPhase.current === 'chasing') {
        ballMeshRef.current.rotation.x += dt * 4;
      }
    }
  });

  const floorSpec = ROOM_FLOOR_OPTIONS.find((f) => f.id === room.floorType) || ROOM_FLOOR_OPTIONS[0];
  const floorRoughness = room.floorType === 'marble' ? 0.16 : room.floorType === 'terrazzo' ? 0.42 : 0.68;

  const layout = useMemo(() => {
    if (room.layoutPreset === 'gallery') {
      return {
        sofa: [0, 0, -2.9] as [number, number, number],
        cushion: [-2.4, 0, 1.1] as [number, number, number],
        catTower: [2.8, 0, -2.3] as [number, number, number],
        lamp: [-3.1, 0, -2.8] as [number, number, number]
      };
    }
    if (room.layoutPreset === 'play') {
      return {
        sofa: [-2.7, 0, -2.6] as [number, number, number],
        cushion: [2.3, 0, -1.2] as [number, number, number],
        catTower: [2.8, 0, -2.6] as [number, number, number],
        lamp: [-3.3, 0, 1.2] as [number, number, number]
      };
    }
    return {
      sofa: [-1.4, 0, -2.7] as [number, number, number],
      cushion: [-2.4, 0, 0.7] as [number, number, number],
      catTower: [2.7, 0, -2.3] as [number, number, number],
      lamp: [3.2, 0, 0.6] as [number, number, number]
    };
  }, [room.layoutPreset]);

  const lighting = useMemo(() => {
    switch (room.lightingMood) {
      case 'sunset':
        return { ambient: 0.55, main: '#ffb07c', mainInt: 2.1, windowSky: '#fb923c', bg: '#2c1e24' };
      case 'night':
        return { ambient: 0.25, main: '#93c5fd', mainInt: 0.65, windowSky: '#0f172a', bg: '#0b1020' };
      case 'cyberpunk':
        return { ambient: 0.35, main: '#e879f9', mainInt: 1.5, windowSky: '#3b0764', bg: '#120826' };
      default:
        return { ambient: 0.78, main: '#fff7e8', mainInt: 2.2, windowSky: '#7dd3fc', bg: '#1b2230' };
    }
  }, [room.lightingMood]);

  const visibleSpeech = speechBubble && speechBubble.expiresAt > Date.now() ? speechBubble.text : null;

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

      {/* Room Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[9, 8]} />
        <meshStandardMaterial color={floorSpec.color} roughness={floorRoughness} metalness={room.floorType === 'marble' ? 0.15 : 0.04} />
      </mesh>

      {/* Cozy Center Rug */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.25]}>
        <circleGeometry args={[2.1, 40]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.95} />
      </mesh>

      {/* Back Wall & Left Wall */}
      <mesh receiveShadow position={[0, 2.4, -4]}>
        <boxGeometry args={[9, 4.8, 0.22]} />
        <meshStandardMaterial color={room.wallColor} roughness={0.85} />
      </mesh>
      <mesh receiveShadow position={[-4.5, 2.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 4.8, 0.22]} />
        <meshStandardMaterial color={room.wallColor} roughness={0.85} />
      </mesh>

      {/* Architectural Window with Day/Sunset/Night/Cyberpunk Sky */}
      <group position={[0.5, 2.55, -3.86]}>
        <mesh>
          <boxGeometry args={[3.1, 2.0, 0.08]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.86, 1.78]} />
          <meshStandardMaterial color={lighting.windowSky} emissive={lighting.windowSky} emissiveIntensity={room.lightingMood === 'night' ? 0.45 : 0.85} />
        </mesh>
        {/* Window Mullions */}
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[0.07, 1.85, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[2.9, 0.07, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Modern Sofa */}
      <group position={layout.sofa}>
        <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[2.5, 0.5, 1.05]} />
          <meshStandardMaterial color="#475569" roughness={0.82} />
        </mesh>
        <mesh castShadow position={[0, 0.82, -0.38]}>
          <boxGeometry args={[2.5, 0.65, 0.28]} />
          <meshStandardMaterial color="#334155" roughness={0.84} />
        </mesh>
        <mesh castShadow position={[-1.15, 0.62, 0]}>
          <boxGeometry args={[0.24, 0.55, 1.05]} />
          <meshStandardMaterial color="#334155" roughness={0.84} />
        </mesh>
        <mesh castShadow position={[1.15, 0.62, 0]}>
          <boxGeometry args={[0.24, 0.55, 1.05]} />
          <meshStandardMaterial color="#334155" roughness={0.84} />
        </mesh>
      </group>

      {/* Designer Pet Cushion */}
      <group position={layout.cushion}>
        <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.78, 0.84, 0.26, 28]} />
          <meshStandardMaterial color={room.cushionColor} roughness={0.88} />
        </mesh>
        <mesh receiveShadow position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.58, 0.62, 0.1, 24]} />
          <meshStandardMaterial color="#fff8f0" roughness={0.92} />
        </mesh>
      </group>

      {/* Multi-Tier 3D Cat Tower */}
      <group position={layout.catTower}>
        <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
          <boxGeometry args={[1.1, 0.16, 1.1]} />
          <meshStandardMaterial color="#d6c5b3" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.25, 0.68, -0.15]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 16]} />
          <meshStandardMaterial color="#b08968" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0.28, 1.08, 0.18]}>
          <cylinderGeometry args={[0.1, 0.1, 2.0, 16]} />
          <meshStandardMaterial color="#b08968" roughness={0.95} />
        </mesh>
        <mesh castShadow position={[-0.25, 1.32, -0.15]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 20]} />
          <meshStandardMaterial color="#ede0d4" roughness={0.88} />
        </mesh>
        <mesh castShadow position={[0.28, 2.12, 0.18]}>
          <cylinderGeometry args={[0.46, 0.46, 0.14, 20]} />
          <meshStandardMaterial color={room.cushionColor} roughness={0.85} />
        </mesh>
      </group>

      {/* Floor Lamp with Glowing Shade */}
      <group position={layout.lamp}>
        <mesh castShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.08, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.25, 0]}>
          <cylinderGeometry args={[0.26, 0.38, 0.48, 24, 1, true]} />
          <meshStandardMaterial
            color="#fef3c7"
            emissive={room.lightingMood === 'cyberpunk' ? '#22d3ee' : '#fde68a'}
            emissiveIntensity={room.lightingMood === 'day' ? 0.5 : 1.7}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          position={[0, 2.1, 0]}
          color={room.lightingMood === 'cyberpunk' ? '#22d3ee' : '#ffd89b'}
          intensity={room.lightingMood === 'day' ? 0.8 : 2.6}
          distance={7}
        />
      </group>

      {/* Clickable 3D Toy Ball (triggers autonomous pet fetch!) */}
      <mesh
        ref={ballMeshRef}
        castShadow
        position={[1.85, 0.24, 1.35]}
        onClick={(e) => {
          e.stopPropagation();
          triggerRoomBallFetch();
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color="#a3e635" emissive="#84cc16" emissiveIntensity={0.45} roughness={0.35} />
      </mesh>

      {/* Main Player Pet */}
      <group ref={petGroupRef} position={[0, 0, 0.2]}>
        <ProceduralPet
          pet={pet}
          action={isChasing ? 'walk' : petAction}
          speechText={visibleSpeech}
          particles={activeParticles}
          onClick={() => carePet()}
        />
      </group>

      <Sparkles count={24} scale={[7, 3.5, 6]} size={2} speed={0.3} opacity={0.4} color={room.lightingMood === 'cyberpunk' ? '#22d3ee' : '#fef08a'} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={11} blur={2} far={4} />
    </group>
  );
};

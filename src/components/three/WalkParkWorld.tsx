import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { ProceduralPet } from './ProceduralPet';
import { PlayerAvatar } from './PlayerAvatar';
import { useThirdPersonController } from './useThirdPersonController';
import { socialAdapter } from '../../services/realtimeSocial';

interface TreasureItem {
  id: number;
  x: number;
  z: number;
  isTreat: boolean;
}

function ParkTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 1.8, 10]} />
        <meshStandardMaterial color="#7c4d2b" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 2.2, 0]}>
        <dodecahedronGeometry args={[1.15, 1]} />
        <meshStandardMaterial color="#2f9e62" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.45, 2.7, 0.25]}>
        <dodecahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial color="#40b876" roughness={0.85} />
      </mesh>
    </group>
  );
}

function ParkLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 3.2, 10]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ParkBench({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.9, 0.12, 0.56]} />
        <meshStandardMaterial color="#a46c42" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 0.78, -0.24]}>
        <boxGeometry args={[1.9, 0.42, 0.08]} />
        <meshStandardMaterial color="#8f5b34" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[-0.75, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.48]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh castShadow position={[0.75, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.48]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

export const WalkParkWorld: React.FC = () => {
  const player = useMetaverseStore((s) => s.player);
  const playerSpeechBubble = useMetaverseStore((s) => s.playerSpeechBubble);
  const visitorBubbles = useMetaverseStore((s) => s.visitorBubbles);
  const pet = useMetaverseStore((s) => s.pet);
  const petAction = useMetaverseStore((s) => s.petAction);
  const petFollowPlayer = useMetaverseStore((s) => s.petFollowPlayer);
  const speechBubble = useMetaverseStore((s) => s.speechBubble);
  const activeParticles = useMetaverseStore((s) => s.activeParticles);
  const addPoints = useMetaverseStore((s) => s.addPoints);
  const setSpeechBubble = useMetaverseStore((s) => s.setSpeechBubble);
  const setVisitorSpeechBubble = useMetaverseStore((s) => s.setVisitorSpeechBubble);
  const carePet = useMetaverseStore((s) => s.carePet);

  // 1. Playable 3D Human Player Avatar + 3rd-Person Orbit Camera
  const { playerPos, playerGroupRef, isWalking } = useThirdPersonController({
    initialPos: [0, 0, 3.2],
    bounds: { minX: -12, maxX: 12, minZ: -12, maxZ: 12 },
    speed: 4.6,
    initialDistance: 6.8,
    initialPitch: 0.42,
    onMove: (pos, rotY) => socialAdapter.broadcastPlayerMove(pos, rotY)
  });

  // 2. Companion Pet following beside Player Avatar (lateral offset avoids screen bubble collision)
  const petPos = useRef(new THREE.Vector3(1.55, 0, 2.8));
  const petRotY = useRef(0);
  const petGroupRef = useRef<THREE.Group>(null);
  const [petWalking, setPetWalking] = useState(false);

  // 3. Collectible Park Treasures
  const [treasures, setTreasures] = useState<TreasureItem[]>(() => [
    { id: 1, x: -4.2, z: -2.2, isTreat: false },
    { id: 2, x: 4.5, z: 1.5, isTreat: true },
    { id: 3, x: 1.8, z: -5.4, isTreat: false },
    { id: 4, x: -3.6, z: 4.6, isTreat: true }
  ]);
  const treasureRefs = useRef<(THREE.Group | null)[]>([]);

  // 4. Remote Social Visitors (Human Avatar + Pet pairs from decoupled socialAdapter)
  const visitors = useMemo(
    () =>
      socialAdapter.getVisitors().map((v) => ({
        ...v,
        pos: new THREE.Vector3(...v.position),
        target: new THREE.Vector3(v.position[0] + 1.5, 0, v.position[2] + 1.0),
        rotY: v.rotationY,
        waitTimer: 2 + Math.random() * 2
      })),
    []
  );
  const visitorGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const [nearVisitorIds, setNearVisitorIds] = useState<string[]>([]);
  const greetCooldown = useRef<Map<string, number>>(new Map());

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    // Companion pet follows beside player smoothly (with clean lateral offset so nameplates & bubbles don't overlap)
    let pMoving = false;
    if (petFollowPlayer && petAction !== 'sleep') {
      const targetX = playerPos.current.x + 1.5;
      const targetZ = playerPos.current.z - 0.35;
      const dx = targetX - petPos.current.x;
      const dz = targetZ - petPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.75) {
        petPos.current.x += (dx / dist) * 4.1 * dt;
        petPos.current.z += (dz / dist) * 4.1 * dt;
        petRotY.current = Math.atan2(dx, dz);
        pMoving = true;
      }
    }
    if (pMoving !== petWalking) setPetWalking(pMoving);
    if (petGroupRef.current) {
      petGroupRef.current.position.copy(petPos.current);
      petGroupRef.current.rotation.y = THREE.MathUtils.lerp(petGroupRef.current.rotation.y, petRotY.current, 0.18);
    }

    // Treasure pickups (by either Player Avatar or Companion Pet)
    treasures.forEach((tr, idx) => {
      const g = treasureRefs.current[idx];
      if (g) {
        g.rotation.y = t * 1.8 + idx;
        g.position.y = 0.35 + Math.sin(t * 3 + idx) * 0.1;
      }
      const distPlayer = Math.hypot(tr.x - playerPos.current.x, tr.z - playerPos.current.z);
      const distPet = Math.hypot(tr.x - petPos.current.x, tr.z - petPos.current.z);
      if (Math.min(distPlayer, distPet) < 1.25) {
        addPoints(150, tr.isTreat ? '🦴 공원 숨은 간식 획득!' : '🎁 숨겨진 보물상자 발견!');
        setSpeechBubble(tr.isTreat ? '황금 간식 찾았다! (+150 P) 🦴' : '보물상자 발견!! (+150 P) 🎁', 3000);
        setTreasures((prev) =>
          prev.map((item) =>
            item.id === tr.id
              ? { ...item, x: (Math.random() - 0.5) * 16, z: (Math.random() - 0.5) * 16 }
              : item
          )
        );
      }
    });

    // Social Visitor Avatars + Pets roaming & waving when you approach!
    const nearNow: string[] = [];
    visitors.forEach((v, idx) => {
      const dist = v.pos.distanceTo(playerPos.current);
      if (dist < 2.8) {
        v.rotY = Math.atan2(playerPos.current.x - v.pos.x, playerPos.current.z - v.pos.z);
        nearNow.push(v.id);
        const now = Date.now();
        if ((greetCooldown.current.get(v.id) ?? 0) < now) {
          greetCooldown.current.set(v.id, now + 11000);
          setVisitorSpeechBubble(v.id, `안녕하세요! 우리 ${v.pet.name}랑 인사해요 👋`, 4200);
          setSpeechBubble(`${v.pet.name}랑 꼬리 흔들며 인사! ❤️`, 3200);
          addPoints(35, `👋 ${v.nickname} & ${v.pet.name}와 광장 교류!`);
        }
      } else {
        const dx = v.target.x - v.pos.x;
        const dz = v.target.z - v.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.4) {
          v.pos.x += (dx / d) * 1.45 * dt;
          v.pos.z += (dz / d) * 1.45 * dt;
          v.rotY = Math.atan2(dx, dz);
        } else {
          v.waitTimer -= dt;
          if (v.waitTimer <= 0) {
            v.target.set((Math.random() - 0.5) * 15, 0, (Math.random() - 0.5) * 15);
            v.waitTimer = 2.5 + Math.random() * 3;
          }
        }
      }

      const ref = visitorGroupRefs.current[idx];
      if (ref) {
        ref.position.copy(v.pos);
        ref.rotation.y = THREE.MathUtils.lerp(ref.rotation.y, v.rotY, 0.12);
      }
    });

    if (nearNow.join(',') !== nearVisitorIds.join(',')) {
      setNearVisitorIds(nearNow);
    }
  });

  const visiblePetSpeech = speechBubble && speechBubble.expiresAt > Date.now() ? speechBubble.text : null;
  const visiblePlayerSpeech =
    playerSpeechBubble && playerSpeechBubble.expiresAt > Date.now() ? playerSpeechBubble.text : null;

  return (
    <group>
      <color attach="background" args={['#93c5fd']} />
      <fog attach="fog" args={['#bae6fd', 18, 44]} />
      <Environment preset="park" environmentIntensity={0.65} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={['#e0f2fe', '#4d7c4f', 0.45]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={2.2}
        color="#fff7e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />

      {/* Open Community Plaza Grass Field */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[52, 52]} />
        <meshStandardMaterial color="#67b868" roughness={0.92} />
      </mesh>

      {/* Plaza Stone Paths & Circular Lounge Deck */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[3.4, 5.4, 48]} />
        <meshStandardMaterial color="#e6dcc8" roughness={0.88} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[2.2, 26]} />
        <meshStandardMaterial color="#e6dcc8" roughness={0.88} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[26, 2.2]} />
        <meshStandardMaterial color="#e6dcc8" roughness={0.88} />
      </mesh>

      {/* Center Plaza Fountain */}
      <group position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[1.55, 1.75, 0.5, 28]} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[1.3, 1.3, 0.14, 28]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.4} roughness={0.1} metalness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.25, 0.35, 1.0, 16]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.6} />
        </mesh>
      </group>

      {/* Outdoor Lounge Gazebo / Cafe Pavilion */}
      <group position={[-7.2, 0, -5.8]}>
        <mesh receiveShadow position={[0, 0.08, 0]}>
          <boxGeometry args={[4.4, 0.16, 3.6]} />
          <meshStandardMaterial color="#b08968" roughness={0.8} />
        </mesh>
        {[-1.9, 1.9].map((px) =>
          [-1.5, 1.5].map((pz) => (
            <mesh key={`${px}-${pz}`} castShadow position={[px, 1.5, pz]}>
              <cylinderGeometry args={[0.08, 0.08, 2.9, 10]} />
              <meshStandardMaterial color="#7c4d2b" />
            </mesh>
          ))
        )}
        <mesh castShadow position={[0, 2.98, 0]}>
          <boxGeometry args={[4.6, 0.16, 3.8]} />
          <meshStandardMaterial color="#f5ebe0" roughness={0.7} />
        </mesh>
      </group>

      {/* Trees, Benches & Streetlamps */}
      <ParkTree position={[7.8, 0, -7.2]} />
      <ParkTree position={[-8.2, 0, 5.8]} />
      <ParkTree position={[8.5, 0, 6.2]} />
      <ParkTree position={[0, 0, -9.8]} />
      <ParkTree position={[-9.5, 0, -0.5]} />
      <ParkTree position={[9.8, 0, -0.8]} />

      <ParkLamp position={[-5.6, 0, -2.5]} />
      <ParkLamp position={[5.6, 0, -2.5]} />
      <ParkLamp position={[-5.6, 0, 3.8]} />
      <ParkLamp position={[5.6, 0, 3.8]} />

      <ParkBench position={[-5.9, 0, 0.4]} rotY={Math.PI / 2} />
      <ParkBench position={[5.9, 0, 0.4]} rotY={-Math.PI / 2} />

      {/* Glowing Treasures & Treats */}
      {treasures.map((tr, idx) => (
        <group
          key={tr.id}
          ref={(el) => {
            treasureRefs.current[idx] = el;
          }}
          position={[tr.x, 0.35, tr.z]}
        >
          {tr.isTreat ? (
            <mesh castShadow>
              <octahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
          ) : (
            <group>
              <mesh castShadow>
                <boxGeometry args={[0.56, 0.42, 0.42]} />
                <meshStandardMaterial color="#b45309" roughness={0.45} metalness={0.2} />
              </mesh>
              <mesh position={[0, 0.04, 0.22]}>
                <boxGeometry args={[0.14, 0.14, 0.04]} />
                <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.8} toneMapped={false} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Other Community Visitors (Human Avatar + Their 3D Pet) */}
      {visitors.map((v, idx) => {
        const isNear = nearVisitorIds.includes(v.id);
        const vb = visitorBubbles[v.id];
        const visitorText = vb && vb.expiresAt > Date.now() ? vb.text : null;
        return (
          <group
            key={v.id}
            ref={(el) => {
              visitorGroupRefs.current[idx] = el;
            }}
            position={v.position}
          >
            <PlayerAvatar
              nickname={v.nickname}
              shirtColor={v.shirtColor}
              hairColor={v.hairColor}
              isWalking={!isNear}
              waving={isNear}
              speechText={visitorText}
            />
            <group position={[0.95, 0, 0.35]}>
              <ProceduralPet
                pet={v.pet}
                action={isNear ? 'pet' : 'walk'}
                nicknameTag={v.pet.name}
                showHeartBadge={isNear}
                particles={isNear ? 'heart' : null}
              />
            </group>
          </group>
        );
      })}

      {/* Local Playable Human Avatar */}
      <group ref={playerGroupRef} position={[0, 0, 3.2]}>
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

      {/* Local Companion 3D Pet */}
      <group ref={petGroupRef} position={[1.1, 0, 2.8]}>
        <ProceduralPet
          pet={pet}
          action={petWalking ? 'walk' : petAction}
          nicknameTag={pet.name}
          speechText={visiblePetSpeech}
          particles={nearVisitorIds.length > 0 ? 'heart' : activeParticles}
          onClick={() => carePet()}
        />
      </group>

      <Sparkles count={45} scale={[22, 5, 22]} size={2.2} speed={0.35} opacity={0.5} color="#fef08a" />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={28} blur={2} far={4} />
    </group>
  );
};

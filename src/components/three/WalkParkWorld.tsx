import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import { ProceduralPet } from './ProceduralPet';
import { PetConfig } from '../../types';

interface TreasureItem {
  id: number;
  x: number;
  z: number;
  isTreat: boolean;
}

interface NpcPetState {
  id: string;
  config: PetConfig;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  rotY: number;
  waitTimer: number;
  isGreeting: boolean;
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
  const { camera } = useThree();
  const pet = useMetaverseStore((s) => s.pet);
  const petAction = useMetaverseStore((s) => s.petAction);
  const speechBubble = useMetaverseStore((s) => s.speechBubble);
  const activeParticles = useMetaverseStore((s) => s.activeParticles);
  const addPoints = useMetaverseStore((s) => s.addPoints);
  const setSpeechBubble = useMetaverseStore((s) => s.setSpeechBubble);

  const playerPos = useRef(new THREE.Vector3(0, 0, 2));
  const targetPos = useRef(new THREE.Vector3(0, 0, 2));
  const playerRotY = useRef(0);
  const playerGroupRef = useRef<THREE.Group>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const [isWalking, setIsWalking] = useState(false);

  // Random treasure chests / treats across park
  const [treasures, setTreasures] = useState<TreasureItem[]>(() => [
    { id: 1, x: -4.2, z: -2.2, isTreat: false },
    { id: 2, x: 4.5, z: 1.5, isTreat: true },
    { id: 3, x: 1.8, z: -5.4, isTreat: false },
    { id: 4, x: -3.6, z: 4.6, isTreat: true }
  ]);
  const treasureRefs = useRef<(THREE.Group | null)[]>([]);

  // 3 Autonomous AI NPC Pets with nicknames
  const npcs = useMemo<NpcPetState[]>(
    () => [
      {
        id: 'npc-choco',
        config: {
          name: '초코 (지민님)',
          breed: 'retriever',
          furColor: '#7A4F35',
          eyeColor: '#1F1A17',
          outfit: 'none',
          hat: 'none',
          eyewear: 'none',
          collar: 'led_collar',
          customGlbUrl: null
        },
        pos: new THREE.Vector3(-4.5, 0, 1.2),
        target: new THREE.Vector3(-2.5, 0, -1.5),
        rotY: 0.6,
        waitTimer: 1,
        isGreeting: false
      },
      {
        id: 'npc-mochi',
        config: {
          name: '모찌 (수현님)',
          breed: 'cat',
          furColor: '#F6F4EE',
          eyeColor: '#2563EB',
          outfit: 'royal_hanbok',
          hat: 'none',
          eyewear: 'none',
          collar: 'none',
          customGlbUrl: null
        },
        pos: new THREE.Vector3(4.2, 0, -2.8),
        target: new THREE.Vector3(2.4, 0, -0.5),
        rotY: -1.2,
        waitTimer: 2,
        isGreeting: false
      },
      {
        id: 'npc-dubu',
        config: {
          name: '두부 (태오님)',
          breed: 'rabbit',
          furColor: '#F5B5B0',
          eyeColor: '#7C3AED',
          outfit: 'none',
          hat: 'crown',
          eyewear: 'none',
          collar: 'none',
          customGlbUrl: null
        },
        pos: new THREE.Vector3(1.5, 0, 5.2),
        target: new THREE.Vector3(-1.8, 0, 4.1),
        rotY: 2.2,
        waitTimer: 1.5,
        isGreeting: false
      }
    ],
    []
  );
  const npcRefs = useRef<(THREE.Group | null)[]>([]);
  const [greetingIds, setGreetingIds] = useState<string[]>([]);
  const greetedCooldown = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)) return;
      keysPressed.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    // 1. Player WASD / Arrow / Click movement
    let kx = 0;
    let kz = 0;
    const keys = keysPressed.current;
    if (keys.has('w') || keys.has('arrowup')) kz -= 1;
    if (keys.has('s') || keys.has('arrowdown')) kz += 1;
    if (keys.has('a') || keys.has('arrowleft')) kx -= 1;
    if (keys.has('d') || keys.has('arrowright')) kx += 1;

    let movingNow = false;
    const speed = 4.2;

    if (kx !== 0 || kz !== 0) {
      const len = Math.hypot(kx, kz);
      playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x + (kx / len) * speed * dt, -11, 11);
      playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z + (kz / len) * speed * dt, -11, 11);
      targetPos.current.copy(playerPos.current);
      playerRotY.current = Math.atan2(kx, kz);
      movingNow = true;
    } else {
      const dx = targetPos.current.x - playerPos.current.x;
      const dz = targetPos.current.z - playerPos.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.2) {
        playerPos.current.x += (dx / dist) * speed * dt;
        playerPos.current.z += (dz / dist) * speed * dt;
        playerRotY.current = Math.atan2(dx, dz);
        movingNow = true;
      }
    }

    if (movingNow !== isWalking) setIsWalking(movingNow);

    if (playerGroupRef.current) {
      playerGroupRef.current.position.copy(playerPos.current);
      playerGroupRef.current.rotation.y = THREE.MathUtils.lerp(playerGroupRef.current.rotation.y, playerRotY.current, 0.18);
    }

    // Gentle camera tracking behind/above player
    const desiredCam = new THREE.Vector3(playerPos.current.x * 0.65, 5.8, playerPos.current.z + 8.5);
    camera.position.lerp(desiredCam, 0.04);
    camera.lookAt(playerPos.current.x, 0.7, playerPos.current.z);

    // 2. Treasure rotation & collection check
    treasures.forEach((tr, idx) => {
      const g = treasureRefs.current[idx];
      if (g) {
        g.rotation.y = t * 1.8 + idx;
        g.position.y = 0.35 + Math.sin(t * 3 + idx) * 0.1;
      }
      if (Math.hypot(tr.x - playerPos.current.x, tr.z - playerPos.current.z) < 1.05) {
        addPoints(150, tr.isTreat ? '🦴 공원 숨은 간식 획득!' : '🎁 숨겨진 보물상자 발견!');
        setSpeechBubble(tr.isTreat ? '황금 간식 찾았다! (+150 P) 🦴' : '보물상자 발견!! (+150 P) 🎁', 3000);
        setTreasures((prev) =>
          prev.map((item) =>
            item.id === tr.id
              ? {
                  ...item,
                  x: (Math.random() - 0.5) * 16,
                  z: (Math.random() - 0.5) * 16
                }
              : item
          )
        );
      }
    });

    // 3. Autonomous AI NPC Pets + Social Heart Greeting Interaction
    const activeGreets: string[] = [];
    npcs.forEach((npc, idx) => {
      const distPlayer = npc.pos.distanceTo(playerPos.current);
      if (distPlayer < 2.2) {
        // Face player pet & wag tail happily!
        npc.rotY = Math.atan2(playerPos.current.x - npc.pos.x, playerPos.current.z - npc.pos.z);
        activeGreets.push(npc.id);
        const now = Date.now();
        if ((greetedCooldown.current.get(npc.id) ?? 0) < now) {
          greetedCooldown.current.set(npc.id, now + 9000);
          setSpeechBubble(`${npc.config.name.split(' ')[0]}랑 꼬리 흔들며 인사했어요! ❤️`, 3200);
          addPoints(35, `❤️ ${npc.config.name.split(' ')[0]}와 소셜 인사!`);
        }
      } else {
        const dx = npc.target.x - npc.pos.x;
        const dz = npc.target.z - npc.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.35) {
          npc.pos.x += (dx / d) * 1.65 * dt;
          npc.pos.z += (dz / d) * 1.65 * dt;
          npc.rotY = Math.atan2(dx, dz);
        } else {
          npc.waitTimer -= dt;
          if (npc.waitTimer <= 0) {
            npc.target.set((Math.random() - 0.5) * 14, 0, (Math.random() - 0.5) * 14);
            npc.waitTimer = 2 + Math.random() * 2.5;
          }
        }
      }

      const ref = npcRefs.current[idx];
      if (ref) {
        ref.position.copy(npc.pos);
        ref.rotation.y = THREE.MathUtils.lerp(ref.rotation.y, npc.rotY, 0.12);
      }
    });

    if (activeGreets.join(',') !== greetingIds.join(',')) {
      setGreetingIds(activeGreets);
    }
  });

  const visibleSpeech = speechBubble && speechBubble.expiresAt > Date.now() ? speechBubble.text : null;

  return (
    <group>
      <color attach="background" args={['#93c5fd']} />
      <fog attach="fog" args={['#bae6fd', 18, 42]} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[10, 16, 8]} intensity={2.1} color="#fff7e6" castShadow shadow-mapSize={[1024, 1024]} />

      {/* Clickable Grass Field */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          targetPos.current.set(
            THREE.MathUtils.clamp(e.point.x, -11, 11),
            0,
            THREE.MathUtils.clamp(e.point.z, -11, 11)
          );
        }}
      >
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#67b868" roughness={0.92} />
      </mesh>

      {/* Winding Park Stone Pathways */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[3.4, 5.2, 48]} />
        <meshStandardMaterial color="#e6dcc8" roughness={0.88} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[2.1, 24]} />
        <meshStandardMaterial color="#e6dcc8" roughness={0.88} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[24, 2.1]} />
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

      {/* Trees, Benches & Streetlamps */}
      <ParkTree position={[-7.5, 0, -6.5]} />
      <ParkTree position={[7.8, 0, -7.2]} />
      <ParkTree position={[-8.2, 0, 5.8]} />
      <ParkTree position={[8.5, 0, 6.2]} />
      <ParkTree position={[0, 0, -9.8]} />
      <ParkTree position={[-9.5, 0, -0.5]} />

      <ParkLamp position={[-5.6, 0, -2.5]} />
      <ParkLamp position={[5.6, 0, -2.5]} />
      <ParkLamp position={[-5.6, 0, 3.8]} />
      <ParkLamp position={[5.6, 0, 3.8]} />

      <ParkBench position={[-5.9, 0, 0.4]} rotY={Math.PI / 2} />
      <ParkBench position={[5.9, 0, 0.4]} rotY={-Math.PI / 2} />

      {/* Collectible Glowing Treasure Chests & Golden Treats */}
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

      {/* 3 Autonomous AI NPC Pets */}
      {npcs.map((npc, idx) => {
        const isGreet = greetingIds.includes(npc.id);
        return (
          <group
            key={npc.id}
            ref={(el) => {
              npcRefs.current[idx] = el;
            }}
            position={[npc.pos.x, 0, npc.pos.z]}
          >
            <ProceduralPet
              pet={npc.config}
              action={isGreet ? 'pet' : 'walk'}
              nicknameTag={npc.config.name}
              showHeartBadge={isGreet}
              particles={isGreet ? 'heart' : null}
              speechText={isGreet ? '반가워! 같이 산책하자 ❤️' : null}
            />
          </group>
        );
      })}

      {/* Player Pet */}
      <group ref={playerGroupRef} position={[0, 0, 2]}>
        <ProceduralPet
          pet={pet}
          action={isWalking ? 'walk' : petAction}
          speechText={visibleSpeech}
          particles={greetingIds.length > 0 ? 'heart' : activeParticles}
        />
      </group>

      <Sparkles count={45} scale={[22, 5, 22]} size={2.2} speed={0.35} opacity={0.5} color="#fef08a" />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={26} blur={2} far={4} />
    </group>
  );
};

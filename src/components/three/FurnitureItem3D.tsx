import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurnitureItem } from '../../types';
import { createFabricTexture } from './proceduralTextures';

interface FurnitureItem3DProps {
  item: PlacedFurnitureItem;
  decorateMode: boolean;
  isSelected: boolean;
  isNightMood: boolean;
  isCyberpunk: boolean;
  onSelect: () => void;
  onInteract: () => void;
}

export const FurnitureItem3D: React.FC<FurnitureItem3DProps> = ({
  item,
  decorateMode,
  isSelected,
  isNightMood,
  isCyberpunk,
  onSelect,
  onInteract
}) => {
  const [hovered, setHovered] = useState(false);

  const fabricMap = useMemo(() => createFabricTexture('#ffffff'), []);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (decorateMode) {
      onSelect();
    } else {
      onInteract();
    }
  };

  return (
    <group
      position={item.position}
      rotation={[0, item.rotationY, 0]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Selection / Hover Ring on 3D Floor */}
      {(isSelected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[0.8, 0.92, 36]} />
          <meshStandardMaterial
            color={isSelected ? '#f43f5e' : '#38bdf8'}
            emissive={isSelected ? '#f43f5e' : '#38bdf8'}
            emissiveIntensity={1.9}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Hover Tooltip */}
      {hovered && (
        <Html position={[0, 1.55, 0]} center distanceFactor={9} zIndexRange={[25, 15]}>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-bold whitespace-nowrap border border-white/20 shadow pointer-events-none">
            {decorateMode ? `🛠️ 클릭 선택 · ${item.name}` : `👆 클릭 상호작용 · ${item.name}`}
          </div>
        </Html>
      )}

      {/* 1. Plush Matte Fabric Pet Bed */}
      {item.kind === 'bed' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.78, 0.86, 0.28, 32]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.94} metalness={0.0} />
          </mesh>
          {/* Soft Bolster Rim */}
          <mesh castShadow receiveShadow position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.68, 0.13, 14, 32]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.95} metalness={0.0} />
          </mesh>
          {/* Inner Bouclé Cushion */}
          <mesh receiveShadow position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.6, 0.62, 0.12, 28]} />
            <meshStandardMaterial color="#fbf7f0" map={fabricMap} roughness={0.96} metalness={0.0} />
          </mesh>
        </group>
      )}

      {/* 2. Oak & Brushed Stainless Steel Bowl Stand */}
      {item.kind === 'bowl' && (
        <group>
          {/* Satin Oak Wood Frame */}
          <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
            <boxGeometry args={[0.96, 0.14, 0.48]} />
            <meshStandardMaterial color="#bd8c5e" roughness={0.38} metalness={0.06} />
          </mesh>
          {[-0.4, 0.4].map((lx) =>
            [-0.17, 0.17].map((lz) => (
              <mesh key={`${lx}-${lz}`} castShadow position={[lx, 0.05, lz]}>
                <cylinderGeometry args={[0.03, 0.025, 0.1, 10]} />
                <meshStandardMaterial color="#9c6b3f" roughness={0.45} />
              </mesh>
            ))
          )}
          {/* Polished Stainless Kibble Bowl */}
          <mesh castShadow position={[-0.23, 0.22, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 0.12, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.14} />
          </mesh>
          <mesh position={[-0.23, 0.26, 0]}>
            <sphereGeometry args={[0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#6b3a19" roughness={0.88} />
          </mesh>
          {/* Polished Stainless Water Bowl */}
          <mesh castShadow position={[0.23, 0.22, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 0.12, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.14} />
          </mesh>
          <mesh position={[0.23, 0.26, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.025, 20]} />
            <meshPhysicalMaterial
              color={item.color}
              roughness={0.05}
              metalness={0.05}
              clearcoat={1}
              transmission={0.35}
            />
          </mesh>
        </group>
      )}

      {/* 3. Toy Ball & Rope Ring Set */}
      {item.kind === 'toy' && (
        <group>
          <mesh castShadow position={[-0.18, 0.22, 0]}>
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.35} roughness={0.55} />
          </mesh>
          <mesh castShadow position={[0.25, 0.09, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.055, 14, 28]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.78} />
          </mesh>
        </group>
      )}

      {/* 4. Glazed Ceramic Planter with Sculpted Botanical Foliage */}
      {item.kind === 'plant' && (
        <group>
          {/* Glossy Glazed Ceramic Pot */}
          <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.32, 0.23, 0.6, 28]} />
            <meshPhysicalMaterial color="#f3efe9" roughness={0.18} metalness={0.05} clearcoat={0.85} clearcoatRoughness={0.14} />
          </mesh>
          {/* Brass Rim Accent */}
          <mesh position={[0, 0.59, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.315, 0.015, 10, 28]} />
            <meshStandardMaterial color="#d4a359" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Dark Soil */}
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.05, 20]} />
            <meshStandardMaterial color="#3d2c1e" roughness={0.96} />
          </mesh>
          {/* Layered Botanical Leaves */}
          {[
            { pos: [0, 0.96, 0] as [number, number, number], r: 0.44, col: item.color },
            { pos: [0.26, 1.24, 0.12] as [number, number, number], r: 0.32, col: '#3eb471' },
            { pos: [-0.24, 1.18, -0.1] as [number, number, number], r: 0.3, col: '#2b8a57' },
            { pos: [0.05, 1.42, -0.05] as [number, number, number], r: 0.26, col: '#52c784' }
          ].map((leaf, i) => (
            <mesh key={i} castShadow position={leaf.pos}>
              <dodecahedronGeometry args={[leaf.r, 1]} />
              <meshStandardMaterial color={leaf.col} roughness={0.52} metalness={0.04} />
            </mesh>
          ))}
        </group>
      )}

      {/* 5. Brushed Brass & Marble Architectural Floor Lamp */}
      {item.kind === 'lamp' && (
        <group>
          {/* Polished Marble Weighted Base */}
          <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.26, 0.29, 0.12, 24]} />
            <meshPhysicalMaterial color="#eef0f2" roughness={0.15} clearcoat={0.7} />
          </mesh>
          {/* Brushed Brass Stem */}
          <mesh castShadow position={[0, 1.12, 0]}>
            <cylinderGeometry args={[0.032, 0.038, 2.08, 16]} />
            <meshStandardMaterial color="#d4a853" metalness={0.9} roughness={0.22} />
          </mesh>
          {/* Glowing Linen Shade (catches Bloom softly) */}
          <mesh position={[0, 2.18, 0]}>
            <cylinderGeometry args={[0.24, 0.38, 0.48, 28, 1, true]} />
            <meshStandardMaterial
              color="#fff8e7"
              map={fabricMap}
              emissive={isCyberpunk ? '#22d3ee' : item.color}
              emissiveIntensity={isNightMood || isCyberpunk ? 1.85 : 1.05}
              side={THREE.DoubleSide}
              toneMapped={false}
              roughness={0.85}
            />
          </mesh>
          {/* Inner Warm Bulb Core */}
          <mesh position={[0, 2.12, 0]}>
            <sphereGeometry args={[0.09, 14, 14]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={isCyberpunk ? '#22d3ee' : '#fde68a'}
              emissiveIntensity={2.6}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, 2.02, 0]}
            color={isCyberpunk ? '#22d3ee' : '#ffd89b'}
            intensity={isNightMood || isCyberpunk ? 3.2 : 1.2}
            distance={7.5}
          />
        </group>
      )}

      {/* 6. Natural Oak & Sisal Multi-Tier Cat Tower */}
      {item.kind === 'cattower' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[1.08, 0.16, 1.08]} />
            <meshStandardMaterial color="#c69b6d" roughness={0.42} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[-0.24, 0.66, -0.14]}>
            <cylinderGeometry args={[0.095, 0.095, 1.16, 16]} />
            <meshStandardMaterial color="#b9936c" map={fabricMap} roughness={0.96} />
          </mesh>
          <mesh castShadow position={[0.26, 1.04, 0.16]}>
            <cylinderGeometry args={[0.095, 0.095, 1.92, 16]} />
            <meshStandardMaterial color="#b9936c" map={fabricMap} roughness={0.96} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.24, 1.28, -0.14]}>
            <cylinderGeometry args={[0.42, 0.42, 0.1, 24]} />
            <meshStandardMaterial color="#d4b08c" roughness={0.45} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.26, 2.04, 0.16]}>
            <cylinderGeometry args={[0.46, 0.46, 0.14, 24]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.92} />
          </mesh>
        </group>
      )}

      {/* 7. Designer Matte Bouclé Lounge Sofa with Tapered Oak Legs & Throw Pillows */}
      {item.kind === 'sofa' && (
        <group>
          {/* Tapered Oak Legs */}
          {[-1.02, 1.02].map((lx) =>
            [-0.38, 0.38].map((lz) => (
              <mesh key={`${lx}-${lz}`} castShadow position={[lx, 0.1, lz]}>
                <cylinderGeometry args={[0.04, 0.028, 0.2, 10]} />
                <meshStandardMaterial color="#a47549" roughness={0.4} metalness={0.06} />
              </mesh>
            ))
          )}
          {/* Base Seat Frame */}
          <mesh castShadow receiveShadow position={[0, 0.38, 0]}>
            <boxGeometry args={[2.38, 0.38, 1.02]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.93} metalness={0.0} />
          </mesh>
          {/* Backrest */}
          <mesh castShadow receiveShadow position={[0, 0.84, -0.37]}>
            <boxGeometry args={[2.38, 0.62, 0.26]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.94} metalness={0.0} />
          </mesh>
          {/* Armrests */}
          <mesh castShadow position={[-1.08, 0.62, 0]}>
            <boxGeometry args={[0.22, 0.52, 1.02]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.94} metalness={0.0} />
          </mesh>
          <mesh castShadow position={[1.08, 0.62, 0]}>
            <boxGeometry args={[0.22, 0.52, 1.02]} />
            <meshStandardMaterial color={item.color} map={fabricMap} roughness={0.94} metalness={0.0} />
          </mesh>
          {/* Accent Throw Pillows */}
          <mesh castShadow position={[-0.78, 0.7, -0.14]} rotation={[0.2, 0.28, 0.1]}>
            <boxGeometry args={[0.38, 0.36, 0.14]} />
            <meshStandardMaterial color="#f5e6d3" map={fabricMap} roughness={0.96} />
          </mesh>
          <mesh castShadow position={[0.78, 0.7, -0.14]} rotation={[0.2, -0.28, -0.1]}>
            <boxGeometry args={[0.38, 0.36, 0.14]} />
            <meshStandardMaterial color="#ff9276" map={fabricMap} roughness={0.96} />
          </mesh>
        </group>
      )}
    </group>
  );
};

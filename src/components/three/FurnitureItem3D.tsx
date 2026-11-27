import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedFurnitureItem } from '../../types';

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
          <ringGeometry args={[0.78, 0.9, 32]} />
          <meshStandardMaterial
            color={isSelected ? '#f43f5e' : '#38bdf8'}
            emissive={isSelected ? '#f43f5e' : '#38bdf8'}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Hover Tooltip */}
      {hovered && (
        <Html position={[0, 1.5, 0]} center distanceFactor={9}>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-bold whitespace-nowrap border border-white/20 shadow">
            {decorateMode ? `🛠️ 클릭 선택 · ${item.name}` : `👆 클릭 상호작용 · ${item.name}`}
          </div>
        </Html>
      )}

      {/* 1. Pet Bed */}
      {item.kind === 'bed' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.78, 0.85, 0.26, 28]} />
            <meshStandardMaterial color={item.color} roughness={0.86} />
          </mesh>
          <mesh receiveShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.58, 0.62, 0.1, 24]} />
            <meshStandardMaterial color="#fff8f0" roughness={0.92} />
          </mesh>
        </group>
      )}

      {/* 2. Food & Water Bowl Stand */}
      {item.kind === 'bowl' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
            <boxGeometry args={[0.92, 0.18, 0.48]} />
            <meshStandardMaterial color="#c69b6d" roughness={0.75} />
          </mesh>
          {/* Kibble Bowl */}
          <mesh castShadow position={[-0.23, 0.2, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 0.12, 20]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.23, 0.24, 0]}>
            <sphereGeometry args={[0.14, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          {/* Water Bowl */}
          <mesh castShadow position={[0.23, 0.2, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 0.12, 20]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0.23, 0.24, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.03, 18]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.45} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* 3. Toy Ball & Ring Set */}
      {item.kind === 'toy' && (
        <group>
          <mesh castShadow position={[-0.18, 0.22, 0]}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.4} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0.24, 0.12, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.06, 12, 24]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.45} />
          </mesh>
        </group>
      )}

      {/* 4. Indoor Plant */}
      {item.kind === 'plant' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.3, 0.24, 0.56, 18]} />
            <meshStandardMaterial color="#e7e5e4" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0, 0.85, 0]}>
            <dodecahedronGeometry args={[0.48, 1]} />
            <meshStandardMaterial color={item.color} roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0.24, 1.18, 0.1]}>
            <dodecahedronGeometry args={[0.32, 1]} />
            <meshStandardMaterial color="#40b876" roughness={0.82} />
          </mesh>
        </group>
      )}

      {/* 5. Architectural Floor Lamp */}
      {item.kind === 'lamp' && (
        <group>
          <mesh castShadow position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.26, 0.28, 0.08, 20]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh castShadow position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 2.1, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.18, 0]}>
            <cylinderGeometry args={[0.24, 0.36, 0.46, 24, 1, true]} />
            <meshStandardMaterial
              color={item.color}
              emissive={isCyberpunk ? '#22d3ee' : item.color}
              emissiveIntensity={isNightMood || isCyberpunk ? 1.8 : 0.65}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, 2.0, 0]}
            color={isCyberpunk ? '#22d3ee' : '#ffd89b'}
            intensity={isNightMood || isCyberpunk ? 2.8 : 0.9}
            distance={7}
          />
        </group>
      )}

      {/* 6. Multi-Tier Cat Tower */}
      {item.kind === 'cattower' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[1.05, 0.16, 1.05]} />
            <meshStandardMaterial color={item.color} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[-0.24, 0.66, -0.14]}>
            <cylinderGeometry args={[0.095, 0.095, 1.16, 14]} />
            <meshStandardMaterial color="#b08968" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[0.26, 1.04, 0.16]}>
            <cylinderGeometry args={[0.095, 0.095, 1.92, 14]} />
            <meshStandardMaterial color="#b08968" roughness={0.95} />
          </mesh>
          <mesh castShadow position={[-0.24, 1.28, -0.14]}>
            <cylinderGeometry args={[0.4, 0.4, 0.12, 20]} />
            <meshStandardMaterial color="#ede0d4" roughness={0.88} />
          </mesh>
          <mesh castShadow position={[0.26, 2.04, 0.16]}>
            <cylinderGeometry args={[0.44, 0.44, 0.14, 20]} />
            <meshStandardMaterial color="#ff7a59" roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* 7. Modern Lounge Sofa */}
      {item.kind === 'sofa' && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.34, 0]}>
            <boxGeometry args={[2.35, 0.48, 1.0]} />
            <meshStandardMaterial color={item.color} roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0, 0.8, -0.36]}>
            <boxGeometry args={[2.35, 0.62, 0.26]} />
            <meshStandardMaterial color={item.color} roughness={0.84} />
          </mesh>
          <mesh castShadow position={[-1.08, 0.6, 0]}>
            <boxGeometry args={[0.22, 0.52, 1.0]} />
            <meshStandardMaterial color={item.color} roughness={0.84} />
          </mesh>
          <mesh castShadow position={[1.08, 0.6, 0]}>
            <boxGeometry args={[0.22, 0.52, 1.0]} />
            <meshStandardMaterial color={item.color} roughness={0.84} />
          </mesh>
        </group>
      )}
    </group>
  );
};

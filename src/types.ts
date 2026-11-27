export type WorldMode = 'myroom' | 'park' | 'runway' | 'guide';
export type ThemeMode = 'dark' | 'light';

export type PetBreed = 'shiba' | 'retriever' | 'cat' | 'rabbit' | 'corgi';
export type OutfitType = 'none' | 'neon_hoodie' | 'royal_hanbok' | 'tartan_dress' | 'pink_tutu';
export type HatType = 'none' | 'crown';
export type EyewearType = 'none' | 'sunglasses';
export type CollarType = 'none' | 'led_collar';

export type PetAction =
  | 'idle'
  | 'walk'
  | 'sit'
  | 'paw'
  | 'jump'
  | 'sleep'
  | 'eat'
  | 'bath'
  | 'pet'
  | 'runway_pose';

export type ParticleEffect = 'heart' | 'bubble' | 'sparkle' | null;

export type FloorType = 'oak' | 'marble' | 'terrazzo';
export type LightingMood = 'day' | 'sunset' | 'night' | 'cyberpunk';
export type RoomLayoutPreset = 'cozy' | 'gallery' | 'play';
export type RunwayCameraAngle = 'front' | 'low' | 'orbit360';

export type FurnitureKind = 'bed' | 'bowl' | 'toy' | 'plant' | 'lamp' | 'cattower' | 'sofa';

export interface PlacedFurnitureItem {
  id: string;
  kind: FurnitureKind;
  name: string;
  position: [number, number, number];
  rotationY: number;
  color: string;
}

export interface PlayerAvatarConfig {
  nickname: string;
  shirtColor: string;
  hairColor: string;
  skinColor: string;
  customGlbUrl: string | null;
  glbFacingOffsetY: number;
}

export interface PetConfig {
  name: string;
  breed: PetBreed;
  furColor: string;
  eyeColor: string;
  outfit: OutfitType;
  hat: HatType;
  eyewear: EyewearType;
  collar: CollarType;
  customGlbUrl: string | null;
  glbFacingOffsetY?: number;
}

export interface CareStats {
  fullness: number;
  cleanliness: number;
  energy: number;
  affection: number;
}

export interface RoomConfig {
  wallColor: string;
  floorType: FloorType;
  cushionColor: string;
  lightingMood: LightingMood;
  layoutPreset: RoomLayoutPreset;
  decorateMode: boolean;
  selectedFurnitureId: string | null;
  furniture: PlacedFurnitureItem[];
}

export interface RunwayState {
  isActive: boolean;
  cameraAngle: RunwayCameraAngle;
  autoCamera: boolean;
  phaseLabel: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'pet' | 'visitor' | 'system';
  senderName?: string;
  text: string;
  timestamp: string;
}

export interface SpeechBubbleState {
  text: string;
  expiresAt: number;
}

export interface AIToolGuideItem {
  id: string;
  category: '3d_character' | '3d_space' | 'fashion_video' | 'brain_sound';
  name: string;
  pricing: '무료' | '부분무료' | '유료';
  stage: string;
  assetPath: string;
  summary: string;
  tip: string;
  url: string;
}

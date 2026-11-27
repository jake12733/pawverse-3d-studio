import { create } from 'zustand';
import {
  CareStats,
  ChatMessage,
  CollarType,
  EyewearType,
  FurnitureKind,
  HatType,
  OutfitType,
  ParticleEffect,
  PetAction,
  PetBreed,
  PetConfig,
  PlacedFurnitureItem,
  PlayerAvatarConfig,
  RoomConfig,
  RunwayCameraAngle,
  RunwayState,
  SpeechBubbleState,
  ThemeMode,
  WorldMode
} from '../types';
import { BREED_CATALOG, DEFAULT_ROOM_FURNITURE, FASHION_CATALOG, FURNITURE_CATALOG } from '../data/catalog';
import { socialAdapter } from '../services/realtimeSocial';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const nowTime = () =>
  new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

interface MetaverseStore {
  worldMode: WorldMode;
  theme: ThemeMode;
  points: number;
  ownedFashionIds: string[];

  // Playable 3D Human Avatar
  player: PlayerAvatarConfig;
  playerSpeechBubble: SpeechBubbleState | null;
  visitorBubbles: Record<string, SpeechBubbleState>;

  // 3D Companion Pet
  pet: PetConfig;
  petAction: PetAction;
  petFollowPlayer: boolean;
  petInteractTarget: { id: string; kind: FurnitureKind; pos: [number, number, number]; triggerId: number } | null;
  speechBubble: SpeechBubbleState | null;
  activeParticles: ParticleEffect;

  stats: CareStats;
  room: RoomConfig;
  ballTriggerId: number;
  runway: RunwayState;

  messages: ChatMessage[];
  llmProvider: 'gemini' | 'openai';
  llmApiKey: string;
  isAiThinking: boolean;

  showWelcomeModal: boolean;
  showGuideModal: boolean;
  showRightDrawer: boolean;
  toastMessage: string | null;

  // Actions
  setWorldMode: (mode: WorldMode) => void;
  toggleTheme: () => void;
  setShowWelcomeModal: (v: boolean) => void;
  setShowGuideModal: (v: boolean) => void;
  setShowRightDrawer: (v: boolean) => void;
  showToast: (msg: string) => void;

  addPoints: (amount: number, reason?: string) => void;
  updatePlayer: (patch: Partial<PlayerAvatarConfig>) => void;
  setPlayerSpeechBubble: (text: string, durationMs?: number) => void;
  setVisitorSpeechBubble: (visitorId: string, text: string, durationMs?: number) => void;

  updatePet: (patch: Partial<PetConfig>) => void;
  selectBreed: (breed: PetBreed) => void;
  equipOrBuyFashion: (itemId: string) => void;
  setCustomGlbUrl: (url: string | null) => void;
  togglePetFollow: () => void;

  triggerPetAction: (action: PetAction, bubbleText?: string, particles?: ParticleEffect, durationMs?: number) => void;
  setSpeechBubble: (text: string, durationMs?: number) => void;

  // Care loop
  careFeed: () => void;
  carePet: () => void;
  careBath: () => void;
  careSleep: () => void;
  tickStatsDecay: () => void;

  // 3D Pet House Decorate & Furniture Placement
  updateRoom: (patch: Partial<RoomConfig>) => void;
  toggleDecorateMode: () => void;
  selectFurniture: (id: string | null) => void;
  addFurniture: (kind: FurnitureKind) => void;
  moveSelectedFurniture: (pos: [number, number, number]) => void;
  rotateSelectedFurniture: () => void;
  recolorSelectedFurniture: (hex: string) => void;
  removeSelectedFurniture: () => void;
  interactWithFurniture: (item: PlacedFurnitureItem) => void;
  triggerRoomBallFetch: () => void;

  // Runway
  toggleRunwayShow: () => void;
  setRunwayCameraAngle: (angle: RunwayCameraAngle) => void;
  toggleRunwayAutoCamera: () => void;
  setRunwayPhaseLabel: (label: string) => void;

  // Social & AI Chat
  setLlmConfig: (provider: 'gemini' | 'openai', apiKey: string) => void;
  sendChatCommand: (rawText: string) => Promise<void>;
}

let actionTimeout: ReturnType<typeof setTimeout> | null = null;
let particleTimeout: ReturnType<typeof setTimeout> | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

// Connect decoupled social adapter on boot
socialAdapter.connect({ id: 'local-player', nickname: '나 (집사)' });

export const useMetaverseStore = create<MetaverseStore>((set, get) => ({
  worldMode: 'myroom',
  theme: 'dark',
  points: 5000,
  ownedFashionIds: ['outfit_none'],

  player: {
    nickname: '나 (집사)',
    shirtColor: '#F43F5E',
    hairColor: '#1E1B18',
    skinColor: '#F5D0B5',
    customGlbUrl: null
  },
  playerSpeechBubble: null,
  visitorBubbles: {},

  pet: {
    name: '루나',
    breed: 'shiba',
    furColor: '#E09F5A',
    eyeColor: '#1F1A17',
    outfit: 'none',
    hat: 'none',
    eyewear: 'none',
    collar: 'led_collar',
    customGlbUrl: null
  },
  petAction: 'idle',
  petFollowPlayer: true,
  petInteractTarget: null,
  speechBubble: { text: 'WASD로 걸어 봐요! 내가 옆에서 따라갈게 🐾', expiresAt: Date.now() + 5200 },
  activeParticles: null,

  stats: {
    fullness: 84,
    cleanliness: 88,
    energy: 86,
    affection: 78
  },

  room: {
    wallColor: '#F3EFE8',
    floorType: 'oak',
    cushionColor: '#FF7A59',
    lightingMood: 'day',
    layoutPreset: 'cozy',
    decorateMode: false,
    selectedFurnitureId: null,
    furniture: structuredClone(DEFAULT_ROOM_FURNITURE)
  },
  ballTriggerId: 0,

  runway: {
    isActive: false,
    cameraAngle: 'front',
    autoCamera: true,
    phaseLabel: '대기 중 · [패션쇼 시작]을 눌러 런웨이를 시작하세요'
  },

  messages: [
    {
      id: 'init-1',
      sender: 'system',
      text: '3D 메타버스 입장 완료! WASD 이동, 마우스 드래그 시점 회전, 채팅 시 내 아바타 머리 위 말풍선이 표시됩니다.',
      timestamp: nowTime()
    },
    {
      id: 'init-2',
      sender: 'pet',
      senderName: '루나',
      text: '안녕 보호자님! 펫 하우스를 꾸미거나 커뮤니티 광장에서 친구들을 만나요 🐾',
      timestamp: nowTime()
    }
  ],
  llmProvider: 'gemini',
  llmApiKey: '',
  isAiThinking: false,

  showWelcomeModal: true,
  showGuideModal: false,
  showRightDrawer: true,
  toastMessage: null,

  setWorldMode: (mode) => {
    if (mode === 'guide') {
      set({ showGuideModal: true });
      return;
    }
    set((s) => ({
      worldMode: mode,
      showGuideModal: false,
      room: { ...s.room, decorateMode: false, selectedFurnitureId: null },
      runway: mode === 'runway' ? s.runway : { ...s.runway, isActive: false }
    }));
    const labels: Record<Exclude<WorldMode, 'guide'>, string> = {
      myroom: '🏠 내 펫 하우스 입장! WASD로 돌아다니고 [꾸미기 모드]로 3D 가구를 배치해 보세요.',
      park: '🌳 커뮤니티 광장 입장! 다른 아바타 친구들과 채팅하고 산책해 보세요.',
      runway: '✨ AI 패션쇼 런웨이 무대! [패션쇼 시작]을 눌러 쇼케이스를 연출해 보세요.'
    };
    get().setSpeechBubble(
      mode === 'myroom'
        ? '우리 집이다! 밥그릇이나 장난감을 클릭해 봐요 🏠'
        : mode === 'park'
        ? '광장에 친구들이 많이 와있어! 같이 걸어가 보자 🐾'
        : '무대 위 스포트라이트 준비 완료! ✨',
      4200
    );
    get().showToast(labels[mode]);
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  setShowWelcomeModal: (v) => set({ showWelcomeModal: v }),
  setShowGuideModal: (v) => set({ showGuideModal: v }),
  setShowRightDrawer: (v) => set({ showRightDrawer: v }),

  showToast: (msg) => {
    set({ toastMessage: msg });
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => set({ toastMessage: null }), 2800);
  },

  addPoints: (amount, reason) => {
    set((s) => ({ points: s.points + amount }));
    if (reason) get().showToast(`${reason} (+${amount} P)`);
  },

  updatePlayer: (patch) => set((s) => ({ player: { ...s.player, ...patch } })),

  setPlayerSpeechBubble: (text, durationMs = 4200) => {
    set({ playerSpeechBubble: { text, expiresAt: Date.now() + durationMs } });
  },

  setVisitorSpeechBubble: (visitorId, text, durationMs = 4500) => {
    set((s) => ({
      visitorBubbles: {
        ...s.visitorBubbles,
        [visitorId]: { text, expiresAt: Date.now() + durationMs }
      }
    }));
  },

  updatePet: (patch) => set((s) => ({ pet: { ...s.pet, ...patch } })),

  selectBreed: (breed) => {
    const spec = BREED_CATALOG.find((b) => b.id === breed);
    set((s) => ({
      pet: {
        ...s.pet,
        breed,
        furColor: spec ? spec.defaultFur : s.pet.furColor,
        customGlbUrl: null
      }
    }));
    get().triggerPetAction('jump', `${spec?.name ?? '새 친구'} 모습으로 변신! ✨`, 'sparkle', 1800);
  },

  equipOrBuyFashion: (itemId) => {
    const item = FASHION_CATALOG.find((i) => i.id === itemId);
    if (!item) return;
    const state = get();
    const owned = state.ownedFashionIds.includes(item.id) || item.price === 0;

    if (!owned) {
      if (state.points < item.price) {
        state.showToast('🪙 포인트가 부족해요! 광장에서 보물상자를 찾아보세요.');
        return;
      }
      set((s) => ({
        points: s.points - item.price,
        ownedFashionIds: [...s.ownedFashionIds, item.id]
      }));
      state.showToast(`${item.emoji} ${item.name} 구매 & 장착 완료! (-${item.price} P)`);
    } else {
      state.showToast(`${item.emoji} ${item.name} 장착 완료!`);
    }

    set((s) => {
      const nextPet = { ...s.pet };
      if (item.slot === 'outfit') nextPet.outfit = item.value as OutfitType;
      else if (item.slot === 'hat') nextPet.hat = (s.pet.hat === item.value ? 'none' : item.value) as HatType;
      else if (item.slot === 'eyewear') nextPet.eyewear = (s.pet.eyewear === item.value ? 'none' : item.value) as EyewearType;
      else if (item.slot === 'collar') nextPet.collar = (s.pet.collar === item.value ? 'none' : item.value) as CollarType;
      return { pet: nextPet };
    });

    get().triggerPetAction('jump', `${item.name} 어때? 멋지지! ✨`, 'sparkle', 1600);
  },

  setCustomGlbUrl: (url) => {
    set((s) => ({ pet: { ...s.pet, customGlbUrl: url } }));
    get().showToast(url ? '📦 외부 .GLB 3D 모델이 적용되었습니다!' : '🐾 기본 절차적 3D 모델로 복원되었습니다.');
  },

  togglePetFollow: () => {
    const next = !get().petFollowPlayer;
    set({ petFollowPlayer: next });
    get().setSpeechBubble(next ? '보호자님 옆에 딱 붙어 걸을게! 🐾' : '주변 구경 좀 하고 올게~ 🌿', 3000);
    get().showToast(next ? '🐾 반려동물 모드: 내 아바타 따라오기' : '🌿 반려동물 모드: 공간 자유 탐험');
  },

  setSpeechBubble: (text, durationMs = 3600) => {
    set({ speechBubble: { text, expiresAt: Date.now() + durationMs } });
  },

  triggerPetAction: (action, bubbleText, particles = null, durationMs = 2400) => {
    set({ petAction: action });
    if (bubbleText) get().setSpeechBubble(bubbleText, durationMs + 800);
    if (particles) {
      set({ activeParticles: particles });
      if (particleTimeout) clearTimeout(particleTimeout);
      particleTimeout = setTimeout(() => set({ activeParticles: null }), durationMs);
    }
    if (actionTimeout) clearTimeout(actionTimeout);
    if (action !== 'sleep' && action !== 'idle') {
      actionTimeout = setTimeout(() => {
        if (get().petAction === action) set({ petAction: 'idle' });
      }, durationMs);
    }
  },

  careFeed: () => {
    set((s) => ({
      stats: {
        ...s.stats,
        fullness: clamp(s.stats.fullness + 22),
        affection: clamp(s.stats.affection + 5),
        energy: clamp(s.stats.energy + 6)
      },
      points: s.points + 25
    }));
    get().triggerPetAction('eat', '냠냠! 간식 너무 맛있어 🍖', 'sparkle', 2400);
    get().showToast('🍖 간식 급여 완료! 포만감 +22 (+25 P)');
  },

  carePet: () => {
    set((s) => ({
      stats: { ...s.stats, affection: clamp(s.stats.affection + 14) },
      points: s.points + 20
    }));
    get().triggerPetAction('pet', '쓰다듬어 주니까 너무 행복해! ❤️', 'heart', 2400);
    get().showToast('❤️ 쓰다듬기 완료! 애정도 +14 (+20 P)');
  },

  careBath: () => {
    set((s) => ({
      stats: {
        ...s.stats,
        cleanliness: clamp(s.stats.cleanliness + 28),
        energy: clamp(s.stats.energy - 4),
        affection: clamp(s.stats.affection + 4)
      },
      points: s.points + 30
    }));
    get().triggerPetAction('bath', '보글보글 목욕하니까 개운해! 🫧', 'bubble', 2600);
    get().showToast('🛁 목욕/빗질 완료! 청결도 +28 (+30 P)');
  },

  careSleep: () => {
    const isSleeping = get().petAction === 'sleep';
    if (isSleeping) {
      set((s) => ({
        petAction: 'idle',
        room: { ...s.room, lightingMood: 'day' }
      }));
      get().setSpeechBubble('잘 잤다! 기지개 쭉~ ☀️', 3000);
      get().showToast('☀️ 기상 완료!');
      return;
    }
    set((s) => ({
      petAction: 'sleep',
      room: { ...s.room, lightingMood: 'night' },
      stats: { ...s.stats, energy: clamp(s.stats.energy + 32) }
    }));
    get().setSpeechBubble('포근하게 잘게... Zzz 🌙', 5000);
    get().showToast('🌙 수면 모드 전환 (에너지 +32)');
  },

  tickStatsDecay: () => {
    set((s) => ({
      stats: {
        fullness: clamp(s.stats.fullness - 1),
        cleanliness: clamp(s.stats.cleanliness - 1),
        energy: s.petAction === 'sleep' ? clamp(s.stats.energy + 3) : clamp(s.stats.energy - 1),
        affection: s.stats.affection
      }
    }));
  },

  updateRoom: (patch) => set((s) => ({ room: { ...s.room, ...patch } })),

  toggleDecorateMode: () => {
    const next = !get().room.decorateMode;
    set((s) => ({
      worldMode: 'myroom',
      room: {
        ...s.room,
        decorateMode: next,
        selectedFurnitureId: next ? s.room.furniture[0]?.id ?? null : null
      }
    }));
    get().showToast(
      next
        ? '🛠️ 3D 공간 꾸미기 모드 ON! 가구 선택 후 바닥을 클릭하면 위치가 이동됩니다.'
        : '✅ 꾸미기 완료! WASD로 내 방을 자유롭게 걸어 다녀 보세요.'
    );
  },

  selectFurniture: (id) =>
    set((s) => ({ room: { ...s.room, selectedFurnitureId: id } })),

  addFurniture: (kind) => {
    const spec = FURNITURE_CATALOG.find((c) => c.kind === kind);
    if (!spec) return;
    const id = `f-${kind}-${Date.now()}`;
    const newItem: PlacedFurnitureItem = {
      id,
      kind,
      name: spec.name,
      position: [(Math.random() - 0.5) * 4.2, 0, (Math.random() - 0.5) * 3.4],
      rotationY: 0,
      color: spec.defaultColor
    };
    set((s) => ({
      worldMode: 'myroom',
      room: {
        ...s.room,
        decorateMode: true,
        selectedFurnitureId: id,
        furniture: [...s.room.furniture, newItem]
      }
    }));
    get().showToast(`${spec.emoji} ${spec.name} 배치 완료! 바닥을 클릭해 원하는 위치로 옮겨보세요.`);
  },

  moveSelectedFurniture: (pos) => {
    const selId = get().room.selectedFurnitureId;
    if (!selId) return;
    const clamped: [number, number, number] = [
      Math.max(-3.6, Math.min(3.6, pos[0])),
      0,
      Math.max(-3.1, Math.min(3.1, pos[2]))
    ];
    set((s) => ({
      room: {
        ...s.room,
        furniture: s.room.furniture.map((f) => (f.id === selId ? { ...f, position: clamped } : f))
      }
    }));
  },

  rotateSelectedFurniture: () => {
    const selId = get().room.selectedFurnitureId;
    if (!selId) return;
    set((s) => ({
      room: {
        ...s.room,
        furniture: s.room.furniture.map((f) =>
          f.id === selId ? { ...f, rotationY: f.rotationY + Math.PI / 4 } : f
        )
      }
    }));
  },

  recolorSelectedFurniture: (hex) => {
    const selId = get().room.selectedFurnitureId;
    if (!selId) return;
    set((s) => ({
      room: {
        ...s.room,
        furniture: s.room.furniture.map((f) => (f.id === selId ? { ...f, color: hex } : f))
      }
    }));
  },

  removeSelectedFurniture: () => {
    const selId = get().room.selectedFurnitureId;
    if (!selId) return;
    set((s) => ({
      room: {
        ...s.room,
        selectedFurnitureId: null,
        furniture: s.room.furniture.filter((f) => f.id !== selId)
      }
    }));
    get().showToast('🗑️ 선택한 가구를 제거했습니다.');
  },

  interactWithFurniture: (item) => {
    set((s) => ({
      petInteractTarget: {
        id: item.id,
        kind: item.kind,
        pos: item.position,
        triggerId: (s.petInteractTarget?.triggerId ?? 0) + 1
      }
    }));

    if (item.kind === 'bowl') {
      set((s) => ({
        stats: { ...s.stats, fullness: clamp(s.stats.fullness + 22), affection: clamp(s.stats.affection + 5) },
        points: s.points + 25
      }));
      get().setSpeechBubble('밥그릇으로 달려가는 중! 냠냠 🥣', 3200);
      get().showToast('🥣 밥그릇 상호작용! 포만감 +22, 애정도 +5');
    } else if (item.kind === 'toy') {
      set((s) => ({
        stats: { ...s.stats, affection: clamp(s.stats.affection + 12), energy: clamp(s.stats.energy - 4) },
        points: s.points + 35
      }));
      get().setSpeechBubble('장난감이다!! 신나게 놀자 🎾', 3200);
      get().showToast('🎾 장난감 상호작용! 애정도 +12 (+35 P)');
    } else if (item.kind === 'bed' || item.kind === 'sofa') {
      set((s) => ({
        stats: { ...s.stats, energy: clamp(s.stats.energy + 22), affection: clamp(s.stats.affection + 6) }
      }));
      get().setSpeechBubble(`${item.name} 너무 폭신해~ 휴식 중 💤`, 3500);
      get().showToast(`🛏️ ${item.name}에서 휴식! 에너지 +22`);
    } else if (item.kind === 'plant') {
      set((s) => ({
        stats: { ...s.stats, cleanliness: clamp(s.stats.cleanliness + 8), affection: clamp(s.stats.affection + 6) }
      }));
      get().setSpeechBubble('초록 화분 냄새 상쾌해 🪴', 3000);
    } else {
      set((s) => ({ stats: { ...s.stats, affection: clamp(s.stats.affection + 8) } }));
      get().setSpeechBubble(`${item.name} 구경하는 중! ✨`, 3000);
    }
  },

  triggerRoomBallFetch: () => {
    const toyItem = get().room.furniture.find((f) => f.kind === 'toy');
    if (toyItem) {
      get().interactWithFurniture(toyItem);
    } else {
      set((s) => ({
        ballTriggerId: s.ballTriggerId + 1,
        stats: { ...s.stats, affection: clamp(s.stats.affection + 8), energy: clamp(s.stats.energy - 4) },
        points: s.points + 40
      }));
      get().setSpeechBubble('공이다!! 얼른 물어올게 🎾', 3000);
    }
  },

  toggleRunwayShow: () => {
    const next = !get().runway.isActive;
    set((s) => ({
      worldMode: 'runway',
      runway: {
        ...s.runway,
        isActive: next,
        phaseLabel: next ? '🎬 워킹 시작 · 스포트라이트 트래킹 중' : '대기 중 · [패션쇼 시작]을 눌러 쇼를 시작하세요'
      }
    }));
    if (next) {
      get().setSpeechBubble('런웨이 쇼타임! 모두 주목해 ✨', 3500);
      get().showToast('✨ AI 패션쇼 런웨이 쇼케이스 시작!');
    }
  },

  setRunwayCameraAngle: (angle) =>
    set((s) => ({ runway: { ...s.runway, cameraAngle: angle, autoCamera: false } })),

  toggleRunwayAutoCamera: () =>
    set((s) => ({ runway: { ...s.runway, autoCamera: !s.runway.autoCamera } })),

  setRunwayPhaseLabel: (label) =>
    set((s) => ({ runway: { ...s.runway, phaseLabel: label } })),

  setLlmConfig: (provider, apiKey) => set({ llmProvider: provider, llmApiKey: apiKey.trim() }),

  sendChatCommand: async (rawText) => {
    const text = rawText.trim();
    if (!text) return;

    const { player, worldMode } = get();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      senderName: player.nickname,
      text,
      timestamp: nowTime()
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // Immediately show speech bubble right above MY Player Avatar's head!
    get().setPlayerSpeechBubble(text, 4400);

    // Broadcast to Social Plaza visitors when in Community Plaza
    if (worldMode === 'park') {
      socialAdapter.sendChat(text, (replyPayload, visitorId) => {
        get().setVisitorSpeechBubble(visitorId, replyPayload.text, 5000);
        set((s) => ({
          messages: [
            ...s.messages.slice(-28),
            {
              id: `v-${Date.now()}`,
              sender: 'visitor',
              senderName: replyPayload.senderName,
              text: replyPayload.text,
              timestamp: replyPayload.timestamp
            }
          ]
        }));
      });
    }

    // Immediate 3D pet command response
    let defaultReply = '';
    if (text.includes('앉아')) {
      get().triggerPetAction('sit', '네! 얌전히 앉았어요 🐾', 'sparkle', 3200);
      defaultReply = '척하면 척! 예쁘게 앉았어요. 간식 주실 거죠? 🍖';
      get().addPoints(20);
    } else if (text.includes('손')) {
      get().triggerPetAction('paw', '여기 내 앞발! 하이파이브 🐾', 'heart', 3000);
      defaultReply = '여기 앞발 꾹! 보호자님 손이 제일 따뜻해요 ❤️';
      get().addPoints(20);
    } else if (text.includes('점프') || text.includes('뛰어')) {
      get().triggerPetAction('jump', '폴짝! 높이 뛰었죠? ⚡', 'sparkle', 2400);
      defaultReply = '하나 둘 셋, 폴짝! 공중 점프 완벽했죠? ⚡';
      get().addPoints(20);
    } else if (text.includes('런웨이') || text.includes('패션쇼')) {
      set({ worldMode: 'runway' });
      if (!get().runway.isActive) get().toggleRunwayShow();
      defaultReply = '런웨이 무대로 바로 이동했어요! 오늘의 주인공은 바로 나 ✨';
    } else if (text.includes('산책') || text.includes('광장')) {
      if (worldMode !== 'park') get().setWorldMode('park');
      defaultReply = '야호! 커뮤니티 광장에서 친구들과 같이 산책해요 🌳';
    } else if (text.includes('마이룸') || text.includes('하우스') || text.includes('방')) {
      get().setWorldMode('myroom');
      defaultReply = '아늑한 내 펫 하우스로 돌아왔어요! 가구도 꾸며볼까요? 🏠';
    } else if (text.includes('사랑') || text.includes('예뻐') || text.includes('귀여')) {
      get().carePet();
      defaultReply = `나도 보호자님 세상에서 제일 사랑해!! (${get().pet.name} 애정도 UP ❤️)`;
    } else if (text.includes('밥') || text.includes('간식')) {
      get().careFeed();
      defaultReply = '와아 맛있는 간식이다! 에너지가 가득 충전됐어요 🍖';
    } else if (text.includes('목욕') || text.includes('씻')) {
      get().careBath();
      defaultReply = '거품 목욕 완료! 털이 뽀송뽀송해졌어요 🫧';
    } else if (text.includes('잘자') || text.includes('재워')) {
      if (get().petAction !== 'sleep') get().careSleep();
      defaultReply = '좋은 꿈 꿀게요... 보호자님도 푹 쉬세요 Zzz 🌙';
    }

    // Optional real LLM API call
    const { llmApiKey, llmProvider, pet, stats } = get();
    if (llmApiKey) {
      set({ isAiThinking: true });
      try {
        const systemPrompt = `당신은 3D 메타버스 속 반려동물 '${pet.name}'(${pet.breed})입니다. 포만감 ${stats.fullness}%, 청결도 ${stats.cleanliness}%, 에너지 ${stats.energy}%, 애정도 ${stats.affection}%. 보호자에게 다정하게 1~2문장으로 답하세요.`;
        let aiText = '';
        if (llmProvider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llmApiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              max_tokens: 90,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
              ]
            })
          });
          if (res.ok) {
            const json = await res.json();
            aiText = json.choices?.[0]?.message?.content?.trim() ?? '';
          }
        } else {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(llmApiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n보호자: ${text}` }] }]
              })
            }
          );
          if (res.ok) {
            const json = await res.json();
            aiText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
          }
        }
        if (aiText) {
          defaultReply = aiText;
          get().setSpeechBubble(aiText.slice(0, 60), 4200);
        }
      } catch {
        // Fallback smoothly
      } finally {
        set({ isAiThinking: false });
      }
    }

    // In Pet House or when no visitor handles it, let our companion pet reply warmly
    if (defaultReply || worldMode !== 'park') {
      const finalReply =
        defaultReply ||
        `멍! "${text}" 얘기 듣고 꼬리가 살랑살랑~ 같이 걸을까? (애정도 ${stats.affection}%) 🐾`;
      if (!defaultReply) {
        get().triggerPetAction('pet', finalReply.slice(0, 48), 'heart', 2400);
      }
      const petMsg: ChatMessage = {
        id: `p-${Date.now()}`,
        sender: 'pet',
        senderName: pet.name,
        text: finalReply,
        timestamp: nowTime()
      };
      set((s) => ({ messages: [...s.messages.slice(-28), petMsg] }));
    }
  }
}));

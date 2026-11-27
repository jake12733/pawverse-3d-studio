import { create } from 'zustand';
import {
  CareStats,
  ChatMessage,
  CollarType,
  EyewearType,
  FloorType,
  HatType,
  LightingMood,
  OutfitType,
  ParticleEffect,
  PetAction,
  PetBreed,
  PetConfig,
  RoomConfig,
  RoomLayoutPreset,
  RunwayCameraAngle,
  RunwayState,
  SpeechBubbleState,
  ThemeMode,
  WorldMode
} from '../types';
import { BREED_CATALOG, FASHION_CATALOG } from '../data/catalog';

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

  pet: PetConfig;
  petAction: PetAction;
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
  updatePet: (patch: Partial<PetConfig>) => void;
  selectBreed: (breed: PetBreed) => void;
  equipOrBuyFashion: (itemId: string) => void;
  setCustomGlbUrl: (url: string | null) => void;

  triggerPetAction: (action: PetAction, bubbleText?: string, particles?: ParticleEffect, durationMs?: number) => void;
  setSpeechBubble: (text: string, durationMs?: number) => void;

  // Care loop
  careFeed: () => void;
  carePet: () => void;
  careBath: () => void;
  careSleep: () => void;
  tickStatsDecay: () => void;

  // My Room
  updateRoom: (patch: Partial<RoomConfig>) => void;
  triggerRoomBallFetch: () => void;

  // Runway
  toggleRunwayShow: () => void;
  setRunwayCameraAngle: (angle: RunwayCameraAngle) => void;
  toggleRunwayAutoCamera: () => void;
  setRunwayPhaseLabel: (label: string) => void;

  // AI Chat
  setLlmConfig: (provider: 'gemini' | 'openai', apiKey: string) => void;
  sendChatCommand: (rawText: string) => Promise<void>;
}

let actionTimeout: ReturnType<typeof setTimeout> | null = null;
let particleTimeout: ReturnType<typeof setTimeout> | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMetaverseStore = create<MetaverseStore>((set, get) => ({
  worldMode: 'myroom',
  theme: 'dark',
  points: 5000,
  ownedFashionIds: ['outfit_none'],

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
  speechBubble: { text: 'PawVerse 3D 스튜디오에 오신 걸 환영해요! 🐾', expiresAt: Date.now() + 5000 },
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
    layoutPreset: 'cozy'
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
      text: 'AI 펫 교감 채널 연결 완료! "앉아", "손", "점프", "런웨이 걷자", "산책 가자", "사랑해"를 입력해 보세요.',
      timestamp: nowTime()
    },
    {
      id: 'init-2',
      sender: 'pet',
      text: '안녕 보호자님! 오늘은 마이룸에서 공놀이할까, 아니면 런웨이 패션쇼 해볼까? ✨',
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
      runway: mode === 'runway' ? s.runway : { ...s.runway, isActive: false }
    }));
    const labels: Record<Exclude<WorldMode, 'guide'>, string> = {
      myroom: '🏠 마이룸 & 3D 인테리어 스튜디오에 입장했습니다.',
      park: '🌳 가상 산책 공원! WASD/방향키 또는 바닥 클릭으로 산책해 보세요.',
      runway: '✨ AI 패션쇼 런웨이 무대! [패션쇼 시작]을 눌러 쇼케이스를 연출해 보세요.'
    };
    get().setSpeechBubble(
      mode === 'myroom'
        ? '내 방 최고야! 바닥의 공을 클릭해 봐 🎾'
        : mode === 'park'
        ? '산책 나왔다!! 보물상자랑 친구들 찾아보자 🐾'
        : '무대 위 스포트라이트 준비 완료! ✨',
      4000
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
        state.showToast('🪙 포인트가 부족해요! 산책 공원에서 보물상자를 찾아보세요.');
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
      if (item.slot === 'outfit') {
        nextPet.outfit = item.value as OutfitType;
      } else if (item.slot === 'hat') {
        nextPet.hat = (s.pet.hat === item.value ? 'none' : item.value) as HatType;
      } else if (item.slot === 'eyewear') {
        nextPet.eyewear = (s.pet.eyewear === item.value ? 'none' : item.value) as EyewearType;
      } else if (item.slot === 'collar') {
        nextPet.collar = (s.pet.collar === item.value ? 'none' : item.value) as CollarType;
      }
      return { pet: nextPet };
    });

    get().triggerPetAction('jump', `${item.name} 어때? 멋지지! ✨`, 'sparkle', 1600);
  },

  setCustomGlbUrl: (url) => {
    set((s) => ({ pet: { ...s.pet, customGlbUrl: url } }));
    get().showToast(url ? '📦 외부 .GLB 3D 모델이 적용되었습니다!' : '🐾 기본 절차적 3D 모델로 복원되었습니다.');
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
    get().showToast('🍖 밥/간식 급여 완료! 포만감 +22 (+25 P)');
  },

  carePet: () => {
    set((s) => ({
      stats: {
        ...s.stats,
        affection: clamp(s.stats.affection + 14)
      },
      points: s.points + 20
    }));
    get().triggerPetAction('pet', '쓰다듬어 주니까 너무 행복해! ❤️', 'heart', 2400);
    get().showToast('❤️ 쓰다듬기 완료! 친밀도 +14 (+20 P)');
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
      get().showToast('☀️ 기상 완료! 활기찬 하루를 시작해요.');
      return;
    }
    set((s) => ({
      petAction: 'sleep',
      room: { ...s.room, lightingMood: 'night' },
      stats: {
        ...s.stats,
        energy: clamp(s.stats.energy + 32)
      }
    }));
    get().setSpeechBubble('포근하게 잘게... Zzz 🌙', 5000);
    get().showToast('🌙 조명이 어두워지며 수면 모드로 전환됩니다. (에너지 +32)');
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

  triggerRoomBallFetch: () => {
    set((s) => ({
      ballTriggerId: s.ballTriggerId + 1,
      stats: {
        ...s.stats,
        affection: clamp(s.stats.affection + 6),
        energy: clamp(s.stats.energy - 4)
      },
      points: s.points + 40
    }));
    get().setSpeechBubble('공이다!! 내가 얼른 물고 올게 🎾', 3200);
    get().showToast('🎾 장난감 공 자율 추격 시작! (+40 P)');
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

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: nowTime()
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // Trigger immediate 3D command animations regardless of LLM mode
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
    } else if (text.includes('산책')) {
      get().setWorldMode('park');
      defaultReply = '야호! 산책 공원으로 나왔어요! 보물상자랑 친구들 만나러 가요 🌳';
    } else if (text.includes('마이룸') || text.includes('방')) {
      get().setWorldMode('myroom');
      defaultReply = '아늑한 마이룸으로 돌아왔어요! 공놀이도 할 수 있어요 🏠';
    } else if (text.includes('사랑') || text.includes('예뻐') || text.includes('귀여')) {
      get().carePet();
      defaultReply = `나도 보호자님 세상에서 제일 사랑해!! (${get().pet.name}의 친밀도가 쑥 올라갔어요 ❤️)`;
    } else if (text.includes('밥') || text.includes('간식') || text.includes('배고')) {
      get().careFeed();
      defaultReply = '와아 맛있는 간식이다! 에너지가 가득 충전됐어요 🍖';
    } else if (text.includes('목욕') || text.includes('씻')) {
      get().careBath();
      defaultReply = '거품 목욕 완료! 털이 뽀송뽀송해졌어요 🫧';
    } else if (text.includes('잘자') || text.includes('재워')) {
      if (get().petAction !== 'sleep') get().careSleep();
      defaultReply = '좋은 꿈 꿀게요... 보호자님도 푹 쉬세요 Zzz 🌙';
    }

    // Optional real LLM API call when user configures an API key
    const { llmApiKey, llmProvider, pet, stats } = get();
    if (llmApiKey) {
      set({ isAiThinking: true });
      try {
        const systemPrompt = `당신은 3D 반려동물 메타버스 속 '${pet.name}'(${pet.breed})입니다. 현재 포만감 ${stats.fullness}%, 청결도 ${stats.cleanliness}%, 에너지 ${stats.energy}%, 친밀도 ${stats.affection}%입니다. 다정하고 생동감 있는 한국어 반말/애교체로 1~2문장 이내로 짧게 대답하세요.`;
        let aiText = '';
        if (llmProvider === 'openai') {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${llmApiKey}`
            },
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
        // Silently fall back to smart rule-based AI persona
      } finally {
        set({ isAiThinking: false });
      }
    }

    if (!defaultReply) {
      const smartReplies = [
        `멍! "${text}" 얘기 재밌다! 꼬리가 절로 흔들려요 🐾`,
        `보호자님이랑 대화하는 게 제일 좋아! 지금 친밀도가 ${stats.affection}%나 돼요 ❤️`,
        `"${text}"~? 갸우뚱! 나랑 공놀이하거나 런웨이 걸어볼래요? ✨`
      ];
      defaultReply = smartReplies[Math.floor(Math.random() * smartReplies.length)];
      get().triggerPetAction('pet', defaultReply.slice(0, 48), 'heart', 2600);
    }

    const petMsg: ChatMessage = {
      id: `p-${Date.now()}`,
      sender: 'pet',
      text: defaultReply,
      timestamp: nowTime()
    };
    set((s) => ({ messages: [...s.messages.slice(-24), petMsg] }));
  }
}));

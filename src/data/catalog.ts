import { AIToolGuideItem, FloorType, LightingMood, PetBreed, RoomLayoutPreset } from '../types';

export const BREED_CATALOG: { id: PetBreed; name: string; emoji: string; defaultFur: string; desc: string }[] = [
  { id: 'shiba', name: '시바견', emoji: '🐕', defaultFur: '#E09F5A', desc: '쫑긋한 귀와 말린 꼬리가 매력적인 활기찬 파트너' },
  { id: 'retriever', name: '골든 리트리버', emoji: '🐶', defaultFur: '#EBC27C', desc: '부드러운 처진 귀와 다정한 성격의 골든 퍼피' },
  { id: 'cat', name: '치즈 고양이', emoji: '🐱', defaultFur: '#F2A65A', desc: '날렵한 귀와 우아한 긴 꼬리를 지닌 도도한 냥이' },
  { id: 'rabbit', name: '스노우 토끼', emoji: '🐰', defaultFur: '#F5F2EB', desc: '길쭉한 귀와 솜방울 꼬리의 깡총깡총 토끼' },
  { id: 'corgi', name: '웰시 코기', emoji: '🦊', defaultFur: '#D98245', desc: '짧고 통통한 다리와 큰 귀가 귀여운 숏다리 요정' }
];

export const FUR_COLORS = [
  { name: '허니 골드', hex: '#EBC27C' },
  { name: '시바 진저', hex: '#E09F5A' },
  { name: '초코 브라운', hex: '#7A4F35' },
  { name: '스노우 화이트', hex: '#F6F4EE' },
  { name: '실버 그레이', hex: '#A5B1C2' },
  { name: '차콜 블랙', hex: '#343A40' },
  { name: '파스텔 피치', hex: '#F5B5B0' }
];

export const EYE_COLORS = [
  { name: '다크 브라운', hex: '#1F1A17' },
  { name: '사파이어 블루', hex: '#2563EB' },
  { name: '에메랄드 그린', hex: '#10B981' },
  { name: '앰버 골드', hex: '#D97706' },
  { name: '바이올렛', hex: '#7C3AED' }
];

export interface FashionItemSpec {
  id: string;
  slot: 'outfit' | 'hat' | 'eyewear' | 'collar';
  value: string;
  name: string;
  emoji: string;
  price: number;
  desc: string;
}

export const FASHION_CATALOG: FashionItemSpec[] = [
  { id: 'outfit_none', slot: 'outfit', value: 'none', name: '기본 내추럴', emoji: '🐾', price: 0, desc: '자연스러운 털 그대로의 모습' },
  { id: 'outfit_neon_hoodie', slot: 'outfit', value: 'neon_hoodie', name: '스트릿 네온 후드', emoji: '🧥', price: 600, desc: '사이버 네온 라인이 빛나는 런웨이 스트릿 자켓' },
  { id: 'outfit_royal_hanbok', slot: 'outfit', value: 'royal_hanbok', name: '한복 퓨전 로열 망토', emoji: '👘', price: 850, desc: '전통 자수 골드 트리밍이 더해진 하이패션 퓨전 망토' },
  { id: 'outfit_tartan_dress', slot: 'outfit', value: 'tartan_dress', name: '타탄 체크 & 그린 리본', emoji: '🎀', price: 550, desc: '유기견 패션쇼 쇼룸 감성의 레드 타탄 원피스 & 새틴 리본' },
  { id: 'outfit_pink_tutu', slot: 'outfit', value: 'pink_tutu', name: '블러쉬 핑크 튜튜 드레스', emoji: '🌸', price: 650, desc: '파스텔 벚꽃 런웨이에서 빛나는 러플 튜튜 드레스' },
  { id: 'eyewear_sunglasses', slot: 'eyewear', value: 'sunglasses', name: '사이버 선글라스', emoji: '🕶️', price: 400, desc: '런웨이 플래시를 완벽 차단하는 미러 선글라스' },
  { id: 'hat_crown', slot: 'hat', value: 'crown', name: '황금 미니 왕관', emoji: '👑', price: 700, desc: '루비 보석이 세팅된 런웨이 메인 스타 왕관' },
  { id: 'collar_led', slot: 'collar', value: 'led_collar', name: 'LED 네온 목걸이', emoji: '💫', price: 350, desc: '어두운 밤과 런웨이에서 은은하게 발광하는 LED 링' }
];

export const ROOM_WALL_COLORS = [
  { name: '갤러리 화이트', hex: '#F3EFE8' },
  { name: '웜 테라코타', hex: '#E5C3AE' },
  { name: '세이지 민트', hex: '#DCE8DF' },
  { name: '미드나잇 슬레이트', hex: '#283044' },
  { name: '사이버 퍼플', hex: '#231942' }
];

export const ROOM_CUSHION_COLORS = [
  { name: '코랄 피치', hex: '#FF7A59' },
  { name: '포레스트 그린', hex: '#2D9D78' },
  { name: '로열 네이비', hex: '#3B5998' },
  { name: '라벤더 미스트', hex: '#8B7CF6' },
  { name: '크림 부클레', hex: '#E8DFD1' }
];

export const ROOM_FLOOR_OPTIONS: { id: FloorType; name: string; color: string }[] = [
  { id: 'oak', name: '내추럴 원목', color: '#C69B6D' },
  { id: 'marble', name: '화이트 대리석', color: '#E8ECEF' },
  { id: 'terrazzo', name: '모던 테라조', color: '#D4CFC7' }
];

export const ROOM_LIGHTING_OPTIONS: { id: LightingMood; name: string; emoji: string }[] = [
  { id: 'day', name: '주간 채광', emoji: '☀️' },
  { id: 'sunset', name: '골든 노을', emoji: '🌇' },
  { id: 'night', name: '야간 무드', emoji: '🌙' },
  { id: 'cyberpunk', name: '사이버 네온', emoji: '⚡' }
];

export const ROOM_LAYOUT_OPTIONS: { id: RoomLayoutPreset; name: string }[] = [
  { id: 'cozy', name: '코지 라운지' },
  { id: 'gallery', name: '갤러리 스튜디오' },
  { id: 'play', name: '오픈 플레이룸' }
];

export const AI_GUIDE_CATEGORIES: { id: AIToolGuideItem['category'] | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: '전체 파이프라인', emoji: '🧩' },
  { id: '3d_character', label: '3D 캐릭터·소품 AI', emoji: '🦊' },
  { id: '3d_space', label: '3D 공간·배경 AI', emoji: '🏛️' },
  { id: 'fashion_video', label: '패션쇼·영상화 AI', emoji: '🎬' },
  { id: 'brain_sound', label: 'AI 두뇌·사운드', emoji: '🧠' }
];

export const AI_PIPELINE_GUIDE: AIToolGuideItem[] = [
  // 1) 3D 캐릭터·소품 생성 AI
  {
    id: 'meshy',
    category: '3d_character',
    name: 'Meshy AI',
    pricing: '부분무료',
    stage: '1단계 · 텍스트/이미지 → PBR 3D(.glb) 모델링 & 자동 리깅',
    assetPath: 'public/models/my-pet.glb → 우측 [GLB 모델] 탭에서 즉시 교체',
    summary: '반려동물 사진이나 텍스트 프롬프트로 텍스처가 입혀진 고품질 3D 캐릭터·가구·액세서리를 1분 만에 생성합니다.',
    tip: 'Export 시 GLB(Binary) 포맷 + Auto-Rigging 옵션을 켜면 향후 Mixamo 애니메이션과도 바로 연동됩니다.',
    url: 'https://www.meshy.ai'
  },
  {
    id: 'triposr',
    category: '3d_character',
    name: 'TripoSR / Tripo3D',
    pricing: '무료',
    stage: '1단계 · 단일 이미지 → 초고속 3D 메쉬 복원',
    assetPath: 'public/models/props/*.glb → MyRoomWorld.tsx / ProceduralPet.tsx 연동',
    summary: 'Stability AI와 Tripo가 공개한 오픈소스 기반 초고속 3D 생성 모델로, 장난감·방석·펫 캐릭터를 수 초 만에 메쉬화합니다.',
    tip: '로컬 GPU 또는 HuggingFace Spaces에서 무료로 .glb를 추출해 바로 테스트할 수 있습니다.',
    url: 'https://www.tripo3d.ai'
  },
  {
    id: 'hunyuan3d',
    category: '3d_character',
    name: 'HunYuan3D 2.0',
    pricing: '무료',
    stage: '1단계 · 하이폴리 3D 지오메트리 & 고해상도 텍스처 생성',
    assetPath: 'public/models/pet-hunyuan.glb → CustomGLBPet 컴포넌트 로드',
    summary: '텐센트가 오픈소스로 공개한 차세대 3D 생성 AI로, 털 질감과 정교한 의상 디테일 표현력이 매우 뛰어납니다.',
    tip: 'ComfyUI-3D-Pack과 결합하면 의상 시안 이미지 생성부터 3D .glb 변환까지 원클릭 파이프라인 구축이 가능합니다.',
    url: 'https://3d.hunyuan.tencent.com'
  },

  // 2) 3D 개인 공간·배경 생성 AI
  {
    id: 'blockade',
    category: '3d_space',
    name: 'Blockade Labs (Skybox AI)',
    pricing: '부분무료',
    stage: '2단계 · 360° 파노라마 스카이박스 & 환경맵(HDRI) 제작',
    assetPath: 'public/skyboxes/park-360.jpg → <Environment files="..." background />',
    summary: '텍스트만으로 공원·해변·사이버펑크 도시 등 360도 3D 배경 스카이박스를 생성해 Three.js 씬의 몰입감을 극대화합니다.',
    tip: '생성한 Equirectangular 이미지를 drei의 <Environment>에 연결하면 3D 모델 반사광까지 실제 배경과 일치합니다.',
    url: 'https://skybox.blockadelabs.com'
  },
  {
    id: 'worldlabs',
    category: '3d_space',
    name: 'World Labs (Marble)',
    pricing: '부분무료',
    stage: '2단계 · 단일 이미지 → 탐색 가능한 3D 월드/가우시안 스플랫 생성',
    assetPath: 'public/worlds/myroom.splat → @react-three/drei <Splat /> 로더 연동',
    summary: '사진 한 장을 실제로 걸어 다닐 수 있는 입체 3D 공간(Gaussian Splatting / Mesh)으로 변환하는 차세대 공간 AI입니다.',
    tip: '내 실제 집 거실 사진을 3D 공간으로 변환해 마이룸 배경으로 쓰면 현실과 완벽히 이어지는 메타버스가 됩니다.',
    url: 'https://www.worldlabs.ai'
  },
  {
    id: 'spline',
    category: '3d_space',
    name: 'Spline AI',
    pricing: '부분무료',
    stage: '2단계 · 브라우저 기반 인터랙티브 3D 인테리어 & 조명 설계',
    assetPath: 'public/models/room-scene.glb 또는 @splinetool/react-spline 컴포넌트',
    summary: '코딩 없이 웹에서 3D 방 구조, 가구, 유리/네온 머티리얼을 AI 프롬프트로 생성하고 React로 바로 내보낼 수 있습니다.',
    tip: '런웨이 조명 트러스나 모던 갤러리 구조를 빠르게 프로토타이핑할 때 가장 생산성이 높습니다.',
    url: 'https://spline.design'
  },
  {
    id: 'promeai',
    category: '3d_space',
    name: 'PromeAI',
    pricing: '부분무료',
    stage: '2단계 · 인테리어 컨셉 렌더링 & 벽지/바닥 텍스처 시안 생성',
    assetPath: 'public/textures/wall-*.jpg, floor-*.jpg → MeshStandardMaterial map 적용',
    summary: '스케치나 공간 레이아웃을 북유럽 원목·럭셔리 대리석 등 실사 인테리어 렌더링과 심리스 텍스처로 변환합니다.',
    tip: '생성된 벽지·바닥 패턴을 Three.js useTexture()에 적용하면 절차적 룸의 사실감이 즉시 배가됩니다.',
    url: 'https://www.promeai.pro'
  },

  // 3) 패션쇼 의상 디자인·영상화 AI
  {
    id: 'flux_mj',
    category: 'fashion_video',
    name: 'Flux.1 / Midjourney / Google ImageFX',
    pricing: '부분무료',
    stage: '3단계 · 런웨이 펫/아바타 하이패션 의상 시안 & 룩북 제작',
    assetPath: 'public/textures/outfits/ → 3D 텍스처 매핑 또는 영상화 입력 이미지',
    summary: '네온 스트릿 후드, 한복 퓨전 망토 등 독창적인 펫 패션 컨셉 아트를 실사 스튜디오 퀄리티로 생성합니다.',
    tip: 'Google ImageFX와 Flux.1은 무료 크레딧/오픈웨이트로 시작하기 좋으며, 의상 정면·측면 시트를 뽑아 Meshy AI로 넘기면 3D 의상이 완성됩니다.',
    url: 'https://labs.google/fx/tools/image-fx'
  },
  {
    id: 'kling_runway',
    category: 'fashion_video',
    name: 'Kling AI / Runway Gen-3',
    pricing: '부분무료',
    stage: '3단계 · 룩북 이미지 → 유튜브 스타일 시네마틱 런웨이 워킹 영상화',
    assetPath: 'public/videos/runway-backdrop.mp4 → RunwayWorld 대형 LED 월 <videoTexture>',
    summary: '정지된 펫 패션쇼 이미지를 실제 카메라 플래시와 옷감 흔들림이 살아있는 1080p 시네마틱 워킹 영상으로 변환합니다.',
    tip: '본 앱의 [사진 촬영]으로 3D 런웨이 스틸컷을 캡처한 뒤 Kling AI에 넣으면 초고퀄리티 쇼츠 영상으로 바로 확장할 수 있습니다.',
    url: 'https://klingai.com'
  },
  {
    id: 'comfyui',
    category: 'fashion_video',
    name: 'ComfyUI (ControlNet + IP-Adapter)',
    pricing: '무료',
    stage: '3단계 · 캐릭터 외형·의상·모션 일관성 제어 자동화 파이프라인',
    assetPath: '워크플로우 출력 → public/models/ & public/videos/ 자동 배치',
    summary: '노드 기반 오픈소스 AI 엔진으로, 동일 반려동물 캐릭터가 여러 의상을 입어도 얼굴과 모션 일관성을 완벽히 유지합니다.',
    tip: 'OpenPose/Depth ControlNet을 연결하면 3D 씬의 포즈 그대로 실사 스타일 리렌더링이 가능합니다.',
    url: 'https://www.comfy.org'
  },

  // 4) AI 교감 두뇌 및 사운드 AI
  {
    id: 'llm_api',
    category: 'brain_sound',
    name: 'OpenAI / Gemini / Ollama LLM API',
    pricing: '부분무료',
    stage: '4단계 · 실시간 반려동물 페르소나 대화 & 감정·기억 엔진',
    assetPath: '좌측 패널 [LLM API 설정] 칸에 키 입력 → useMetaverseStore.ts 자동 연동',
    summary: '반려동물의 성격, 배고픔·친밀도 스탯, 이전 대화를 컨텍스트로 주입해 살아있는 생명체처럼 대답하는 AI 두뇌입니다.',
    tip: 'Google Gemini API 무료 티어나 로컬 Ollama를 연결하면 비용 부담 없이 실시간 펫 페르소나 대화를 구현할 수 있습니다.',
    url: 'https://ai.google.dev'
  },
  {
    id: 'suno',
    category: 'brain_sound',
    name: 'Suno AI',
    pricing: '부분무료',
    stage: '4단계 · 런웨이 EDM 비트 & 마이룸 로파이 힐링 BGM 생성',
    assetPath: 'public/audio/runway-bgm.mp3, myroom-lofi.mp3 → Web Audio API 재생',
    summary: '패션쇼 모드 전환 시 터지는 트렌디한 런웨이 일렉트로닉 BGM과 마이룸의 아늑한 어쿠스틱 배경음악을 즉석 작곡합니다.',
    tip: 'Instrumental 옵션을 켜고 "cyberpunk fashion runway beat, 124bpm" 프롬프트로 맞춤형 배경음을 만들어 보세요.',
    url: 'https://suno.com'
  }
];

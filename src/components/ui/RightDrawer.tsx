import React, { useState } from 'react';
import { Palette, Shirt, Sofa, Box, BookOpen, Upload, RotateCcw, Plus, RotateCw, Trash2, Hammer } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import {
  AVATAR_SHIRT_COLORS,
  BREED_CATALOG,
  EYE_COLORS,
  FASHION_CATALOG,
  FUR_COLORS,
  FURNITURE_CATALOG,
  ROOM_CUSHION_COLORS,
  ROOM_FLOOR_OPTIONS,
  ROOM_LIGHTING_OPTIONS,
  ROOM_WALL_COLORS
} from '../../data/catalog';

type DrawerTab = 'pet' | 'room' | 'fashion' | 'glb';

export const RightDrawer: React.FC = () => {
  const showRightDrawer = useMetaverseStore((s) => s.showRightDrawer);
  const player = useMetaverseStore((s) => s.player);
  const pet = useMetaverseStore((s) => s.pet);
  const room = useMetaverseStore((s) => s.room);
  const ownedFashionIds = useMetaverseStore((s) => s.ownedFashionIds);

  const updatePlayer = useMetaverseStore((s) => s.updatePlayer);
  const updatePet = useMetaverseStore((s) => s.updatePet);
  const selectBreed = useMetaverseStore((s) => s.selectBreed);
  const equipOrBuyFashion = useMetaverseStore((s) => s.equipOrBuyFashion);
  const updateRoom = useMetaverseStore((s) => s.updateRoom);
  const toggleDecorateMode = useMetaverseStore((s) => s.toggleDecorateMode);
  const addFurniture = useMetaverseStore((s) => s.addFurniture);
  const rotateSelectedFurniture = useMetaverseStore((s) => s.rotateSelectedFurniture);
  const recolorSelectedFurniture = useMetaverseStore((s) => s.recolorSelectedFurniture);
  const removeSelectedFurniture = useMetaverseStore((s) => s.removeSelectedFurniture);
  const setCustomGlbUrl = useMetaverseStore((s) => s.setCustomGlbUrl);
  const setShowGuideModal = useMetaverseStore((s) => s.setShowGuideModal);

  const [tab, setTab] = useState<DrawerTab>('room');
  const [glbPathInput, setGlbPathInput] = useState('./models/pet.glb');
  const [ai3dProvider, setAi3dProvider] = useState<'meshy' | 'tripo'>('meshy');
  const [ai3dApiKey, setAi3dApiKey] = useState('');
  const [ai3dPrompt, setAi3dPrompt] = useState('adorable golden shiba inu puppy dog, realistic fur, PBR');
  const [ai3dStatus, setAi3dStatus] = useState<string | null>(null);
  const [ai3dLoading, setAi3dLoading] = useState(false);

  const handleGenerate3DFromUI = async (target: 'avatar' | 'pet') => {
    if (!ai3dApiKey.trim()) {
      setAi3dStatus('⚠️ API 키를 입력하거나 터미널에서 .env 설정 후 npm run generate:3d를 실행하세요.');
      return;
    }
    setAi3dLoading(true);
    setAi3dStatus(`${ai3dProvider === 'meshy' ? 'Meshy AI' : 'Tripo3D'}에 3D 생성 요청 중...`);
    try {
      if (ai3dProvider === 'meshy') {
        const res = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
          method: 'POST',
          headers: { Authorization: `Bearer ${ai3dApiKey.trim()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'preview', prompt: ai3dPrompt, art_style: 'realistic' })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { result: taskId } = await res.json();
        setAi3dStatus(`✅ Meshy 작업 시작됨 (ID: ${taskId}). 완료 후 .glb를 자동 적용합니다...`);
        for (let i = 0; i < 36; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const poll = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
            headers: { Authorization: `Bearer ${ai3dApiKey.trim()}` }
          });
          const data = await poll.json();
          setAi3dStatus(`Meshy 생성 중: ${data.status} (${data.progress ?? 0}%)`);
          if (data.status === 'SUCCEEDED' && data.model_urls?.glb) {
            if (target === 'avatar') updatePlayer({ customGlbUrl: data.model_urls.glb });
            else setCustomGlbUrl(data.model_urls.glb);
            setAi3dStatus('🎉 Meshy AI 3D 모델 생성 및 씬 적용 완료!');
            return;
          }
          if (data.status === 'FAILED') throw new Error('생성에 실패했습니다.');
        }
      } else {
        const res = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
          method: 'POST',
          headers: { Authorization: `Bearer ${ai3dApiKey.trim()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'text_to_model', prompt: ai3dPrompt })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const created = await res.json();
        const taskId = created.data?.task_id;
        setAi3dStatus(`✅ Tripo3D 작업 시작됨 (ID: ${taskId})...`);
        for (let i = 0; i < 36; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const poll = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
            headers: { Authorization: `Bearer ${ai3dApiKey.trim()}` }
          });
          const polled = await poll.json();
          const modelUrl = polled.data?.output?.pbr_model || polled.data?.output?.model;
          setAi3dStatus(`Tripo3D 생성 중: ${polled.data?.status} (${polled.data?.progress ?? 0}%)`);
          if (polled.data?.status === 'success' && modelUrl) {
            if (target === 'avatar') updatePlayer({ customGlbUrl: modelUrl });
            else setCustomGlbUrl(modelUrl);
            setAi3dStatus('🎉 Tripo3D 모델 생성 및 씬 적용 완료!');
            return;
          }
          if (polled.data?.status === 'failed') throw new Error('생성에 실패했습니다.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAi3dStatus(`⚠️ 브라우저 직접 호출 제한(CORS/키 오류): ${msg}. 터미널에서 MESHY_API_KEY 설정 후 npm run generate:3d 실행을 권장합니다.`);
    } finally {
      setAi3dLoading(false);
    }
  };

  if (!showRightDrawer) return null;

  const selectedFurniture = room.furniture.find((f) => f.id === room.selectedFurnitureId) ?? null;

  const isFashionEquipped = (slot: string, value: string) => {
    if (slot === 'outfit') return pet.outfit === value;
    if (slot === 'hat') return pet.hat === value;
    if (slot === 'eyewear') return pet.eyewear === value;
    if (slot === 'collar') return pet.collar === value;
    return false;
  };

  const handleLocalGlbUpload = (target: 'avatar' | 'dog') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    if (target === 'avatar') {
      updatePlayer({ customGlbUrl: blobUrl });
    } else {
      setCustomGlbUrl(blobUrl);
    }
  };

  return (
    <aside className="fixed right-3 top-[76px] bottom-[92px] w-[325px] max-w-[calc(100vw-24px)] z-30 glass-panel rounded-2xl p-3.5 flex flex-col">
      {/* Drawer Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/10 mb-3">
        {[
          { id: 'room' as const, label: '공간꾸미기', icon: <Sofa className="w-3.5 h-3.5" /> },
          { id: 'pet' as const, label: '아바타·펫', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'fashion' as const, label: '패션', icon: <Shirt className="w-3.5 h-3.5" /> },
          { id: 'glb' as const, label: 'GLB', icon: <Box className="w-3.5 h-3.5" /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-1.5 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 transition ${
              tab === t.id
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-4">
        {tab === 'room' && (
          <>
            {/* 3D Build / Decorate Mode Toggle */}
            <button
              onClick={toggleDecorateMode}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow ${
                room.decorateMode
                  ? 'bg-rose-500 text-white'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>{room.decorateMode ? '🛠️ 꾸미기 모드 ON (바닥 클릭=이동)' : '🛠️ 3D 공간 꾸미기 모드 켜기'}</span>
            </button>

            {/* Selected 3D Furniture Controls */}
            {selectedFurniture && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-300">
                    선택됨: {selectedFurniture.name}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={rotateSelectedFurniture}
                      className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-[11px] font-bold flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" /> 회전
                    </button>
                    <button
                      onClick={removeSelectedFurniture}
                      className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> 삭제
                    </button>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-300">
                  3D 방 바닥의 원하는 곳을 클릭하면 선택한 가구가 즉시 이동합니다.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ROOM_CUSHION_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      title={c.name}
                      onClick={() => recolorSelectedFurniture(c.hex)}
                      className="w-6 h-6 rounded-full border-2 border-white/70"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add New 3D Furniture into Pet House */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                3D 가구 / 반려동물 아이템 추가 배치
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {FURNITURE_CATALOG.map((item) => (
                  <button
                    key={item.kind}
                    onClick={() => addFurniture(item.kind)}
                    className="p-2 rounded-xl text-left border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-rose-400 transition group"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                      <span>
                        {item.emoji} {item.name}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.interactionHint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Mood */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">조명 무드</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ROOM_LIGHTING_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateRoom({ lightingMood: m.id })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                      room.lightingMood === m.id
                        ? 'border-rose-500 bg-rose-500/15 text-rose-500'
                        : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {m.emoji} {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Wall & Floor Theme */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">벽지 컬러</label>
              <div className="flex flex-wrap gap-2">
                {ROOM_WALL_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => updateRoom({ wallColor: c.hex })}
                    className={`w-7 h-7 rounded-full border-2 ${
                      room.wallColor === c.hex ? 'border-rose-500 scale-110' : 'border-white/60'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">바닥재 질감</label>
              <div className="grid grid-cols-3 gap-1.5">
                {ROOM_FLOOR_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateRoom({ floorType: f.id })}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 ${
                      room.floorType === f.id
                        ? 'border-rose-500 bg-rose-500/15 text-rose-500'
                        : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full border border-black/20" style={{ backgroundColor: f.color }} />
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'pet' && (
          <>
            {/* My Player Avatar Customization */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2.5">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">👤 내 플레이어 아바타</div>
              <input
                type="text"
                maxLength={12}
                value={player.nickname}
                onChange={(e) => updatePlayer({ nickname: e.target.value })}
                placeholder="내 닉네임"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_SHIRT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => updatePlayer({ shirtColor: c.hex })}
                    className={`w-6 h-6 rounded-full border-2 ${
                      player.shirtColor === c.hex ? 'border-rose-500 scale-110' : 'border-white/60'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Companion Pet Customization */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">🐾 반려동물 이름</label>
              <input
                type="text"
                maxLength={12}
                value={pet.name}
                onChange={(e) => updatePet({ name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800/85 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">견종 / 묘종 스타일</label>
              <div className="grid grid-cols-2 gap-1.5">
                {BREED_CATALOG.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => selectBreed(b.id)}
                    className={`p-2 rounded-xl text-left border transition ${
                      pet.breed === b.id
                        ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-sm font-extrabold">
                      {b.emoji} {b.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">털 색상</label>
              <div className="flex flex-wrap gap-2">
                {FUR_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => updatePet({ furColor: c.hex })}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      pet.furColor === c.hex ? 'border-rose-500 scale-110' : 'border-white/60'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">눈동자 색상</label>
              <div className="flex flex-wrap gap-2">
                {EYE_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => updatePet({ eyeColor: c.hex })}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      pet.eyeColor === c.hex ? 'border-rose-500 scale-110' : 'border-white/60'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'fashion' && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              장착한 3D 의상은 펫 하우스·커뮤니티 광장·AI 패션쇼 런웨이에 즉시 반영됩니다.
            </p>
            {FASHION_CATALOG.map((item) => {
              const owned = ownedFashionIds.includes(item.id) || item.price === 0;
              const equipped = isFashionEquipped(item.slot, item.value);
              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition ${
                    equipped
                      ? 'border-rose-500 bg-rose-500/15'
                      : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {item.emoji} {item.name}
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => equipOrBuyFashion(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold shrink-0 transition ${
                        equipped ? 'bg-emerald-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
                      }`}
                    >
                      {equipped ? '장착 중' : owned ? '장착' : `${item.price} P`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'glb' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-[11px] text-indigo-800 dark:text-indigo-200 leading-relaxed">
              <code>public/models/avatar.glb</code>(1.65m)와 <code>public/models/pet.glb</code>(0.65m)가 자동 투입되어 <strong>Box3 자동 정규화 · 바닥 접지(y=0) · AnimationMixer 블렌딩</strong>으로 렌더링됩니다.
            </div>

            {/* Meshy AI / Tripo3D Live API Generator Panel */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">✨ Meshy AI / Tripo3D 직접 생성</div>
              <div className="grid grid-cols-2 gap-1">
                {(['meshy', 'tripo'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAi3dProvider(p)}
                    className={`py-1 rounded-lg text-[11px] font-bold ${
                      ai3dProvider === p
                        ? 'bg-indigo-500 text-white'
                        : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {p === 'meshy' ? 'Meshy AI' : 'Tripo3D'}
                  </button>
                ))}
              </div>
              <input
                type="password"
                value={ai3dApiKey}
                onChange={(e) => setAi3dApiKey(e.target.value)}
                placeholder={ai3dProvider === 'meshy' ? 'MESHY_API_KEY 입력' : 'TRIPO_API_KEY 입력'}
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 outline-none"
              />
              <input
                type="text"
                value={ai3dPrompt}
                onChange={(e) => setAi3dPrompt(e.target.value)}
                placeholder="생성할 3D 모델 영어 프롬프트"
                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white border border-black/10 dark:border-white/15 outline-none"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  disabled={ai3dLoading}
                  onClick={() => void handleGenerate3DFromUI('avatar')}
                  className="py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[11px] font-bold"
                >
                  👤 아바타 생성
                </button>
                <button
                  disabled={ai3dLoading}
                  onClick={() => void handleGenerate3DFromUI('pet')}
                  className="py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[11px] font-bold"
                >
                  🐶 펫 모델 생성
                </button>
              </div>
              {ai3dStatus && (
                <div className="text-[10.5px] leading-snug text-indigo-700 dark:text-indigo-200 bg-indigo-500/10 rounded-lg p-2">
                  {ai3dStatus}
                </div>
              )}
            </div>

            {/* Avatar GLB Slot */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                <span>👤 인간 아바타 (avatar.glb · 1.65m)</span>
              </div>
              <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-rose-400/70 bg-rose-500/5 hover:bg-rose-500/15 cursor-pointer text-[11px] font-bold text-rose-500">
                <Upload className="w-3.5 h-3.5" />
                <span>수동 avatar.glb 업로드</span>
                <input type="file" accept=".glb,.gltf" onChange={handleLocalGlbUpload('avatar')} className="hidden" />
              </label>
              <div className="flex items-center justify-between gap-1 text-[10.5px]">
                <span className="text-slate-500 font-bold">정면 회전 보정</span>
                <div className="flex gap-1">
                  {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rad, i) => (
                    <button
                      key={i}
                      onClick={() => updatePlayer({ glbFacingOffsetY: rad })}
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        Math.abs((player.glbFacingOffsetY ?? 0) - rad) < 0.05
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {i * 90}°
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pet GLB Slot */}
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                <span>🐶 반려동물 (pet.glb · 0.65m)</span>
              </div>
              <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-amber-400/70 bg-amber-500/5 hover:bg-amber-500/15 cursor-pointer text-[11px] font-bold text-amber-500">
                <Upload className="w-3.5 h-3.5" />
                <span>수동 pet.glb 업로드</span>
                <input type="file" accept=".glb,.gltf" onChange={handleLocalGlbUpload('dog')} className="hidden" />
              </label>
              <div className="flex items-center justify-between gap-1 text-[10.5px]">
                <span className="text-slate-500 font-bold">정면 회전 보정</span>
                <div className="flex gap-1">
                  {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rad, i) => (
                    <button
                      key={i}
                      onClick={() => updatePet({ glbFacingOffsetY: rad })}
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        Math.abs((pet.glbFacingOffsetY ?? 0) - rad) < 0.05
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {i * 90}°
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  updatePlayer({ customGlbUrl: './models/avatar.glb', glbFacingOffsetY: 0 });
                  setCustomGlbUrl('./models/pet.glb');
                }}
                className="py-2 rounded-xl bg-indigo-500 text-white text-[11px] font-bold"
              >
                📦 기본 GLB 적용
              </button>
              <button
                onClick={() => {
                  updatePlayer({ customGlbUrl: null });
                  setCustomGlbUrl(null);
                }}
                className="py-2 rounded-xl bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> 절차적 복원
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Shortcut to AI Pipeline Guide */}
      <button
        onClick={() => setShowGuideModal(true)}
        className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition"
      >
        <BookOpen className="w-4 h-4" />
        <span>AI 파이프라인 &amp; 제작 가이드 열기</span>
      </button>
    </aside>
  );
};

import React, { useState } from 'react';
import { Palette, Shirt, Sofa, Box, BookOpen, Upload, RotateCcw } from 'lucide-react';
import { useMetaverseStore } from '../../store/useMetaverseStore';
import {
  BREED_CATALOG,
  EYE_COLORS,
  FASHION_CATALOG,
  FUR_COLORS,
  ROOM_CUSHION_COLORS,
  ROOM_FLOOR_OPTIONS,
  ROOM_LAYOUT_OPTIONS,
  ROOM_LIGHTING_OPTIONS,
  ROOM_WALL_COLORS
} from '../../data/catalog';

type DrawerTab = 'pet' | 'fashion' | 'room' | 'glb';

export const RightDrawer: React.FC = () => {
  const showRightDrawer = useMetaverseStore((s) => s.showRightDrawer);
  const pet = useMetaverseStore((s) => s.pet);
  const room = useMetaverseStore((s) => s.room);
  const ownedFashionIds = useMetaverseStore((s) => s.ownedFashionIds);

  const updatePet = useMetaverseStore((s) => s.updatePet);
  const selectBreed = useMetaverseStore((s) => s.selectBreed);
  const equipOrBuyFashion = useMetaverseStore((s) => s.equipOrBuyFashion);
  const updateRoom = useMetaverseStore((s) => s.updateRoom);
  const setCustomGlbUrl = useMetaverseStore((s) => s.setCustomGlbUrl);
  const setShowGuideModal = useMetaverseStore((s) => s.setShowGuideModal);

  const [tab, setTab] = useState<DrawerTab>('pet');
  const [glbPathInput, setGlbPathInput] = useState('/models/my-pet.glb');

  if (!showRightDrawer) return null;

  const isFashionEquipped = (slot: string, value: string) => {
    if (slot === 'outfit') return pet.outfit === value;
    if (slot === 'hat') return pet.hat === value;
    if (slot === 'eyewear') return pet.eyewear === value;
    if (slot === 'collar') return pet.collar === value;
    return false;
  };

  const handleLocalGlbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setCustomGlbUrl(blobUrl);
  };

  return (
    <aside className="fixed right-3 top-[76px] bottom-[92px] w-[320px] max-w-[calc(100vw-24px)] z-20 glass-panel rounded-2xl p-3.5 flex flex-col">
      {/* Drawer Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/10 mb-3">
        {[
          { id: 'pet' as const, label: '외형', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'fashion' as const, label: '패션', icon: <Shirt className="w-3.5 h-3.5" /> },
          { id: 'room' as const, label: '마이룸', icon: <Sofa className="w-3.5 h-3.5" /> },
          { id: 'glb' as const, label: 'GLB', icon: <Box className="w-3.5 h-3.5" /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
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
        {tab === 'pet' && (
          <>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">반려동물 이름</label>
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
              장착한 3D 의상과 액세서리는 마이룸·산책 공원·AI 패션쇼 런웨이에 즉시 반영됩니다.
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
                        equipped
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 hover:bg-rose-600 text-white'
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

        {tab === 'room' && (
          <>
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

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">가구 배치 프리셋</label>
              <div className="grid grid-cols-3 gap-1">
                {ROOM_LAYOUT_OPTIONS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => updateRoom({ layoutPreset: l.id })}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                      room.layoutPreset === l.id
                        ? 'bg-rose-500 text-white'
                        : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

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

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">방석 / 캣타워 포인트 컬러</label>
              <div className="flex flex-wrap gap-2">
                {ROOM_CUSHION_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => updateRoom({ cushionColor: c.hex })}
                    className={`w-7 h-7 rounded-full border-2 ${
                      room.cushionColor === c.hex ? 'border-rose-500 scale-110' : 'border-white/60'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'glb' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-[11.5px] text-indigo-800 dark:text-indigo-200 leading-relaxed">
              <strong>Meshy AI / TripoSR / HunYuan3D</strong>에서 생성한 <code>.glb</code> 3D 모델을 즉시 불러와 기본 절차적 반려동물과 교체할 수 있습니다.
            </div>

            <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-rose-400/60 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer transition">
              <Upload className="w-5 h-5 text-rose-500" />
              <span className="text-xs font-extrabold text-slate-800 dark:text-white">로컬 .GLB 파일 바로 테스트</span>
              <span className="text-[10.5px] text-slate-500">클릭하여 .glb / .gltf 선택</span>
              <input type="file" accept=".glb,.gltf" onChange={handleLocalGlbUpload} className="hidden" />
            </label>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                또는 <code>public/models/</code> 경로 로드
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={glbPathInput}
                  onChange={(e) => setGlbPathInput(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs bg-white/80 dark:bg-slate-800 text-slate-900 dark:text-white border border-black/10 dark:border-white/15"
                />
                <button
                  onClick={() => setCustomGlbUrl(glbPathInput)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold"
                >
                  로드
                </button>
              </div>
            </div>

            {pet.customGlbUrl && (
              <button
                onClick={() => setCustomGlbUrl(null)}
                className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 기본 절차적 3D 펫으로 복원
              </button>
            )}
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

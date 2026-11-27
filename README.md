# 🐾 PawVerse 3D Studio — 올인원 3D 반려동물 메타버스 & AI 쇼케이스

외부 유료 에셋 없이 `npm install && npm run dev` 즉시 실행되는 **Three.js(@react-three/fiber, @react-three/drei, postprocessing) + React + TypeScript + Tailwind CSS + Zustand** 기반 올인원 3D 메타버스 웹 애플리케이션입니다.

## 빠른 실행

```bash
npm install
npm run dev
```

## 4대 3D 월드 & 핵심 기능

1. **🏠 월드 1: 마이룸 & 3D 인테리어 스튜디오**
   - 벽지, 원목/대리석/테라조 바닥, 낮/노을/야간/사이버펑크 네온 조명, 가구 배치 프리셋 실시간 변경
   - 바닥의 3D 장난감 공을 클릭하면 반려동물이 공을 쫓아가 물고 오는 자율 행동 애니메이션 실행
2. **🌳 월드 2: 가상 산책 공원 & 소셜 광장**
   - WASD/방향키 및 바닥 클릭 산책, 랜덤 생성 보물상자/간식(+150 P) 수집
   - 닉네임이 표시된 AI NPC 반려동물 3마리가 자율 산책하며, 가까이 다가가면 서로 마주 보고 꼬리를 흔들며 하트 파티클 교감
3. **✨ 월드 3: AI 패션쇼 런웨이**
   - 반사광 런웨이, 스포트라이트, 카메라 플래시 파티클, 관객석 실루엣
   - 스트릿 네온 후드 · 한복 퓨전 로열 망토 · 사이버 선글라스 · 황금 왕관 · LED 목걸이 실시간 장착
   - `[패션쇼 시작]` 시 워킹 → 무대 끝 360° 점프 포즈 → 자동 시네마틱 카메라 전환(정면 트래킹 / 로우 앵글 / 360° 회전)
4. **🤖 월드 4: AI 파이프라인 & 제작 가이드 허브 + `.glb` 교체**
   - Meshy AI, TripoSR, HunYuan3D, Blockade Labs, World Labs, Spline AI, PromeAI, Flux.1/Midjourney/ImageFX, Kling AI/Runway Gen-3, ComfyUI, LLM API, Suno AI 전체 워크플로우 카드
   - `public/models/` 또는 로컬 `.glb` 파일 업로드로 즉시 외부 AI 3D 모델 교체 가능

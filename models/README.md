# External AI 3D Model Drop-In Folder (`public/models/`)

이 폴더에 **Meshy AI**, **TripoSR**, **HunYuan3D** 등 외부 AI 3D 모델 생성 도구로 제작한 `.glb` 파일을 넣어두면, 앱 우측 커스터마이징 드로어의 `[GLB 모델]` 탭에서 즉시 불러와 기본 절차적(Procedural) 3D 반려동물을 교체할 수 있습니다.

## 빠른 사용 방법
1. AI 3D 생성 툴에서 모델을 `.glb` (glTF Binary) 형식으로 내보냅니다.
2. 이 폴더(`public/models/`)에 예: `my-pet.glb`로 저장합니다.
3. 앱 우측 패널 → `📦 모델 교체` 탭에서 경로 `/models/my-pet.glb`를 입력하거나, 로컬 `.glb` 파일을 드래그/업로드하여 바로 3D 씬에 적용합니다.

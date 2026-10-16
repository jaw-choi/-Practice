# SenseMate MVP (연습용)

웹캠 모션 인식과 음성 명령으로 동작하고, 사용자 행동 기록을 바탕으로 먼저 제안하는 노트북용 AI 비서입니다.
5일 MVP 연습 프로젝트입니다.

## 핵심 흐름

```
[브라우저] 웹캠 → MediaPipe (손동작, 가리키기) ─┐
[브라우저] 마이크 → Web Speech API (음성 → 텍스트) ─┤→ FastAPI → DB(events, todos) → 패턴 분석 → 추천
                                                └──── 대시보드가 결과를 다시 표시
```

영상과 음성 원본은 서버로 보내지 않습니다. 브라우저에서 인식한 **결과 이벤트(JSON)만** 전송합니다.

## 빠른 시작 (Windows)

Python 3.12 이상이 필요합니다.

```bat
setup.bat      :: .venv 생성, 패키지 설치, .env 생성 (최초 1회)
run.bat        :: 서버 실행
```

브라우저(Chrome 권장)에서 http://localhost:8000 을 엽니다. API 문서는 http://localhost:8000/docs 입니다.

수동으로 하려면:

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --app-dir backend
```

시연 데이터 넣기와 테스트:

```bat
python analytics\seed_demo_data.py   :: 지난 7일치 가짜 로그 → 추천이 뜸
python analytics\explore.py          :: Pandas로 로그 확인
pytest                               :: 백엔드 테스트
```

## 폴더 구조와 담당

| 경로 | 내용 | 담당 포지션 |
| --- | --- | --- |
| `frontend/js/voice.js` | 음성 인식(STT), 음성 출력(TTS) | 음성 인식 |
| `backend/app/services/command_parser.py` | 음성 명령 → 의도 변환 | 음성 인식 |
| `frontend/js/vision.js` | MediaPipe 손동작, 가리키기 인식 | 가리키기 모션 |
| `frontend/js/hands.js`, `js/pointer-demo.js`, `pointer.html` | 양손 관절 판정, 포인팅 선택 데모 | 가리키기 모션 |
| `frontend/js/wake-word.js` | 호출어 감지 후 명령 듣기 | 음성 인식 |
| `backend/app/services/patterns.py` | 반복 패턴 분석, 추천 규칙 | 데이터 엔지니어링 |
| `analytics/` | 시드 데이터, Pandas 분석 | 데이터 엔지니어링 |
| `frontend/index.html`, `style.css`, `js/dashboard.js`, `js/app.js` | 화면, 대시보드 | 프론트(대시보드) |
| `backend/app/main.py`, `api/`, `db.py`, `models.py`, `schemas.py` | API, DB | 백엔드 및 인프라 |
| (예정) `Dockerfile`, `compose.yaml`, `.github/workflows/` | 컨테이너, CI, AWS | 백엔드 및 인프라 |

## 포인팅 데모 (http://localhost:8000/pointer.html)

카메라 영상은 보여 주지 않고 손 관절만 인식해서 화면을 조작하는 예시입니다.

- 왼쪽 패널: 양손의 관절 모양과 현재 손 모양(가리키기, 집기, 손바닥, 주먹)이 실시간으로 표시됩니다.
- 검지만 펴서 가리키면 커서가 움직이고, 엄지와 검지를 붙이면(집기) 커서 위치의 카드를 선택합니다.
- 양손을 동시에 인식합니다. 왼손은 주황색, 오른손은 파란색 커서입니다.
- "자비스"라고 부르면 활성화되어 다음 명령을 듣습니다. "자비스 할 일 알려줘"처럼 한 번에 말해도 됩니다.
- 호출어, 커서 감도, 집기 판정 값은 `frontend/js/pointer-demo.js`와 `frontend/js/hands.js` 맨 위 상수에서 바꿉니다.

## 현재 동작하는 기능

- 손바닥(Open_Palm) → 음성 출력 정지, 브이(Victory) → 인사
- 검지 가리키기 → 방향(상하좌우)과 위치 인식, 화면에 빨간 점 표시
- 음성 또는 텍스트: "할 일 추가 우유 사기", "오늘 할 일 알려줘", "멈춰", "안녕"
- 작업 시작 버튼 → 기록 → 최근 7일 중 4일 이상 같은 시간이면 추천 표시
- 모든 행동이 `events` 테이블에 쌓이고 대시보드에 시간대별로 표시

## 문서

- [docs/지침서.md](docs/지침서.md): 팀 공통 개발 규칙 (먼저 읽기)
- [docs/event-schema.md](docs/event-schema.md): 이벤트 형식과 API 계약
- [docs/지시서/](docs/지시서/): 포지션별 5일 작업 지시서
- [docs/작업기록.md](docs/작업기록.md): 현재 진행 상황, 작업마다 무엇을 왜 했는지와 개선 방법
"# -Practice" 

# 이벤트 형식과 API 계약

모든 행동은 하나의 `events` 테이블에 쌓입니다. 이 형식이 포지션 간 계약입니다.

## 공통 형식

```json
{
  "event_type": "gesture_detected",
  "source": "vision",
  "payload": { "gesture": "Open_Palm", "confidence": 0.93 },
  "occurred_at": "2026-10-19T09:00:00+09:00"
}
```

- `event_type`: 아래 표에 있는 값만 허용 (그 외는 422 에러)
- `source`: `vision` | `voice` | `ui` | `system`
- `payload`: 이벤트별 자유 형식 객체
- `occurred_at`: 생략하면 서버 시간. 저장은 UTC

## 이벤트 종류

| event_type | source | payload | 보내는 곳 |
| --- | --- | --- | --- |
| `gesture_detected` | vision | `gesture`, `confidence` | vision.js |
| `pointing_detected` | vision | 대시보드: `direction`(up/down/left/right), `x`, `y` (0~1) / 포인팅 데모 선택: `action`("select"), `hand`(left/right), `target`, `x`, `y` | vision.js, pointer-demo.js |
| `presence_changed` | vision | `present`(true/false) | vision.js (예정) |
| `voice_command` | voice | `text`, `intent` | 백엔드 자동 기록 |
| `todo_created` | ui / voice | `todo_id`, `title` | 백엔드 자동 기록 |
| `todo_done` | ui | `todo_id` | 백엔드 자동 기록 |
| `task_started` | ui | 없음 | 작업 시작 버튼 |
| `recommendation_feedback` | ui | `accepted`(true/false), `message` | 대시보드 (예정) |

새 종류 추가 절차: 이 표에 추가 → `backend/app/schemas.py`의 `EventType`에 추가 → 같은 PR로 올리기.

## API 목록

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/health` | 서버 상태 |
| POST | `/events` | 이벤트 저장 |
| GET | `/events?limit=20&event_type=` | 최근 이벤트 조회 |
| GET | `/todos` | 할 일 목록 |
| POST | `/todos` | 할 일 추가 `{ "title": "..." }` |
| PATCH | `/todos/{id}` | 완료 처리 `{ "done": true }` |
| POST | `/assistant/command` | 음성 명령 처리 `{ "text": "..." }` → `{ intent, reply, action }` |
| GET | `/stats/hourly?event_type=` | 0~23시 이벤트 수 |
| GET | `/recommendations` | 현재 추천 목록 |

자세한 요청과 응답 형식은 서버 실행 후 http://localhost:8000/docs 에서 확인하고 직접 호출해 볼 수 있습니다.

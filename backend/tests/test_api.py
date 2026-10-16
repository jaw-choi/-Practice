from datetime import datetime, timedelta, timezone


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_event_roundtrip(client):
    body = {"event_type": "gesture_detected", "source": "vision",
            "payload": {"gesture": "Open_Palm", "confidence": 0.93}}
    assert client.post("/events", json=body).status_code == 201
    events = client.get("/events").json()
    assert events[0]["payload"]["gesture"] == "Open_Palm"


def test_unknown_event_type_rejected(client):
    body = {"event_type": "dance", "source": "vision"}
    assert client.post("/events", json=body).status_code == 422


def test_voice_add_and_list_todo(client):
    r = client.post("/assistant/command", json={"text": "할 일 추가 우유 사기"}).json()
    assert r["intent"] == "todo_add"
    r = client.post("/assistant/command", json={"text": "오늘 할 일 알려줘"}).json()
    assert r["intent"] == "todo_list" and "우유 사기" in r["reply"]
    types = [e["event_type"] for e in client.get("/events").json()]
    assert "todo_created" in types and "voice_command" in types


def test_stop_command(client):
    r = client.post("/assistant/command", json={"text": "멈춰"}).json()
    assert r["action"] == "stop"


def test_recommendation_after_routine(client):
    assert client.get("/recommendations").json() == []
    now = datetime.now(timezone.utc)
    for d in range(1, 6):  # 지난 5일 같은 시각
        t = (now - timedelta(days=d)).isoformat()
        client.post("/events", json={"event_type": "task_started", "source": "ui", "occurred_at": t})
    recs = client.get("/recommendations").json()
    assert len(recs) == 1


def test_frontend_served(client):
    r = client.get("/")
    assert r.status_code == 200 and "SenseMate" in r.text

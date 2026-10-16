from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Event


def record_event(
    db: Session,
    event_type: str,
    source: str,
    payload: dict | None = None,
    occurred_at: datetime | None = None,
) -> Event:
    """이벤트 저장의 단일 입구. 시간은 항상 UTC로 저장한다."""
    when = occurred_at or datetime.now(timezone.utc)
    if when.tzinfo is not None:
        when = when.astimezone(timezone.utc)
    event = Event(event_type=event_type, source=source, payload=payload or {}, occurred_at=when)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

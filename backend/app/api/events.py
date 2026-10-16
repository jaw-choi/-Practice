from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Event
from app.schemas import EventCreate, EventOut
from app.services.events import record_event

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventOut, status_code=201)
def create_event(body: EventCreate, db: Session = Depends(get_db)):
    return record_event(db, body.event_type, body.source, body.payload, body.occurred_at)


@router.get("", response_model=list[EventOut])
def list_events(limit: int = 20, event_type: str | None = None, db: Session = Depends(get_db)):
    query = select(Event).order_by(Event.id.desc()).limit(min(limit, 200))
    if event_type:
        query = query.where(Event.event_type == event_type)
    return db.scalars(query).all()

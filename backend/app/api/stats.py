from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Event
from app.schemas import HourlyCount, Recommendation
from app.services.patterns import find_routine_hour, hourly_counts

router = APIRouter(tags=["stats"])


@router.get("/stats/hourly", response_model=list[HourlyCount])
def get_hourly(event_type: str | None = None, db: Session = Depends(get_db)):
    query = select(Event.occurred_at)
    if event_type:
        query = query.where(Event.event_type == event_type)
    times = list(db.scalars(query))
    return [HourlyCount(hour=h, count=c) for h, c in hourly_counts(times)]


@router.get("/recommendations", response_model=list[Recommendation])
def get_recommendations(db: Session = Depends(get_db)):
    times = list(db.scalars(select(Event.occurred_at).where(Event.event_type == "task_started")))
    hour = find_routine_hour(times, now=datetime.now(timezone.utc))
    if hour is None:
        return []
    return [
        Recommendation(
            message=f"평소 {hour}시쯤 작업을 시작하셨어요. 오늘 계획을 열어볼까요?",
            reason=f"최근 7일 중 4일 이상 {hour}시에 task_started 기록",
        )
    ]

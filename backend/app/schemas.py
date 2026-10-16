from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# 이벤트 종류를 늘릴 때는 docs/event-schema.md 와 함께 PR로 합의한다
EventType = Literal[
    "gesture_detected",
    "pointing_detected",
    "presence_changed",
    "voice_command",
    "todo_created",
    "todo_done",
    "task_started",
    "recommendation_feedback",
]
Source = Literal["vision", "voice", "ui", "system"]


class EventCreate(BaseModel):
    event_type: EventType
    source: Source
    payload: dict = Field(default_factory=dict)
    occurred_at: datetime | None = None  # 비우면 서버 시간


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    event_type: str
    source: str
    payload: dict
    occurred_at: datetime


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TodoUpdate(BaseModel):
    done: bool


class TodoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    done: bool
    created_at: datetime


class CommandIn(BaseModel):
    text: str = Field(min_length=1)


class CommandOut(BaseModel):
    intent: str
    reply: str
    action: str | None = None  # 예: "stop" 이면 프론트가 음성 출력을 멈춘다


class HourlyCount(BaseModel):
    hour: int
    count: int


class Recommendation(BaseModel):
    message: str
    reason: str

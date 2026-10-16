from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.todos import add_todo
from app.db import get_db
from app.models import Todo
from app.schemas import CommandIn, CommandOut
from app.services.command_parser import parse_command
from app.services.events import record_event

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/command", response_model=CommandOut)
def run_command(body: CommandIn, db: Session = Depends(get_db)):
    parsed = parse_command(body.text)
    record_event(db, "voice_command", "voice", {"text": body.text, "intent": parsed.intent})

    if parsed.intent == "stop":
        return CommandOut(intent="stop", reply="", action="stop")
    if parsed.intent == "greet":
        return CommandOut(intent="greet", reply="안녕하세요. 오늘 할 일을 알려드릴까요?")
    if parsed.intent == "todo_add":
        todo = add_todo(db, parsed.title, source="voice")
        return CommandOut(intent="todo_add", reply=f"{todo.title}, 할 일에 추가했어요.")
    if parsed.intent == "todo_list":
        todos = db.scalars(select(Todo).where(Todo.done.is_(False)).order_by(Todo.id)).all()
        if not todos:
            return CommandOut(intent="todo_list", reply="남은 할 일이 없어요.")
        titles = ", ".join(t.title for t in todos)
        return CommandOut(intent="todo_list", reply=f"남은 할 일은 {len(todos)}개예요. {titles}")
    return CommandOut(intent="unknown", reply="잘 못 알아들었어요. 다시 말씀해 주세요.")

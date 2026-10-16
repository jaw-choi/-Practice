from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Todo
from app.schemas import TodoCreate, TodoOut, TodoUpdate
from app.services.events import record_event

router = APIRouter(prefix="/todos", tags=["todos"])


def add_todo(db: Session, title: str, source: str = "ui") -> Todo:
    todo = Todo(title=title, created_at=datetime.now(timezone.utc))
    db.add(todo)
    db.commit()
    db.refresh(todo)
    record_event(db, "todo_created", source, {"todo_id": todo.id, "title": title})
    return todo


@router.post("", response_model=TodoOut, status_code=201)
def create_todo(body: TodoCreate, db: Session = Depends(get_db)):
    return add_todo(db, body.title)


@router.get("", response_model=list[TodoOut])
def list_todos(db: Session = Depends(get_db)):
    return db.scalars(select(Todo).order_by(Todo.done, Todo.id)).all()


@router.patch("/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, body: TodoUpdate, db: Session = Depends(get_db)):
    todo = db.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(404, "할 일을 찾을 수 없습니다")
    todo.done = body.done
    db.commit()
    db.refresh(todo)
    if todo.done:
        record_event(db, "todo_done", "ui", {"todo_id": todo.id})
    return todo

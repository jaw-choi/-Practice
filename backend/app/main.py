from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import assistant, events, stats, todos
from app.db import Base, engine

# 연습용 MVP: 시작할 때 테이블 생성. 스키마가 자주 바뀌면 Alembic 도입을 검토한다.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SenseMate MVP")


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(events.router)
app.include_router(todos.router)
app.include_router(assistant.router)
app.include_router(stats.router)

# 프론트엔드 정적 파일 (같은 주소에서 제공하므로 CORS 설정이 필요 없다)
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

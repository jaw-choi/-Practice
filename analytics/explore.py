"""Pandas로 이벤트 로그 살펴보기. 프로젝트 루트에서 실행:  python analytics/explore.py"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.config import settings  # noqa: E402
from app.db import engine  # noqa: E402

df = pd.read_sql("SELECT * FROM events", engine, parse_dates=["occurred_at"])
if df.empty:
    print("이벤트가 없습니다. 먼저 seed_demo_data.py 를 실행하세요.")
    sys.exit()

df["occurred_at"] = pd.to_datetime(df["occurred_at"], utc=True).dt.tz_convert(settings.timezone)
df["hour"] = df["occurred_at"].dt.hour
df["date"] = df["occurred_at"].dt.date

print("이벤트 종류별 개수")
print(df["event_type"].value_counts(), "\n")
print("시간대별 이벤트 수")
print(df.groupby("hour").size(), "\n")
print("task_started 가 있었던 날짜 수 (시간대별)")
print(df[df["event_type"] == "task_started"].groupby("hour")["date"].nunique())

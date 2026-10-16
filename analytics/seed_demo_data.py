"""시연용 가짜 행동 로그 생성. 프로젝트 루트에서 실행:  python analytics/seed_demo_data.py

지난 7일 동안 매일 오전 9시 전후에 task_started 가 있도록 만들어 추천이 동작하게 한다.
"""

import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.config import settings  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.services.events import record_event  # noqa: E402

TZ = ZoneInfo(settings.timezone)


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    today = datetime.now(TZ).replace(hour=0, minute=0, second=0, microsecond=0)
    count = 0
    for d in range(1, 8):
        day = today - timedelta(days=d)
        start = day.replace(hour=9, minute=random.randint(0, 40))
        record_event(db, "task_started", "ui", {"seed": True}, start)
        for _ in range(random.randint(3, 8)):
            t = day.replace(hour=random.randint(9, 22), minute=random.randint(0, 59))
            gesture = random.choice(["Open_Palm", "Victory", "Thumb_Up"])
            record_event(db, "gesture_detected", "vision", {"gesture": gesture, "seed": True}, t)
        count += 1
    db.close()
    print(f"{count}일치 시연 데이터를 넣었습니다.")


if __name__ == "__main__":
    main()

"""행동 로그에서 반복 패턴을 찾는 규칙 기반 분석.

담당: 데이터 엔지니어링 포지션. 시간은 DB에 UTC로 저장되고 여기서 현지 시간으로 바꾼다.
"""

from collections import Counter
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.config import settings

LOCAL_TZ = ZoneInfo(settings.timezone)


def to_local(dt: datetime) -> datetime:
    if dt.tzinfo is None:  # SQLite는 시간대 정보를 버리므로 UTC로 간주
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(LOCAL_TZ)


def hourly_counts(times: list[datetime]) -> list[tuple[int, int]]:
    """0~23시 각각의 이벤트 수."""
    counter = Counter(to_local(t).hour for t in times)
    return [(h, counter.get(h, 0)) for h in range(24)]


def find_routine_hour(
    times: list[datetime], now: datetime, days: int = 7, min_days: int = 4
) -> int | None:
    """최근 days일 중 min_days일 이상 같은 시간대에 일어난 행동의 시간(현지 기준)."""
    since = now - timedelta(days=days)
    days_per_hour: dict[int, set] = {}
    for t in times:
        local = to_local(t)
        if local >= to_local(since):
            days_per_hour.setdefault(local.hour, set()).add(local.date())
    best = max(days_per_hour.items(), key=lambda kv: len(kv[1]), default=None)
    if best and len(best[1]) >= min_days:
        return best[0]
    return None

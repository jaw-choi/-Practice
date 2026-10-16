"""음성 명령 텍스트를 의도(intent)로 바꾸는 규칙 기반 파서.

담당: 음성 인식 포지션. 새 명령을 추가하면 tests/test_command_parser.py 에 예문도 추가한다.
"""

import re
from dataclasses import dataclass

STOP_WORDS = ("멈춰", "정지", "그만", "조용")
GREET_WORDS = ("안녕", "하이", "헬로")
ADD_PATTERN = re.compile(r"할\s*일\s*(?:추가|등록)(?:해\s*줘)?\s*[:,]?\s*(?P<title>.+)")
LIST_WORDS = ("알려", "뭐", "조회", "보여", "목록")


@dataclass
class ParsedCommand:
    intent: str  # stop | greet | todo_add | todo_list | unknown
    title: str | None = None


def parse_command(text: str) -> ParsedCommand:
    text = text.strip()
    compact = text.replace(" ", "")

    if any(w in compact for w in STOP_WORDS):
        return ParsedCommand("stop")

    match = ADD_PATTERN.search(text)
    if match:
        return ParsedCommand("todo_add", title=match.group("title").strip())

    if "할일" in compact and any(w in compact for w in LIST_WORDS):
        return ParsedCommand("todo_list")

    if any(w in compact for w in GREET_WORDS):
        return ParsedCommand("greet")

    return ParsedCommand("unknown")

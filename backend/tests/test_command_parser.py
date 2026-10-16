import pytest

from app.services.command_parser import parse_command


@pytest.mark.parametrize("text,intent,title", [
    ("멈춰", "stop", None),
    ("그만 말해", "stop", None),
    ("안녕", "greet", None),
    ("할 일 추가 우유 사기", "todo_add", "우유 사기"),
    ("할일 등록해줘 운동하기", "todo_add", "운동하기"),
    ("오늘 할 일 알려줘", "todo_list", None),
    ("할 일 뭐 있어", "todo_list", None),
    ("날씨 어때", "unknown", None),
])
def test_parse(text, intent, title):
    parsed = parse_command(text)
    assert parsed.intent == intent
    assert parsed.title == title

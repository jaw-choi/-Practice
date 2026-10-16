@echo off
chcp 65001 > nul
REM 프로젝트 루트에서 실행: venv 생성, 패키지 설치, .env 생성
python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if not exist .env copy .env.example .env
echo.
echo 설치 완료. 서버 실행: run.bat

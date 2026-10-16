@echo off
chcp 65001 > nul
call .venv\Scripts\activate.bat
uvicorn app.main:app --reload --app-dir backend

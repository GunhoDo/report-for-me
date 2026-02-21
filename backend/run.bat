@echo off
REM Backend 실행 스크립트 (uv 사용, Windows)

cd /d "%~dp0"

REM Redis 확인
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo Redis가 실행되지 않았습니다. Redis를 시작해주세요.
    echo Docker: docker run -d -p 6379:6379 redis:alpine
    pause
    exit /b 1
)

REM 의존성 동기화
echo 의존성 동기화 중 (uv sync)...
uv sync
if errorlevel 1 (
    echo uv sync 실패. uv가 설치되어 있는지 확인하세요.
    pause
    exit /b 1
)

REM FastAPI 서버 시작
echo FastAPI 서버 시작 중...
start "FastAPI Server" cmd /k "uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Celery Worker 시작 (Windows: --pool=solo 필수)
echo Celery Worker 시작 중...
start "Celery Worker" cmd /k "uv run celery -A celery_app worker --loglevel=info --pool=solo"

echo.
echo 서버가 시작되었습니다.
echo FastAPI: http://localhost:8000
pause

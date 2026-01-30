@echo off
REM Backend 실행 스크립트 (Windows)

REM 환경 변수는 .env.local에서 자동으로 로드됩니다

REM Redis 확인 (Windows)
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo Redis가 실행되지 않았습니다. Redis를 시작해주세요.
    pause
    exit /b 1
)

REM FastAPI 서버 시작
echo FastAPI 서버 시작 중...
start "FastAPI Server" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Celery Worker 시작
echo Celery Worker 시작 중...
start "Celery Worker" cmd /k "celery -A celery_app worker --loglevel=info"

echo 서버가 시작되었습니다.
echo FastAPI: http://localhost:8000
pause

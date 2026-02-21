#!/bin/bash
# Backend 실행 스크립트 (uv 사용)

set -e
cd "$(dirname "$0")"

# 환경 변수 로드 (프로젝트 루트 .env.local)
if [ -f ../.env.local ]; then
  export $(grep -v '^#' ../.env.local | xargs)
fi

# Redis 확인
if ! redis-cli ping > /dev/null 2>&1; then
  echo "Redis가 실행되지 않았습니다. Redis를 시작해주세요."
  echo "Docker: docker run -d -p 6379:6379 redis:alpine"
  exit 1
fi

# 의존성 동기화
echo "의존성 동기화 중 (uv sync)..."
uv sync

# FastAPI 서버 시작 (백그라운드)
echo "FastAPI 서버 시작 중..."
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!

# Celery Worker 시작 (백그라운드)
echo "Celery Worker 시작 중..."
uv run celery -A celery_app worker --loglevel=info &
CELERY_PID=$!

echo ""
echo "서버가 시작되었습니다."
echo "FastAPI: http://localhost:8000"
echo "FastAPI PID: $FASTAPI_PID"
echo "Celery PID: $CELERY_PID"
echo ""
echo "종료하려면: kill $FASTAPI_PID $CELERY_PID"

wait

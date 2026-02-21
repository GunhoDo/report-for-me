# Report-for-Me Backend

FastAPI + Celery + LangChain 기반 리포트 생성 백엔드 서버.

## 기술 스택

- **Framework**: FastAPI (Async I/O)
- **Task Queue**: Celery + Redis
- **LLM**: LangChain + Google Gemini API (OpenAI Fallback)
- **Database**: Supabase (PostgreSQL)
- **Crawler**: Tavily API

## 사전 요구사항

- [uv](https://docs.astral.sh/uv/) (Python 패키지 매니저)
- Redis
- Python 3.10+

### uv 설치

```bash
# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 설치

```bash
cd backend

# 의존성 동기화 (가상환경 생성 + 패키지 설치)
uv sync
```

## 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음 환경 변수를 설정하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key
SUPERBASE_PROJECT_ID=your_project_id

# LLM
LLM_PROVIDER=gemini  # "gemini" or "openai"
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # Fallback용

# Model Configuration
GEMINI_MODEL=gemini-1.5-pro
OPENAI_MODEL=gpt-4o
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000

# Backend API
BACKEND_API_URL=http://localhost:8000

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# External APIs
TAVILY_API_KEY=your_tavily_api_key  # Optional
```

## 실행

### 1. Redis 시작

```bash
# Docker로 실행 (권장)
docker run -d -p 6379:6379 redis:alpine

# 또는 로컬 Redis 설치 후
redis-server
```

### 2. FastAPI 서버 시작

```bash
cd backend

# 개발 모드
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 3. Celery Worker 시작

```bash
cd backend

# 개발 모드 (Linux/macOS)
uv run celery -A celery_app worker --loglevel=info

# Windows (--pool=solo 필수)
uv run celery -A celery_app worker --loglevel=info --pool=solo

# 프로덕션 모드
uv run celery -A celery_app worker --loglevel=info --concurrency=4
```

### 4. 한 번에 실행

```bash
cd backend

# Linux/macOS
./run.sh

# Windows
run.bat
```

## API 엔드포인트

### POST /api/reports/generate

리포트 생성 요청

**Request Body:**
```json
{
  "report_id": "uuid",
  "user_id": "uuid",
  "config": {
    "keywords": ["키워드1", "키워드2"],
    "viewpoint": "investor",
    "sources": [
      {
        "source_id": "uuid",
        "url": "https://example.com",
        "status": "valid"
      }
    ]
  }
}
```

**Response:**
```json
{
  "report_id": "uuid",
  "task_id": "celery-task-id",
  "status": "accepted"
}
```

### GET /api/reports/{report_id}/status

리포트 생성 상태 조회

## 프로젝트 구조

```
backend/
├── app/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 변수 설정
│   ├── routers/
│   │   └── reports.py       # 리포트 API 엔드포인트
│   ├── services/
│   │   ├── llm/
│   │   │   └── provider.py  # LLM 추상화 (Gemini/OpenAI)
│   │   ├── crawler.py       # Tavily 크롤러
│   │   └── report_generator.py  # Map-Reduce 리포트 생성
│   ├── models/
│   │   └── schemas.py       # Pydantic 스키마
│   ├── tasks/
│   │   └── report_tasks.py  # Celery Task 정의
│   └── utils/
│       ├── prompts.py       # 프롬프트 템플릿 로더
│       └── sanitize.py      # 입력 Sanitization
├── templates/
│   ├── map_base.txt         # Map Phase 프롬프트 템플릿
│   └── reduce_base.txt      # Reduce Phase 프롬프트 템플릿
├── celery_app.py            # Celery 앱 설정
├── pyproject.toml           # uv 의존성 정의
└── README.md
```

## 개발 가이드

### 의존성 추가

```bash
uv add <package-name>
```

### 개발 의존성 추가

```bash
uv add --dev pytest pytest-asyncio
```

### LLM Provider 변경

환경 변수 `LLM_PROVIDER`를 변경하면 됩니다:
- `gemini`: Google Gemini 사용 (기본값)
- `openai`: OpenAI GPT-4o 사용

## 문제 해결

### Redis 연결 오류

```bash
redis-cli ping  # 응답: PONG
```

### Celery Task가 실행되지 않음

1. Celery Worker가 실행 중인지 확인
2. Redis 연결 확인
3. Windows: `--pool=solo` 옵션 사용 확인
4. 로그 확인: `uv run celery -A celery_app worker --loglevel=debug`

### uv sync 실패

```bash
# uv 재설치 후
uv sync
```

## 라이선스

MIT

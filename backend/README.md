# Report-for-Me Backend

FastAPI + Celery + LangChain 기반 리포트 생성 백엔드 서버.

## 기술 스택

- **Framework**: FastAPI (Async I/O)
- **Task Queue**: Celery + Redis
- **LLM**: LangChain + Google Gemini API (OpenAI Fallback)
- **Database**: Supabase (PostgreSQL)
- **Crawler**: Tavily API

## 설치

```bash
# Python 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 설정하세요:

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
# 개발 모드
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프로덕션 모드
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 3. Celery Worker 시작

```bash
# 개발 모드
celery -A celery_app worker --loglevel=info

# 프로덕션 모드
celery -A celery_app worker --loglevel=info --concurrency=4
```

### 4. Celery Beat 시작 (스케줄러, 선택사항)

```bash
celery -A celery_app beat --loglevel=info
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

**Response:**
```json
{
  "report_id": "uuid",
  "status": "completed",
  "progress": {}
}
```

## 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py
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
├── requirements.txt         # Python 의존성
└── README.md
```

## 개발 가이드

### LLM Provider 변경

환경 변수 `LLM_PROVIDER`를 변경하면 됩니다:
- `gemini`: Google Gemini 사용 (기본값)
- `openai`: OpenAI GPT-4o 사용

### 프롬프트 템플릿 수정

`backend/templates/` 디렉토리의 템플릿 파일을 수정하거나,
`app/utils/prompts.py`의 `VIEWPOINT_MODIFIERS`를 수정하세요.

### 리포트 생성 프로세스

1. **Crawling**: Tavily API로 소스 URL 크롤링 (병렬)
2. **Map Phase**: 각 소스별 개별 분석 (Gemini/OpenAI)
3. **Reduce Phase**: 통합 분석 및 Executive Summary 생성
4. **Action Item**: 행동 제안 생성
5. **DB 저장**: Supabase에 결과 저장

## 문제 해결

### Redis 연결 오류

```bash
# Redis가 실행 중인지 확인
redis-cli ping  # 응답: PONG
```

### Celery Task가 실행되지 않음

1. Celery Worker가 실행 중인지 확인
2. Redis 연결 확인
3. 로그 확인: `celery -A celery_app worker --loglevel=debug`

### Gemini API 오류

1. `GOOGLE_GENERATIVE_AI_API_KEY` 환경 변수 확인
2. API 키 유효성 확인
3. Fallback으로 OpenAI 자동 전환됨

## 라이선스

MIT

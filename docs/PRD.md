# Product Requirement Document: User-Configured Automated Intelligence

## 1. Project Overview & Strategy

### 1.1 Problem Statement (Why)
정보의 홍수 속에서 전문직 및 투자자들은 매일 다수의 웹사이트를 방문하여 맥락을 파악하는 데 과도한 리소스를 투입하고 있습니다. 기존의 뉴스 요약 서비스는 사용자의 구체적인 **'관점(Viewpoint)'**을 반영하지 못하고, 단순한 텍스트 축약에 그쳐 실질적인 의사결정 보조 도구로 기능하지 못합니다.

### 1.2 Solution Strategy (What & How)
**"User-Configured Automated Intelligence"**
사용자가 복잡한 프롬프트 엔지니어링을 할 필요 없이, **설정 페이지(Configuration)**에서 관심사 키워드와 관점만 선택하면, 시스템이 이를 해석하여 **Dynamic Prompt**를 생성하고 리포트를 배달하는 SaaS입니다.

* **Abstraction:** 프롬프트의 복잡성을 UI 레벨에서 완벽히 추상화합니다.
* **Automation:** 스케줄러 기반의 RAG(Retrieval-Augmented Generation) 파이프라인을 구축합니다.

### 1.3 Value Proposition
> "설정은 1분, 리포트는 매일 아침. 나만의 관점으로 분석된 3줄의 결론."

---

## 2. User Persona

* **Primary Target:** 3040 전문 투자자, 시니어 개발자, 전략 기획자.
* **Key Pain Point:**
    * "ChatGPT에 매번 URL 붙여넣고 시키기 귀찮다."
    * "내가 찜한 사이트 3곳을 내가 원하는 관점(예: 리스크 체크)으로만 딱 보고 싶다."
* **Needs:**
    * **Zero Prompting:** "AI에게 명령하는 법을 배우고 싶지 않음."
    * **Reliability:** "링크가 죽었으면 죽었다고 알려주고, 나머지라도 분석해줘."

---

## 3. User Flow (Technical Workflow)

### 3.1 Report-Centric Data Model (핵심)
* **Report:** 사용자가 생성하는 단위. 하나의 연구/분석 프로젝트.
* **Per Report:** 최대 3개의 소스 슬롯 (Source A, B, C)
  * 각 슬롯: URL, Keywords, Viewpoint (소스별로 독립 설정)
  * 각 슬롯별 개별 페치 및 분석
* **Integrated Synthesis (통합 제언):** 3개 소스 분석 결과를 Map-Reduce하여 도출하는 최종 인사이트.
  * **사용 조건:** 3개 소스를 **모두** 등록·설정해야만 "Generate Integrated Perspective" 버튼이 활성화되고 실행 가능.
  * 1~2개만 설정된 경우 통합 제언 기능은 비활성화.
* **History:** 사용자는 여러 리포트를 보유하며, 사이드바에서 선택하여 조회.

### Phase 1: Configuration (User Action)
1.  **Report Creation:** 사용자가 새 리포트 생성 (또는 기존 리포트 선택).
2.  **Per-Source Configuration:** 각 리포트당 최대 3개의 소스 슬롯 (Source A, B, C).
    * 각 슬롯: URL 입력 (Valid Check 필수), Keywords, Viewpoint (소스별로 개별 설정).
3.  **Save:** 설정값을 해당 리포트에 연결하여 저장.
    * *Note: 이때 프롬프트는 생성되지 않음, 설정값만 저장. 리포트 단위로 설정이 관리됨.*

### Phase 2: Execution Pipeline (System Action)
1.  **Trigger:** 사용자가 "Generate Integrated Perspective" 클릭 시, 또는 `Celery Beat`가 리포트별 스케줄에 따라 Task 발행.
    * *전제:* 3개 소스가 모두 등록·설정된 상태여야 실행 가능.
2.  **Robust Crawling (Parallel):** 3개 URL에 대해 동시 접속 (Async).
    * **Fail-Safe:** 3개 중 1개 실패 시, 해당 URL은 `Status: Failed` 마킹 후 프로세스 계속 진행.
3.  **Dynamic Prompt Assembly (Backend):**
    * 각 소스별 설정값(Keyword, Viewpoint)을 불러와 Template에 주입.
    * `SystemPrompt = f"Analyze based on {Viewpoint}, focusing on {Keywords}..."`
4.  **Map-Reduce Analysis:**
    * **(Map)** 각 URL별로 해당 소스의 Keywords/Viewpoint로 개별 분석 수행.
    * **(Reduce)** 3개 개별 분석 결과를 종합하여 '통합 제언(Integrated Synthesis)' 생성.

### Phase 3: Delivery & Interaction (UX)
1.  **Progress Feedback (Real-time):** 사용자가 대시보드 접속 시, 처리 상태를 단계별로 노출 (WebSocket or Polling).
    * *UX Msg:* "소스 데이터 수집 중..." → "개별 기사 분석 중..." → "최종 인사이트 도출 중..."
2.  **Report View:** 최종 리포트 렌더링.
3.  **Feedback Loop:** 사용자가 리포트에 댓글/평가 남김 → Vector DB에 Preference 저장 → 다음 리포트 생성 시 반영.

---

## 4. Key Features & Functional Specs

### F1. Config-Driven Prompt Engine (Core)
* **Description:** 사용자의 UI 조작(클릭, 선택)을 LLM 명령어로 변환하는 로직.
* **Requirements:**
    * **리포트 단위 설정:** 각 리포트는 최대 3개의 소스 구성을 가짐.
    * **소스별 설정:** 각 소스 슬롯은 URL, Keywords, Viewpoint를 독립적으로 가짐.
    * 관점(Viewpoint) 선택에 따른 System Prompt 템플릿이 백엔드에 하드코딩 되어 있어야 함.
    * 유저 입력 키워드(User Input)는 반드시 **Sanitization** 후 프롬프트에 주입 (Prompt Injection 방지).

### F2. Robust Multi-Source Collector
* **Description:** 다양한 웹 환경(SPA, Anti-Scraping)에 대응하는 수집기.
* **Requirements:**
    * **Tavily API** 또는 **Exa.ai** 활용 권장 (일반 크롤러 대비 성공률 및 정제 능력 우수).
    * **Circuit Breaker:** 특정 도메인 응답 지연 시(Timeout 10s), 전체 프로세스를 멈추지 않고 해당 소스만 Skip.

### F3. Structured Report Generator (Output Control)
* **Description:** LLM의 출력을 강제로 구조화.
* **Format Specs:**
    * **Executive Summary:** 3줄 이내 (Bullet points). *(Strict Constraint)*
    * **Source-wise Analysis:** 각 URL별 분석 (인용 출처 명시 필수).
    * **Action Item:** 사용자 관점에 따른 추천 행동.
* **Integrated Synthesis (통합 제언):**
    * 3개 소스 분석 결과를 Map-Reduce하여 최종 인사이트 도출.
    * **사용 조건:** 3개 소스를 모두 등록·설정한 경우에만 실행 가능. 1~2개만 설정 시 UI에서 비활성화.

### F4. Asynchronous UX & Notification
* **Description:** 긴 대기 시간(30~60초)을 사용자 경험으로 승화.
* **Requirements:**
    * Skeleton UI 및 단계별 텍스트 애니메이션 ("Analyzing financial data..." 등).
    * 백그라운드 완료 시 Email 또는 Push 알림 발송.

---

## 5. Technical Architecture (Recommended)
안정적인 상용화(Commercialization)를 위해 최신 Python 생태계와 검증된 SaaS 스택을 제안합니다.

### 5.1 Frontend
* **Framework:** React (Vite) + TypeScript.
* **UI Library:** Shadcn UI (전문적인 대시보드 룩앤필), Framer Motion (로딩 애니메이션).
* **State Management:** TanStack Query (Server State 관리 및 Polling 용이).

### 5.2 Backend
* **API Server:** Python FastAPI (Async I/O 처리에 최적화).
* **Task Queue:** Celery + Redis (장시간 소요되는 리포트 생성 작업을 비동기 처리).
* **Scheduler:** Celery Beat (유저별 Cron Job 관리).

### 5.3 AI & Data Pipeline
* **LLM Orchestration:** LangChain (Map-Reduce Chain 구현).
* **Model:** OpenAI GPT-4o (복합 추론 및 한국어 처리 우수).
* **Web Browsing Tool:** Tavily API (LLM 전용 검색/콘텐츠 추출).
* **Observability:** LangSmith (프롬프트 디버깅 및 비용 모니터링).

### 5.4 Database
* **PostgreSQL (RDB):**
  * **reports:** 리포트 메타데이터, 상태, 생성일.
  * **report_sources / report_sections:** 리포트별 소스 구성 (report_id, slot_index, url, keywords, viewpoint, 분석 결과).
  * **config_snapshot:** 리포트 생성 시점의 설정 스냅샷 (과거 이력 보존).
  * *Note: "사용자당 1개 설정"이 아닌 "리포트당 1개 설정(3소스 구성)"으로 관리.*
* **Pinecone (Vector DB):** 사용자 피드백 및 선호도 벡터 저장 (Long-term Memory).

---

## 6. Success Metrics (KPIs)

* **Report Activation Rate:** 가입 유저 중 '첫 번째 리포트'를 생성 완료한 비율 (최소 3개 소스 설정 + Generate 실행). (목표: 60% 이상)
* **D+30 Retention:** 한 달 뒤에도 설정된 리포트를 열람하는지 여부.
* **Pipeline Stability:** 리포트 생성 성공률 (Partial Failure 포함 99.9% 목표).
* **Avg. Latency:** 리포트 요청부터 완료까지 걸리는 시간 (Target: < 45s).

---

## 7. Operational Constraints & Rules

* **Prompt Abstraction:** 엔드 유저는 절대 'System Prompt'라는 단어나 날것의 프롬프트 텍스트를 보지 못하게 합니다. 모든 것은 '설정', '관점', '키워드'로 표현됩니다.
* **Integrated Synthesis Gate:** 통합 제언(Integrated Synthesis) 실행은 3개 소스가 모두 등록·설정된 경우에만 허용. 1~2개만 설정 시 UI에서 "Generate Integrated Perspective" 버튼 비활성화.
* **Graceful Degradation:**
    * 수집 실패 시: "수집 실패"라고 명시하고 해당 섹션은 비워두되, 전체 리포트는 발행되어야 합니다.
    * API 에러 시: 재시도(Retry) 로직은 최대 3회로 제한합니다 (Exponential Backoff).
* **Output Guardrail:** 최종 요약(통합 제언)이 3줄을 초과할 경우, 로직 단에서 컷하거나 다시 요약을 요청하는 **Self-Correction Loop**를 포함해야 합니다.
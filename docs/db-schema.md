# 데이터베이스 설계 가이드 (DB Schema)

> PRD의 데이터 모델링을 바탕으로 한 PostgreSQL 테이블 구조 및 RLS(행 수준 보안) 정책 요약.  
> Supabase(PostgreSQL) 기준이다.

---

## 1. 개요

- **RDB**: 사용자, 설정(Config), 소스 URL, 리포트·섹션·피드백 저장.
- **인증**: Supabase Auth `auth.users` 사용. 애플리케이션 프로필은 `public.profiles`와 1:1.
- **RLS**: 모든 사용자 데이터는 `auth.uid()` 기준 “본인만 접근”으로 통일해, 확장 시 정책만 추가할 수 있게 설계.

---

## 2. ER 개념

```
auth.users (Supabase 관리)
    │
    └── profiles (1:1)
            │
            ├── user_configs (1:1) … Agent 설정(키워드, 관점, 시간대 등)
            │
            ├── sources (1:N) … 모니터링 URL per user
            │
            └── reports (1:N) … 실행 시점·상태·메타
                    │
                    ├── report_sections (1:N) … URL별 분석(Source-wise)
                    └── report_feedbacks (1:N) … 댓글/평가 → Vector DB 연동 전 중간 저장
```

---

## 3. 테이블 정의

### 3.1 `profiles`

Auth와 1:1. 타임존·알림 등 확장용.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, FK→auth.users(id) | Auth UID |
| email | text | | 이메일 (동기화용) |
| display_name | text | | 표시 이름 |
| timezone | text | default 'Asia/Seoul' | 스케줄·알림용 (PRD Phase 2) |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

---

### 3.2 `user_configs`

PRD Phase 1 “설정값 DB 저장 (UserConfig)”. 프롬프트는 저장하지 않고, 키워드·관점만 저장.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK→profiles(id), UNIQUE | 1 user 1 config |
| keywords | text[] | | 관심 키워드 배열 |
| viewpoint | text | | 관점 키 (예: critical, investor, beginner, fact) |
| schedule_cron | text | | Cron 식 (Celery Beat 연동 시) |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

---

### 3.3 `sources`

모니터링할 URL per user. Valid Check 결과 보관.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK→profiles(id) | 소유자 |
| url | text | NOT NULL | 모니터링 URL |
| status | text | default 'pending' | pending \| valid \| failed |
| last_checked_at | timestamptz | | 마지막 검증 시각 |
| created_at | timestamptz | default now() | |
| updated_at | timestamptz | default now() | |

- (user_id, url) UNIQUE 권장.

---

### 3.4 `reports`

리포트 단위. 실행 시점·상태·요약.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| user_id | uuid | FK→profiles(id) | 소유자 |
| status | text | NOT NULL | pending \| collecting \| analyzing \| synthesizing \| completed \| partial \| failed |
| executive_summary | jsonb | | PRD F3 3줄 요약 (bullets 배열) |
| action_item | jsonb | | 추천 행동 |
| started_at | timestamptz | | 실행 시작 |
| completed_at | timestamptz | | 완료 시각 (목표 &lt; 45s, PRD) |
| created_at | timestamptz | default now() | |

- `status`로 Phase 3 진행 피드백(“수집 중…” 등) 매핑.

---

### 3.5 `report_sections`

URL별 분석. PRD F3 “Source-wise Analysis, 인용 출처 명시”.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| report_id | uuid | FK→reports(id) ON DELETE CASCADE | |
| source_id | uuid | FK→sources(id) | |
| content | text | | 해당 URL 분석 내용 |
| citation | text | | 인용/출처 |
| sort_order | int | default 0 | 표시 순서 |
| created_at | timestamptz | default now() | |

---

### 3.6 `report_feedbacks`

Phase 3 Feedback Loop. 댓글/평가 → Vector DB(Long-term Memory) 반영 전 저장.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | |
| report_id | uuid | FK→reports(id) ON DELETE CASCADE | |
| user_id | uuid | FK→profiles(id) | 작성자 |
| comment | text | | 자유 텍스트 |
| rating | int | CHECK (rating BETWEEN 1 AND 5) | 1~5 점수 |
| created_at | timestamptz | default now() | |

---

## 4. RLS(행 수준 보안) 요약

원칙: **모든 테이블**에서 `auth.uid()`와 소유자 컬럼만 비교. 팀/공유 기능은 나중에 정책 확장으로 대응.

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | id = auth.uid() | id = auth.uid() | id = auth.uid() | (보통 비허용) |
| user_configs | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() |
| sources | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() |
| reports | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() |
| report_sections | report.user_id = auth.uid() (JOIN) | report.user_id = auth.uid() | 동일 | 동일 |
| report_feedbacks | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() | user_id = auth.uid() |

- `report_sections`는 `reports`와 JOIN한 뒤 `reports.user_id = auth.uid()`로 판단.
- Supabase에서는 각 테이블에 대해 `ENABLE ROW LEVEL SECURITY` 후 위 조건으로 정책 생성.

---

## 5. 인덱스 권장

- `sources(user_id)`, `sources(user_id, url)` (UNIQUE 사용 시)
- `reports(user_id)`, `reports(user_id, created_at DESC)`
- `report_sections(report_id)`
- `report_feedbacks(report_id)`, `report_feedbacks(user_id)`

---

## 6. 타입 연동

- `types/database.ts`: 위 테이블의 Row/Insert/Update에 맞춰 타입 정의.
- `supabase gen types typescript --project-id <id>`로 생성한 타입을 병합해 사용하는 것을 권장.

---

*작성 기준: PRD Phase 1~3, FLOW, Supabase(PostgreSQL).*

# 기술 명세서 (Tech Stack)

> PRD·FLOW를 반영한 컴포넌트 설계 원칙 및 사용 라이브러리 정의.  
> 유지보수성·확장성·코드 중복 최소화를 우선한다.

---

## 1. 스택 요약

| 영역 | 선택 | 비고 |
|------|------|------|
| Framework | Next.js 15+ (App Router) | React 19, Server Components 기본 |
| Language | TypeScript | strict 모드 |
| Styling | Tailwind CSS | utility-first |
| UI 컴포넌트 | shadcn/ui | Headless + Radix 기반 |
| 아이콘 | Lucide React | 경량, tree-shaking |
| 서버 상태·폴링 | TanStack Query (React Query) | PRD Phase 3 진행 상태 폴링 |
| 애니메이션·로딩 | Framer Motion | PRD F4 Skeleton·단계별 메시지 |
| BaaS / DB | Supabase | Auth, PostgreSQL, Realtime |

---

## 2. 주요 라이브러리

### 2.1 UI·스타일

- **Tailwind CSS**  
  - 유틸리티 클래스, 디자인 토큰(색, 간격, 타입) 일원화.  
  - `lib/utils/cn.ts`로 `clsx` + `tailwind-merge` 사용 (className 병합).

- **shadcn/ui**  
  - 복사 가능한 컴포넌트 방식. `components/ui/`에 두고 프로젝트에 맞게 수정.  
  - 도메인 로직은 넣지 않고, Props 기반으로만 동작.

- **Lucide React**  
  - 아이콘은 `lucide-react`에서만 import. 네이밍은 `PascalCase` (예: `ChevronRight`).

### 2.2 데이터·인증

- **Supabase**  
  - `@supabase/supabase-js`, `@supabase/ssr` 사용.  
  - 브라우저: `lib/supabase/client.ts`  
  - 서버(Server Components, Route Handlers): `lib/supabase/server.ts`  
  - env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **TanStack Query**  
  - 리포트 조회·폴링(`use-report.ts`, `use-report-progress.ts`), 설정 CRUD(`use-config.ts`).  
  - 서버 상태는 훅·Query 전용, 전역 클라이언트 상태는 최소화.

### 2.3 애니메이션·UX (PRD F4)

- **Framer Motion**  
  - 로딩 스켈레톤, 단계별 메시지(“소스 수집 중…” → “분석 중…” → “도출 중…”).  
  - `components/domain/report/report-progress.tsx` 등에서 사용.

---

## 3. 컴포넌트 설계 원칙

### 3.1 디렉터리 역할

| 디렉터리 | 역할 | 도메인 의존성 | 비고 |
|----------|------|----------------|------|
| `components/ui/` | 버튼, 카드, 인풋, 스켈레톤 등 공통 UI | 없음 | shadcn 스타일, Props만 사용 |
| `components/domain/` | 기능 단위 컴포넌트 | 있음 | auth, config, report, source, layout |

- **ui**: 어디서든 재사용 가능해야 함. 비즈니스 로직·API 호출 없음.  
- **domain**: 한 도메인 안에서만 의미가 있음. 필요한 훅·타입은 같은 도메인 또는 `hooks/`, `types/`에서 가져옴.

### 3.2 PRD·FLOW 반영 매핑

| PRD/FLOW | 컴포넌트 위치 | 설명 |
|----------|----------------|------|
| Phase 1 설정 (URL/Keyword/Viewpoint) | `domain/config/` | config-modal, source-url-input, keyword-input, viewpoint-select |
| Phase 3 Report View | `domain/report/` | report-view(Executive Summary·Source별·Action Item), report-feedback |
| Phase 3 진행 피드백 | `domain/report/report-progress.tsx` | 단계별 메시지·스켈레톤 |
| FLOW Source A/B/C 카드 | `domain/source/source-card.tsx` | 카드 클릭 시 Config 모달 연동 |
| FLOW Sidebar | `domain/layout/sidebar.tsx` | History / Profile 링크 |
| FLOW 메인 영역 | `domain/layout/dashboard-shell.tsx` | 레이아웃 래퍼 |

### 3.3 규칙 요약

1. **페이지는 얇게**  
   - `app/**/page.tsx`는 라우팅·레이아웃·데이터 로딩 위주. 실제 UI는 `components/domain/*`에서 조합.

2. **도메인별 응집**  
   - config 관련은 `domain/config/` 안에서 import. report 관련은 `domain/report/` 안에서.

3. **중복 최소화**  
   - 공통 형태가 두 번 나오면 `components/ui/` 또는 `lib/utils/`로 추출.  
   - 설정·리포트 등 타입은 `types/`에 한 번만 정의.

4. **프롬프트 비노출 (PRD 운영 규칙)**  
   - “System Prompt”, “프롬프트” 노출 금지. UI에는 “설정”, “관점”, “키워드”만 사용.

---

## 4. 폴더 구조 요약

```
app/                 # 라우트 (페이지 단위)
  (auth)/            # 로그인·가입
  dashboard/         # /dashboard, 설정, 히스토리, 리포트 상세
components/
  ui/                # 공통 UI (도메인 무관)
  domain/            # auth, config, report, source, layout
lib/                 # Supabase 클라이언트, utils, 상수
hooks/               # use-report, use-config, use-auth, use-report-progress
types/               # database, api, report
docs/                # tech-stack.md, db-schema.md
```

---

## 5. 권장 설치 명령

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# UI·스타일 (shadcn 사용 시)
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# 서버 상태·폴링
pnpm add @tanstack/react-query

# 애니메이션 (PRD F4)
pnpm add framer-motion
```

---

*작성 기준: PRD, FLOW, Next.js 15 App Router, Supabase.*

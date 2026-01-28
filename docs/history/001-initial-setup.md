---
date: 2026-01-28
title: Initial setup (Next.js App Router + Shadcn UI 기반)
---

## 날짜

- 2026-01-28

## 변경 내용

- **프로젝트 부트스트랩**
  - Next.js(App Router) + TypeScript(strict) 기반으로 초기 프로젝트 구성
  - 패키지 매니저: `pnpm`
  - 스크립트: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`
- **UI/스타일링 기본 세팅**
  - Tailwind CSS 기반 스타일 구성
  - shadcn/ui 패턴에 맞춘 공통 UI 컴포넌트 구성(`components/ui/*`)
  - Radix UI 기반 컴포넌트 포함 (Dialog/Select/Tabs/Toast 등)
  - 다크모드/테마 대응을 위한 `next-themes` 사용
- **라우팅/화면 골격**
  - 라우팅 그룹 기반 구조
    - `app/(auth)`: 로그인/가입
    - `app/(dashboard)`: 대시보드(`/app`) 및 하위 화면(history/settings/reports)
  - 랜딩 페이지는 `app/page.tsx` 중심으로 구성
- **도메인 컴포넌트/훅 구조**
  - 도메인 컴포넌트: `components/domain/*` (auth/config/report/source/layout)
  - 공통 훅: `hooks/*` (auth/config/report/progress/toast 등)
  - 유틸/타입: `lib/*`, `types/*`
- **Supabase 연동 기반**
  - Supabase 클라이언트/서버 유틸 분리(`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- **문서화**
  - 제품/플로우/기술 문서 추가: `docs/PRD.md`, `docs/FLOW.md`, `docs/tech-stack.md`, `docs/db-schema.md`
  - 히스토리 로그 규칙 추가: `docs/history/*`에 `NNN-description.md` 형식으로 기록

## 변경 이유

- **PRD의 “Zero Prompting” 목표를 UI 구조로 선반영**하기 위해, 도메인 컴포넌트 분리(`components/domain/*`)와 대시보드 레이아웃(`app/(dashboard)`)을 먼저 확정했다.
- **긴 작업(리포트 생성) UX 요구사항(단계별 메시지/스켈레톤/토스트)**을 빠르게 구현하기 위해 shadcn/ui + Radix UI 기반의 공통 UI 레이어(`components/ui/*`)를 초기에 구성했다.
- **향후 백엔드/비동기 파이프라인(권장 아키텍처)과의 연결**을 고려해, Supabase 유틸 및 타입/훅 레이어를 초기에 분리해 확장 가능성을 확보했다.

## 관련 이슈/에러

- 현재까지 기록할 이슈/에러 없음 (N/A)


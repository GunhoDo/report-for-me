---
date: 2026-01-29
title: 데이터베이스 스키마 설계 및 구현 계획 문서화
---

## 날짜

- 2026-01-29

## 변경 내용

### 데이터베이스 스키마 설계 및 마이그레이션 생성

- **완전한 데이터베이스 스키마 마이그레이션 파일 생성**
  - `supabase/migrations/20260129120000_create_report_schema.sql` 생성
  - 6개 테이블 정의: `profiles`, `user_configs`, `sources`, `reports`, `report_sections`, `report_feedbacks`
  - 3개 ENUM 타입 정의: `report_status_enum`, `source_status_enum`, `section_status_enum`
  - 인덱스 최적화 (JSONB GIN 인덱스 포함)
  - 트리거 함수 3개 구현:
    - `update_updated_at_column()`: 자동 `updated_at` 업데이트
    - `set_reports_completed_at()`: 리포트 완료 시 `completed_at` 설정
    - `handle_new_user()`: 신규 사용자 가입 시 프로필 자동 생성

- **RLS(Row Level Security) 정책 정의**
  - 모든 테이블에 RLS 활성화
  - `auth.uid()` 기반 "본인만 접근" 정책 통일
  - `report_sections`는 `reports` JOIN을 통한 간접 접근 제어
  - SELECT, INSERT, UPDATE, DELETE 정책 모두 정의

- **데이터베이스 설계 문서 작성**
  - `docs/db-schema.md`: 테이블 구조, RLS 정책, ER 다이어그램 포함
  - PRD의 데이터 모델링을 바탕으로 한 PostgreSQL 스키마 가이드

### 타입 정의 파일 생성

- **TypeScript 데이터베이스 타입 정의**
  - `types/database.ts` 생성
  - ENUM 타입 정의 (`ReportStatusEnum`, `SourceStatusEnum`, `SectionStatusEnum`)
  - JSONB 스키마 타입 정의 (`ConfigSnapshot`, `ExecutiveSummary`, `ActionItem`)
  - 테이블 타입 인터페이스 정의 (향후 `supabase gen types`로 자동 생성 가능)

### 구현 계획 문서 작성

- **Supabase SDK & Google OAuth 구현 로드맵**
  - `roadmap.md` 작성
  - Phase별 구현 단계 정의:
    - Phase 1: 환경 설정 및 Supabase SDK 설치
    - Phase 2: Supabase 클라이언트 구현 (브라우저/서버)
    - Phase 3: Google OAuth 설정
    - Phase 4: 인증 로직 구현
    - Phase 5: 인증 상태 관리 및 보호된 라우트
    - Phase 6: 통합 테스트 및 검증
    - Phase 7: 문서화 및 마무리
  - 각 Phase별 상세 구현 가이드 및 코드 예제 포함

- **데이터 흐름 중심 구현 계획**
  - `functional_flow.md` 작성
  - "A 테이블 데이터 페칭 → 상태 관리 → UI 바인딩" 단계별 분해 원칙
  - Phase별 체크리스트 및 검증 항목 정의
  - 현재 상태 요약 및 미구현 항목 명시

### 데이터베이스 정책 규칙 정의

- **`.cursor/rules/400-db-policy.mdc` 규칙 파일 생성**
  - DBA 역할 및 운영 정책 정의
  - "No Destructive Changes" 핵심 정책 (DROP/TRUNCATE 금지)
  - 마이그레이션 파일 형식 및 관리 규칙 정의
  - 증분 업데이트(Incremental Update) 원칙

### Supabase SDK 패키지 설치

- **필수 패키지 설치**
  - `@supabase/supabase-js`: ^2.93.2 (Supabase JavaScript 클라이언트)
  - `@supabase/ssr`: ^0.8.0 (Next.js App Router용 SSR 지원 패키지)
  - `package.json`에 의존성 추가 완료

### Supabase 클라이언트 구현

- **브라우저용 Supabase 클라이언트**
  - `lib/supabase/client.ts` 생성
  - `createBrowserClient` 사용하여 클라이언트 컴포넌트용 클라이언트 구현
  - 환경 변수 검증 로직 포함
  - TypeScript 타입 안전성 보장 (`Database` 타입 제네릭)

- **서버용 Supabase 클라이언트**
  - `lib/supabase/server.ts` 생성
  - `createServerClient` 사용하여 Server Components 및 Route Handlers용 클라이언트 구현
  - Next.js `cookies()` API를 통한 쿠키 관리
  - Server Component의 읽기 전용 제약 처리

- **Route Handler용 Supabase 클라이언트**
  - `lib/supabase/route-handler.ts` 생성
  - Route Handlers에서 쿠키 수정이 가능한 클라이언트 구현
  - OAuth 콜백 핸들러에서 사용

- **인증 유틸리티 함수**
  - `lib/supabase/auth.ts` 생성
  - `requireAuth()`: 보호된 페이지에서 사용, 미인증 시 자동 리다이렉트
  - `getAuthUser()`: 선택적 인증 확인 (리다이렉트 없음)

### Google OAuth 로그인 구현

- **로그인 페이지 Google OAuth 연동**
  - `app/(auth)/login/page.tsx`에 `handleGoogleLogin` 함수 구현
  - `supabase.auth.signInWithOAuth()` 사용하여 Google OAuth 플로우 시작
  - 에러 처리 및 Toast 알림 구현
  - 성공 시 자동으로 Google 인증 페이지로 리다이렉트

- **회원가입 페이지 Google OAuth 연동**
  - `app/(auth)/signup/page.tsx`에 `handleGoogleLogin` 함수 구현
  - 로그인 페이지와 동일한 OAuth 플로우 사용

- **OAuth 콜백 핸들러 구현**
  - `app/auth/callback/route.ts` 생성
  - Google OAuth 인증 후 리다이렉트된 코드를 세션으로 교환
  - `exchangeCodeForSession()` 사용하여 세션 생성
  - 인증 성공 후 대시보드로 자동 리다이렉트

### 로그아웃 구현

- **인증 상태 관리 훅**
  - `hooks/use-auth.ts` 생성
  - `useAuth()` 커스텀 훅 구현:
    - `user`: 현재 사용자 정보
    - `isLoading`: 인증 상태 로딩 여부
    - `signOut`: 로그아웃 함수
  - `onAuthStateChange` 이벤트 리스너로 실시간 인증 상태 동기화
  - 초기 사용자 상태 확인 (`getUser()`)

- **로그아웃 기능**
  - `signOut()` 함수 구현: `supabase.auth.signOut()` 호출
  - 로그아웃 후 루트 페이지(`/`)로 리다이렉트
  - `router.refresh()`로 서버 상태 갱신

- **대시보드 로그아웃 버튼 연동**
  - `components/dashboard/AppDashboard.tsx`에 로그아웃 버튼 연결
  - `useAuth()` 훅의 `signOut` 함수 사용

## 변경 이유

- **데이터베이스 기반 구축**: PRD의 데이터 모델링을 바탕으로 한 완전한 스키마 설계로 백엔드 개발 기반 마련
- **보안 우선**: RLS 정책을 통한 사용자 데이터 격리 및 보안 강화
- **타입 안전성**: TypeScript 타입 정의로 런타임 에러 방지 및 개발자 경험 향상
- **구현 가이드**: 상세한 로드맵 및 데이터 흐름 문서로 체계적인 개발 진행 가능
- **운영 정책 수립**: 데이터베이스 변경 시 데이터 손실 방지 및 안전한 마이그레이션 관리
- **인증 시스템 구축**: Supabase Auth를 활용한 사용자 인증 및 Google OAuth 연동으로 사용자 관리 기반 마련
- **개발자 경험 향상**: 환경별 클라이언트 분리(브라우저/서버/Route Handler)로 각 사용 사례에 최적화된 구현
- **실시간 인증 상태 관리**: `useAuth` 훅을 통한 인증 상태 실시간 동기화 및 여러 탭 간 상태 공유

## 관련 이슈/에러

- **마이그레이션 파일명 형식**: Supabase 표준 타임스탬프 형식(`YYYYMMDDHHMMSS`) 사용
- **RLS 정책 복잡도**: `report_sections`는 `reports` 테이블과 JOIN하여 접근 제어 (직접 `user_id` 없음)
- **JSONB 제약 조건**: `reports` 테이블의 JSONB 컬럼에 CHECK 제약 조건으로 형식 검증
- **트리거 함수 보안**: `handle_new_user()` 함수는 `SECURITY DEFINER`로 실행하여 `auth.users` 테이블 접근 가능
- **Server Component 쿠키 제약**: `lib/supabase/server.ts`의 `setAll`에서 에러 처리 필요 (읽기 전용 제약)
- **Route Handler 쿠키 수정**: OAuth 콜백 핸들러에서는 `route-handler.ts` 클라이언트 사용하여 쿠키 수정 가능
- **인증 상태 동기화**: `useAuth` 훅에서 `onAuthStateChange` 이벤트로 여러 탭 간 실시간 동기화

## 검증 결과

- ✅ 데이터베이스 스키마 마이그레이션 파일 생성 완료
- ✅ 모든 테이블 RLS 정책 정의 완료
- ✅ 트리거 함수 구현 완료 (프로필 자동 생성 포함)
- ✅ 데이터베이스 설계 문서 작성 완료
- ✅ TypeScript 타입 정의 파일 생성 완료
- ✅ 구현 로드맵 및 데이터 흐름 문서 작성 완료
- ✅ 데이터베이스 정책 규칙 파일 생성 완료
- ✅ Supabase SDK 패키지 설치 완료 (`@supabase/supabase-js`, `@supabase/ssr`)
- ✅ Supabase 클라이언트 구현 완료 (브라우저/서버/Route Handler)
- ✅ 인증 유틸리티 함수 구현 완료 (`requireAuth`, `getAuthUser`)
- ✅ Google OAuth 로그인 구현 완료 (로그인/회원가입 페이지)
- ✅ OAuth 콜백 핸들러 구현 완료
- ✅ 인증 상태 관리 훅 구현 완료 (`useAuth`)
- ✅ 로그아웃 기능 구현 완료

## 참고 사항

- 마이그레이션 파일은 Supabase Dashboard의 SQL Editor에서 실행해야 함
- 향후 `supabase gen types typescript` 명령으로 `types/database.ts` 자동 생성 가능
- RLS 정책은 모든 테이블에 적용되어 있어 Supabase 클라이언트에서 자동으로 사용자별 데이터 필터링됨
- `config_snapshot` JSONB 필드는 리포트 생성 시점의 설정값을 보존하여 과거 리포트 재현 가능
- `report_sections`의 `source_id`는 NULL 가능 (소스 삭제 또는 실패 시에도 리포트 유지)
- Supabase 클라이언트는 환경별로 분리되어 있어 각각의 사용 사례에 최적화됨:
  - 브라우저 클라이언트: 클라이언트 컴포넌트 전용
  - 서버 클라이언트: Server Components 및 일반 Route Handlers
  - Route Handler 클라이언트: 쿠키 수정이 필요한 Route Handlers (OAuth 콜백 등)
- Google OAuth는 Supabase Dashboard에서 Provider 설정이 필요함 (Client ID/Secret)
- `useAuth` 훅은 클라이언트 컴포넌트에서만 사용 가능 (`"use client"` 필요)
- 로그아웃 시 `router.refresh()`로 서버 상태를 갱신하여 인증 상태 변경 반영

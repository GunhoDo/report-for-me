---
date: 2026-01-28
title: v0 UI 통합 및 Next.js 표준 구조 재구성
---

## 날짜

- 2026-01-28

## 변경 내용

### Phase 1: 라우팅 구조 재정의

- **비표준 라우팅 구조 수정**
  - `app/app/` 폴더를 `app/dashboard/`로 변경 (Next.js 표준 준수)
  - 라우팅 경로 변경: `/app` → `/dashboard`
  - `app/dashboard/layout.tsx` 생성 (대시보드 레이아웃)
  - 모든 라우팅 참조 업데이트 (`router.push("/app")` → `router.push("/dashboard")`)
  - **추가 정리**: `app/app/` 빈 폴더 완전 삭제 (비표준 중첩 구조 제거)

- **라우트 구조**
  ```
  app/
  ├── (auth)/          # 인증 라우트 그룹
  │   ├── login/       # /login
  │   └── signup/      # /signup
  └── dashboard/       # /dashboard (기존 /app)
      ├── layout.tsx
      ├── page.tsx
      ├── history/     # /dashboard/history
      ├── settings/    # /dashboard/settings
      └── reports/[id] # /dashboard/reports/[id]
  ```

### Phase 2: tmp-v0 파일 통합

- **Theme Provider 통합**
  - `components/providers/theme-provider.tsx` 생성
  - `app/layout.tsx`에 ThemeProvider 추가
  - `suppressHydrationWarning` 속성 추가 (next-themes 권장)
  - 다크모드 지원 활성화

- **use-mobile 훅 추가**
  - `hooks/use-mobile.ts` 생성
  - 반응형 UI 지원을 위한 훅 추가

- **컴포넌트 비교 및 통합**
  - tmp-v0의 주요 컴포넌트는 이미 Next.js 라우팅으로 변환되어 있음 확인
  - 추가 통합 불필요

- **utils.ts 통합**
  - 이미 통합되어 있음 확인
  - 중복 없음

### Phase 3: 스타일 통합

- **globals.css 통합**
  - 현재 `app/globals.css`가 tmp-v0보다 더 표준적임 확인
  - Tailwind CSS 4 플러그인 방식 사용 (`@plugin`)
  - CSS 변수 기반 폰트 설정으로 유연성 확보
  - 추가 통합 불필요

- **PostCSS 설정 확인**
  - 표준 설정 사용
  - 추가 통합 불필요

### Phase 4: 의존성 통합

- **package.json 통합**
  - 필수 패키지 추가:
    - `zod`: ^3.25.76 (타입 검증)
    - `react-hook-form`: ^7.60.0 (폼 관리)
    - `@hookform/resolvers`: ^3.10.0 (zod 통합)
  - 의존성 설치 완료 (`pnpm install`)

- **버전 호환성**
  - 모든 패키지가 Next.js 16, React 19와 호환됨 확인
  - `next-themes@0.3.0`의 React 19 peer dependency 경고 있으나 작동 가능

### Phase 5: 설정 파일 정리

- **next.config.ts 통합**
  - tmp-v0의 설정 옵션을 주석으로 추가
  - 개발 편의성 옵션 주석 처리 (프로덕션 권장 사항 명시)

- **tsconfig.json 확인**
  - 현재 설정이 tmp-v0보다 더 적절함 확인
  - Next.js 16 표준 설정 준수
  - Path alias (`@/*`) 정상 작동

### Phase 6: 컴포넌트 및 파일 정리

- **중복 컴포넌트 정리**
  - `hooks/use-toast.ts`: 이미 통합됨 확인
  - UI 컴포넌트: 중복 없음
  - 컴포넌트 구조 정리 완료

- **Import 경로 확인**
  - 모든 외부 import가 `@/` alias 사용 (표준 준수)
  - 같은 폴더 내 파일들만 상대 경로 사용 (colocation 패턴)
  - 깊은 상대 경로 (`../../`) 없음

### Phase 7: 최종 정리 및 검증

- **빌드 테스트**
  - `pnpm build` 성공
  - TypeScript 오류 수정: `ThemeProviderProps` 타입 직접 정의 (next-themes 0.3.0 호환)
  - 모든 라우트 정상 생성 확인

- **라우팅 테스트**
  - 모든 라우트 경로 확인 완료
  - 라우팅 경로 통일 완료 (`/dashboard`)

- **tmp-v0 폴더 정리**
  - tmp-v0 폴더 보존 (백업 목적)
  - `tsconfig.json`에서 이미 제외됨
  - 빌드에 영향 없음 확인

- **문서 업데이트**
  - `docs/FLOW.md`: `/app` → `/dashboard` 업데이트
  - `docs/history/001-initial-setup.md`: 라우팅 구조 업데이트
  - `docs/tech-stack.md`: 폴더 구조 업데이트

## 변경 이유

- **Next.js 표준 구조 준수**: v0와 소스 병합 과정에서 생성된 비표준 구조(`app/app/`)를 Next.js 16 App Router 표준에 맞게 재구성
- **v0 UI 통합**: tmp-v0 폴더의 유용한 컴포넌트(ThemeProvider, use-mobile 등)를 메인 프로젝트에 통합하여 기능 확장
- **의존성 통합**: 폼 검증 및 관리를 위한 필수 패키지(zod, react-hook-form) 추가
- **프로젝트 일관성**: 라우팅 경로, import 경로, 파일 구조를 표준화하여 유지보수성 향상

## 관련 이슈/에러

- **next-themes 타입 오류**: `next-themes@0.3.0`에서 `ThemeProviderProps` 타입이 export되지 않아 직접 정의하여 해결
- **next-themes React 19 경고**: `next-themes@0.3.0`의 peer dependency 경고 있으나 작동 가능. 향후 `^0.4.6`으로 업데이트 고려 가능

## 검증 결과

- ✅ Next.js 16 App Router 표준 구조 준수
- ✅ `app/app/` 비표준 중첩 구조 완전 제거 확인
- ✅ 모든 라우트 정상 작동
- ✅ 빌드 성공
- ✅ TypeScript 오류 없음
- ✅ Import 경로 표준 준수
- ✅ 문서 업데이트 완료

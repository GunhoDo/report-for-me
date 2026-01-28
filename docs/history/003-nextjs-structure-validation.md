---
date: 2026-01-28
title: Next.js 표준 구조 검증 및 빈 폴더 정리
---

## 날짜

- 2026-01-28

## 변경 내용

### 구조 검증 및 정리

- **비표준 중첩 구조 완전 제거**
  - `app/app/` 빈 폴더 및 하위 빈 폴더(`history/`, `reports/`, `settings/`) 완전 삭제
  - Next.js App Router 표준 구조 준수 확인
  - 빌드 테스트 통과 확인

- **폴더 구조 검증**
  - `app/` 하위의 모든 폴더 구조 검증 완료
  - 라우트 그룹 `(auth)` 정상 작동 확인
  - 동적 라우트 `[id]` 정상 작동 확인
  - 모든 라우트에 `page.tsx` 또는 `layout.tsx` 존재 확인

- **최종 폴더 구조**
  ```
  app/
  ├── (auth)/          # 라우트 그룹 (URL에 포함되지 않음)
  │   ├── layout.tsx
  │   ├── login/
  │   │   └── page.tsx
  │   └── signup/
  │       └── page.tsx
  ├── dashboard/       # /dashboard 라우트
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── history/
  │   │   └── page.tsx
  │   ├── settings/
  │   │   └── page.tsx
  │   └── reports/
  │       └── [id]/
  │           └── page.tsx
  ├── layout.tsx       # 루트 레이아웃
  ├── page.tsx         # 루트 페이지 (/)
  ├── globals.css
  └── favicon.ico
  ```

## 변경 이유

- **Next.js 표준 준수**: `app/app/` 같은 비표준 중첩 구조는 Next.js App Router 규칙에 위배됨
- **명확한 라우팅**: 빈 폴더나 비표준 구조는 라우팅 혼란을 야기할 수 있음
- **프로젝트 일관성**: 표준 구조를 유지하여 유지보수성 향상

## 관련 이슈/에러

- **PowerShell 특수 문자 처리**: `[id]` 폴더명이 PowerShell에서 제대로 처리되지 않는 문제 발견 (파일은 정상 존재)
- **빈 폴더 검증**: PowerShell의 `Get-ChildItem`이 특수 문자(`[`, `]`)를 포함한 경로를 제대로 처리하지 못함
  - 해결: `glob_file_search` 및 `read_file` 도구로 실제 파일 존재 확인

## 검증 결과

- ✅ `app/app/` 비표준 중첩 구조 완전 제거
- ✅ 모든 라우트에 필수 파일(`page.tsx`, `layout.tsx`) 존재 확인
- ✅ 빈 폴더 없음 확인 (모든 폴더에 파일 또는 하위 디렉토리 존재)
- ✅ Next.js 16 App Router 표준 구조 준수
- ✅ 빌드 성공 (`pnpm build`)
- ✅ 모든 라우트 정상 생성 확인

## 참고 사항

- Next.js App Router에서 빈 폴더는 라우트를 생성하지 않으므로 문제가 되지 않지만, 프로젝트 일관성을 위해 정리함
- `app/dashboard/reports` 폴더는 중간 폴더로 파일이 없지만 하위 디렉토리(`[id]`)가 있어 정상 구조임
- 라우트 그룹 `(auth)`는 URL에 포함되지 않으므로 `/login`, `/signup` 경로로 접근 가능

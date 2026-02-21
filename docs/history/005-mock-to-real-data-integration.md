---
date: 2026-02-22
title: 목업 → 실제 데이터 연동 완료
---

## 날짜

- 2026-02-22

## 변경 내용

### sources 스키마 확장

- **sources 테이블에 keywords, viewpoint 컬럼 추가**
  - `supabase/migrations/20260222120000_add_sources_keywords_viewpoint.sql` 생성
  - `keywords`: text[] NOT NULL DEFAULT '{}' (소스별 키워드)
  - `viewpoint`: text NOT NULL DEFAULT '' (소스별 관점)
  - PRD 요구사항: 소스별 독립적인 keywords, viewpoint 설정

- **타입 정의 업데이트**
  - `types/database.ts`: SourcesRow, SourcesInsert, SourcesUpdate에 keywords, viewpoint 추가
  - ConfigSnapshotSource에 keywords?, viewpoint? 추가

### 훅 구현

- **hooks/use-config.ts** – 실제 Supabase 연동
  - user_configs + sources 조회 (TanStack Query)
  - save() mutation: user_configs upsert, sources CRUD (insert/update/delete)
  - 소스별 keywords, viewpoint 저장 지원
  - SourceInput 인터페이스: keywords를 string[] | string 허용 (UI 콤마 구분 문자열)

- **hooks/use-reports.ts** – 신규 생성
  - 리포트 목록 TanStack Query 훅
  - reports 테이블 user_id 기준 조회, created_at 내림차순

- **hooks/use-report-progress.ts** – 실제 구현
  - reports.status 폴링 (2초 간격)
  - pending/collecting/analyzing/synthesizing → 진행 중, completed/partial/failed → 폴링 중지
  - 단계별 메시지: "소스 데이터 수집 중...", "개별 기사 분석 중...", "최종 인사이트 도출 중..."

### 유틸리티

- **lib/utils/report.ts** – 신규 생성
  - parseExecutiveSummary(): executive_summary JSONB 파싱
  - parseActionItem(): action_item JSONB 파싱
  - parseConfigSnapshot(): config_snapshot JSONB 파싱

### AppDashboard 데이터 바인딩

- **모킹 데이터 제거, useConfig/useReports 연동**
  - modules: useConfig().sources를 useMemo로 Source A/B/C 매핑
  - History 사이드바: useReports() 기반 리포트 목록
  - 설정 모달 저장: useConfig().save() 호출
  - Generate Integrated: 3개 소스 모두 설정 시에만 활성화 (PRD)
  - 버튼 클릭 시 POST /api/reports/generate → router.push(/dashboard/reports/[id])

- **페이지 헤더 문구 삭제**
  - "3개 소스가 설정되었습니다..." 등 설명 문구 제거

### 리포트 상세 페이지

- **app/dashboard/reports/[id]/page.tsx**
  - getReportDetail() 서버 페칭 및 ReportDetailClient 렌더링

- **app/dashboard/reports/[id]/report-detail-client.tsx** – 신규 생성
  - ReportProgress: 진행 중일 때 표시
  - ReportView: Executive Summary, report_sections, Action Item 렌더링

- **components/domain/report/report-view.tsx** – 구현
  - useReport() + parseExecutiveSummary, parseActionItem
  - report null 체크 추가

- **components/domain/report/report-progress.tsx** – 구현
  - useReportProgress() + Progress 컴포넌트

**components/ui/progress.tsx** – 신규 생성 (shadcn 스타일)

### History 페이지

- **app/dashboard/history/page.tsx**
  - getReportsList() 서버 페칭 및 HistoryList 렌더링

- **app/dashboard/history/history-list.tsx** – 신규 생성
  - useReports() 기반 리포트 목록, Skeleton 로딩

### API 수정

- **app/api/reports/generate/route.ts**
  - sources 조회: valid + pending 허용, limit(3) 적용
  - config_snapshot.sources에 keywords, viewpoint 포함

### functional_flow.md 업데이트

- 현재 화면 상태: 모킹 → 실제 데이터 연동 완료
- 단계별 진행 계획 1~8 완료 표시
- Phase 1~3 체크리스트 완료 항목 반영
- 전체 진행률: 21/25 (84%)

## 변경 이유

- **실제 서비스 연동**: 모킹 데이터를 실제 Supabase 데이터로 교체하여 end-to-end 플로우 구현
- **PRD 준수**: 소스별 독립 keywords/viewpoint 설정, 3개 소스 필수 시 통합 제언 활성화
- **데이터 흐름 중심**: functional_flow.md의 단계별 계획에 따른 구현

## 관련 이슈/에러

- **Supabase 클라이언트 타입 추론**: user_configs.upsert, sources.update, sources.insert에서 `never` 타입 에러
  - 해결: @ts-expect-error, as never, 타입 단언 사용
- **sources.select("id, url")**: 반환 타입 inferred as never
  - 해결: `as Array<{ id: string; url: string }>` 타입 단언
- **use-report-progress report.status**: report 타입 never
  - 해결: `as { status: ReportStatusEnum } | null` 타입 단언
- **parseConfigSnapshot**: ConfigSnapshot → Record<string, unknown> 직접 캐스팅 불가
  - 해결: `as unknown as Record<string, unknown>` 이중 캐스팅
- **SourceInput.keywords**: string[] | string 허용 (UI에서 콤마 구분 문자열 전달 가능)

## 검증 결과

- ✅ use-config.ts Supabase 연동 완료
- ✅ use-reports.ts, use-report-progress.ts 구현 완료
- ✅ lib/utils/report.ts JSONB 파싱 구현 완료
- ✅ AppDashboard useConfig/useReports 바인딩, 모킹 제거
- ✅ 리포트 상세 페이지 ReportView, ReportProgress 구현
- ✅ History 페이지 useReports 기반 목록 구현
- ✅ sources 스키마 확장 마이그레이션 생성
- ✅ functional_flow.md 진행 상황 반영

## 참고 사항

- 마이그레이션 `20260222120000_add_sources_keywords_viewpoint.sql` 적용 필요
- generate API는 sources.status가 valid 또는 pending인 소스 허용 (URL 검증 미구현)
- 미구현: 소스 URL 검증(2.3), 리포트 피드백(2.10), 에러 핸들링(3.6, 3.7)

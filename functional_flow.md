# Report-for-Me 기능적 흐름 리스트 (Data Flow Centric)

> **목표**: 화면 중심이 아닌 데이터 흐름 중심의 구현 계획  
> **원칙**: "A 테이블 데이터 페칭 → 상태 관리 → UI 바인딩" 단계별 분해  
> **작성일**: 2026-01-29

---

## 🎯 현재 단계별 분석 (2026-02-22)

**원칙**: 현재 화면(AppDashboard)을 최우선 유지하며, PRD/functional_flow에 맞춰 데이터 연동을 단계적으로 진행.

### 현재 화면 상태
- **메인 대시보드**: `AppDashboard` – 2x2 그리드(Source A/B/C + Integrated Synthesis), 설정 모달, 사이드바(History, New Report)
- **데이터**: 현재 **모킹 데이터** 사용 중 (로컬 state, Supabase 미연동)
- **라우트**: `/dashboard` (메인), `/dashboard/history`, `/dashboard/reports/[id]`, `/dashboard/settings` – history/reports 페이지는 placeholder

### 단계별 진행 계획

| 단계 | 작업 | 우선순위 | 비고 |
|------|------|----------|------|
| **1** | `use-config.ts` 실제 구현 | 높음 | 설정 저장/조회를 Supabase와 연동. 현재 스텁 상태 |
| **2** | `use-reports.ts` 생성 | 높음 | 리포트 목록 TanStack Query 훅. History 사이드바/페이지에 필요 |
| **3** | `use-report-progress.ts` 실제 구현 | 중간 | "수집 중 → 분석 중 → 도출 중" 폴링. PRD F4 |
| **4** | `lib/utils/report.ts` 생성 | 중간 | executive_summary, action_item JSONB 파싱. ReportView에 필요 |
| **5** | AppDashboard ↔ 데이터 훅 연결 | 높음 | 모킹 제거, useConfig/useReports로 교체. **화면 레이아웃 유지** |
| **6** | 리포트 상세 페이지 (`/reports/[id]`) | 높음 | ReportView, ReportProgress 컴포넌트 바인딩 |
| **7** | 리포트 생성 버튼 → API 호출 | 높음 | "Generate Integrated" → `/api/reports/generate` POST |
| **8** | History 페이지 | 중간 | useReports 기반 리포트 목록 렌더링 |
| **9** | 소스 URL 검증, 피드백 저장 | 낮음 | Phase 2.3, 2.10 |

### 데이터 모델 정합성 참고
- **PRD**: 사용자당 1개 설정(keywords, viewpoint) + N개 소스(URL)
- **현재 UI**: 3개 모듈 각각 url, keywords, viewpoint
- **Keywords, Viewpoint**: 둘 다 **사용자 입력**이며, 미리 정해진 옵션이 아님. UI에서 Input/Textarea로 자유 입력받음.
- **연동 방안**: 3개 모듈 = 3개 sources. **sources 테이블에 keywords, viewpoint 컬럼 추가** (20260222120000 마이그레이션). 소스별 독립 설정 가능.

### 즉시 진행 권장 순서
1. **use-config.ts** 구현 → 설정 모달이 DB와 연동
2. **use-reports.ts** 생성 → History 사이드바에 실제 리포트 목록 표시
3. **AppDashboard 데이터 바인딩** → useConfig, useReports로 모킹 교체 (화면 유지)
4. **리포트 생성 플로우** → 버튼 클릭 시 `/api/reports/generate` 호출 후 상세 페이지 이동
5. **ReportView, ReportProgress** → 상세 페이지에서 실제 데이터 렌더링

---

## 📊 현재 상태 요약

### ✅ 완료된 항목
- [x] 데이터베이스 스키마 및 타입 정의 (`types/database.ts`)
- [x] RLS 정책 및 트리거 함수
- [x] 기본 UI 컴포넌트 구조
- [x] Supabase 클라이언트 구현 (브라우저/서버/Route Handler)
- [x] 인증 상태 관리 훅 (`useAuth`)
- [x] Google OAuth 로그인 및 로그아웃
- [x] OAuth 콜백 핸들러
- [x] **lib/data/config.ts** – 사용자 설정 데이터 페칭 (서버)
- [x] **lib/data/reports.ts** – 리포트 목록/상세 페칭 (서버)
- [x] **hooks/use-report.ts** – 리포트 상세 클라이언트 훅 (TanStack Query)
- [x] **app/api/reports/generate/route.ts** – 리포트 생성 Route Handler (백엔드 API 호출)
- [x] **components/providers/query-provider.tsx** – TanStack Query Provider
- [x] **app/layout.tsx** – QueryProvider 적용

### ❌ 미구현 항목 (데이터 바인딩)
- [ ] **hooks/use-config.ts** – 실제 Supabase 연동 (현재 스텁)
- [ ] **hooks/use-reports.ts** – 리포트 목록 클라이언트 훅 (미생성)
- [ ] **hooks/use-report-progress.ts** – 진행 상태 폴링 (현재 스텁)
- [ ] **lib/utils/report.ts** – JSONB 파싱 유틸리티 (미생성)
- [ ] 설정/리포트 UI와 데이터 훅 바인딩

---

## 🎯 Phase 1: Foundation (공통 유틸리티 및 기본 데이터 연결)

### 1.1: Supabase 클라이언트 구현 (브라우저)
**데이터 흐름**: 환경 변수 → Supabase 클라이언트 인스턴스 생성

**파일**: `lib/supabase/client.ts`

**구현 내용**:
```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  // 환경 변수 검증 및 클라이언트 생성
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**기술 스택**: `@supabase/ssr`, `@supabase/supabase-js`

**검증**:
- [x] 타입 에러 없음
- [x] 브라우저에서 클라이언트 인스턴스 생성 가능

---

### 1.2: Supabase 클라이언트 구현 (서버)
**데이터 흐름**: 쿠키 → Supabase 서버 클라이언트 인스턴스 생성

**파일**: `lib/supabase/server.ts`

**구현 내용**:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

**기술 스택**: `@supabase/ssr`, Next.js `cookies()`, Server Component

**검증**:
- [x] 서버 컴포넌트에서 클라이언트 생성 가능
- [x] 쿠키 기반 세션 관리 작동

---

### 1.3: 인증 상태 페칭 (서버)
**데이터 흐름**: 쿠키 → `auth.users` 조회 → User 객체 반환

**파일**: `lib/supabase/auth.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "./server";
import { redirect } from "next/navigation";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}
```

**기술 스택**: Server Component, Supabase Auth API

**검증**:
- [x] 로그인 상태에서 올바른 User 반환
- [x] 미인증 시 `/login` 리다이렉트

---

### 1.4: 인증 상태 관리 훅 (클라이언트)
**데이터 흐름**: Supabase Auth 이벤트 → React State 업데이트

**파일**: `hooks/use-auth.ts`

**구현 내용**:
```typescript
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 상태 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // 실시간 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return { user, isLoading, signOut };
}
```

**기술 스택**: React Hook, Supabase Auth `onAuthStateChange`, `useRouter`

**검증**:
- [x] 로그인/로그아웃 시 상태 업데이트
- [x] 여러 탭에서 상태 동기화

---

### 1.5: 프로필 데이터 페칭 (서버)
**데이터 흐름**: `auth.uid()` → `profiles` 테이블 SELECT → Profile 객체 반환

**파일**: `lib/data/profiles.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import type { ProfilesRow } from "@/types/database";

export async function getProfile(): Promise<ProfilesRow | null> {
  const user = await requireAuth();
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // 프로필이 없으면 트리거가 생성해야 하지만, 안전장치
    console.error("Profile fetch error:", error);
    return null;
  }

  return data;
}
```

**기술 스택**: Server Component, Supabase Query Builder, RLS

**검증**:
- [ ] 로그인 사용자의 프로필 반환
- [ ] RLS 정책으로 다른 사용자 프로필 접근 불가 확인

---

### 1.6: 프로필 데이터 페칭 (클라이언트 훅)
**데이터 흐름**: TanStack Query → Supabase 클라이언트 → 캐시된 Profile 반환

**파일**: `hooks/use-profile.ts` (새 파일)

**구현 내용**:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProfilesRow } from "@/types/database";

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfilesRow | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) return null;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

**기술 스택**: TanStack Query, React Hook, Supabase Query Builder

**검증**:
- [ ] 프로필 데이터 캐싱 작동
- [ ] 자동 리페칭 설정 확인

---

### 1.7: 타입 변환 유틸리티 (JSONB → TypeScript)
**데이터 흐름**: DB JSONB 컬럼 → 타입 안전한 객체 변환

**파일**: `lib/utils/report.ts` (새 파일)

**구현 내용**:
```typescript
import type { ReportsRow, ConfigSnapshot, ExecutiveSummary, ActionItem } from "@/types/database";
import type { ReportStructure } from "@/types/report";

/**
 * reports.executive_summary JSONB → ExecutiveSummary 변환
 */
export function parseExecutiveSummary(
  jsonb: ReportsRow["executive_summary"]
): ExecutiveSummary | null {
  if (!jsonb || typeof jsonb !== "object") return null;
  const parsed = jsonb as { bullets?: string[] };
  if (!Array.isArray(parsed.bullets)) return null;
  return { bullets: parsed.bullets };
}

/**
 * reports.action_item JSONB → ActionItem 변환
 */
export function parseActionItem(jsonb: ReportsRow["action_item"]): ActionItem | null {
  if (!jsonb || typeof jsonb !== "object") return null;
  const parsed = jsonb as { text?: string; perspective?: string };
  if (typeof parsed.text !== "string") return null;
  return { text: parsed.text, perspective: parsed.perspective };
}

/**
 * reports.config_snapshot JSONB → ConfigSnapshot 변환
 */
export function parseConfigSnapshot(jsonb: ReportsRow["config_snapshot"]): ConfigSnapshot | null {
  if (!jsonb || typeof jsonb !== "object") return null;
  // 타입 가드 및 검증 로직
  return jsonb as ConfigSnapshot;
}
```

**기술 스택**: TypeScript 타입 가드, JSONB 파싱

**검증**:
- [ ] 잘못된 JSONB 형식 처리
- [ ] 타입 안전성 보장

---

## 🔧 Phase 2: Core Logic (주요 비즈니스 기능의 Read/Write)

### 2.1: 사용자 설정 데이터 페칭 (서버)
**데이터 흐름**: `auth.uid()` → `user_configs` + `sources` JOIN → 설정 객체 반환

**파일**: `lib/data/config.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import type { UserConfigsRow, SourcesRow } from "@/types/database";

export interface UserConfigWithSources {
  config: UserConfigsRow;
  sources: SourcesRow[];
}

export async function getUserConfig(): Promise<UserConfigWithSources | null> {
  const user = await requireAuth();
  const supabase = await createClient();

  // user_configs 조회
  const { data: config, error: configError } = await supabase
    .from("user_configs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (configError || !config) return null;

  // sources 조회
  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (sourcesError) return { config, sources: [] };

  return { config, sources: sources || [] };
}
```

**기술 스택**: Server Component, Supabase JOIN (별도 쿼리), RLS

**검증**:
- [ ] 설정이 없을 때 `null` 반환
- [ ] 소스 목록이 올바르게 정렬됨

---

### 2.2: 사용자 설정 데이터 페칭 (클라이언트 훅)
**데이터 흐름**: TanStack Query → Server Action 또는 Route Handler → 캐시

**파일**: `hooks/use-config.ts`

**구현 내용**:
```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { UserConfigsRow, SourcesRow } from "@/types/database";

export interface UserConfigWithSources {
  config: UserConfigsRow | null;
  sources: SourcesRow[];
}

export function useConfig() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // 설정 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-config"],
    queryFn: async (): Promise<UserConfigWithSources> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { config: null, sources: [] };

      const [configResult, sourcesResult] = await Promise.all([
        supabase.from("user_configs").select("*").eq("user_id", user.id).single(),
        supabase.from("sources").select("*").eq("user_id", user.id).order("created_at"),
      ]);

      return {
        config: configResult.data,
        sources: sourcesResult.data || [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2분
  });

  // 설정 저장 (Mutation)
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      keywords: string[];
      viewpoint: string;
      scheduleCron?: string;
      sources: Array<{ url: string; id?: string }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // user_configs UPSERT
      const { data: config } = await supabase
        .from("user_configs")
        .upsert({
          user_id: user.id,
          keywords: payload.keywords,
          viewpoint: payload.viewpoint,
          schedule_cron: payload.scheduleCron || null,
        })
        .select()
        .single();

      // sources UPSERT (URL 기준)
      const sourcePromises = payload.sources.map((source) =>
        supabase
          .from("sources")
          .upsert({
            id: source.id,
            user_id: user.id,
            url: source.url,
            status: "pending" as const,
          })
          .select()
          .single()
      );

      await Promise.all(sourcePromises);

      return { config, sources: payload.sources };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-config"] });
    },
  });

  return {
    config: data?.config || null,
    sources: data?.sources || [],
    isLoading,
    error,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
```

**기술 스택**: TanStack Query (`useQuery`, `useMutation`), Supabase UPSERT, Optimistic Update

**검증**:
- [ ] 설정 저장 후 자동 리페칭
- [ ] 소스 URL 중복 처리 (UNIQUE 제약)

---

### 2.3: 소스 URL 검증 및 상태 업데이트
**데이터 흐름**: URL 입력 → HTTP HEAD 요청 → `sources.status` 업데이트

**파일**: `lib/data/sources.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function validateSourceUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function updateSourceStatus(
  sourceId: string,
  status: "valid" | "failed" | "pending"
): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();

  await supabase
    .from("sources")
    .update({
      status,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .eq("user_id", user.id); // RLS 보안
}
```

**기술 스택**: Server Action, Fetch API, Supabase UPDATE

**검증**:
- [ ] 타임아웃 처리 (10초)
- [ ] RLS로 다른 사용자 소스 수정 불가 확인

---

### 2.4: 리포트 목록 페칭 (서버)
**데이터 흐름**: `auth.uid()` → `reports` 테이블 SELECT (최신순) → 리포트 배열 반환

**파일**: `lib/data/reports.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import type { ReportsRow } from "@/types/database";

export async function getReportsList(limit = 20): Promise<ReportsRow[]> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Reports fetch error:", error);
    return [];
  }

  return data || [];
}
```

**기술 스택**: Server Component, Supabase Query Builder, RLS

**검증**:
- [ ] 최신 리포트가 먼저 나옴
- [ ] 페이지네이션 준비 (limit 파라미터)

---

### 2.5: 리포트 목록 페칭 (클라이언트 훅)
**데이터 흐름**: TanStack Query → Server Action → 캐시된 리포트 배열 반환

**파일**: `hooks/use-reports.ts` (새 파일)

**구현 내용**:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ReportsRow } from "@/types/database";

export function useReports(limit = 20) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["reports", limit],
    queryFn: async (): Promise<ReportsRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    },
    staleTime: 30 * 1000, // 30초
  });
}
```

**기술 스택**: TanStack Query, React Hook, Supabase Query Builder

**검증**:
- [ ] 리포트 목록 캐싱
- [ ] 자동 리페칭 간격 설정

---

### 2.6: 리포트 상세 페칭 (서버)
**데이터 흐름**: 리포트 ID → `reports` + `report_sections` JOIN → 리포트 상세 객체 반환

**파일**: `lib/data/reports.ts` (추가)

**구현 내용**:
```typescript
import type { ReportsRow, ReportSectionsRow } from "@/types/database";

export interface ReportDetail extends ReportsRow {
  sections: ReportSectionsRow[];
}

export async function getReportDetail(reportId: string): Promise<ReportDetail | null> {
  const user = await requireAuth();
  const supabase = await createClient();

  // 리포트 조회
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (reportError || !report) return null;

  // 섹션 조회
  const { data: sections, error: sectionsError } = await supabase
    .from("report_sections")
    .select("*")
    .eq("report_id", reportId)
    .order("sort_order", { ascending: true });

  return {
    ...report,
    sections: sections || [],
  };
}
```

**기술 스택**: Server Component, Supabase JOIN, RLS

**검증**:
- [ ] 리포트와 섹션이 올바르게 조인됨
- [ ] 다른 사용자 리포트 접근 불가

---

### 2.7: 리포트 상세 페칭 (클라이언트 훅)
**데이터 흐름**: 리포트 ID → TanStack Query → 캐시된 리포트 상세 반환

**파일**: `hooks/use-report.ts`

**구현 내용**:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ReportsRow, ReportSectionsRow } from "@/types/database";

export interface ReportDetail extends ReportsRow {
  sections: ReportSectionsRow[];
}

export function useReport(id: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["report", id],
    queryFn: async (): Promise<ReportDetail | null> => {
      if (!id) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [reportResult, sectionsResult] = await Promise.all([
        supabase
          .from("reports")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("report_sections")
          .select("*")
          .eq("report_id", id)
          .order("sort_order"),
      ]);

      if (reportResult.error || !reportResult.data) return null;

      return {
        ...reportResult.data,
        sections: sectionsResult.data || [],
      };
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1분
  });
}
```

**기술 스택**: TanStack Query, React Hook, Conditional Query (`enabled`)

**검증**:
- [ ] 리포트 ID가 없을 때 쿼리 비활성화
- [ ] 섹션 정렬 순서 확인

---

### 2.8: 리포트 진행 상태 폴링 (클라이언트)
**데이터 흐름**: 리포트 ID → TanStack Query 폴링 → `reports.status` 실시간 업데이트

**파일**: `hooks/use-report-progress.ts`

**구현 내용**:
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ReportStatusEnum } from "@/types/database";

export type ProgressStage = "idle" | "collecting" | "analyzing" | "synthesizing" | "completed" | "partial" | "failed";

const STATUS_TO_STAGE: Record<ReportStatusEnum, ProgressStage> = {
  pending: "idle",
  collecting: "collecting",
  analyzing: "analyzing",
  synthesizing: "synthesizing",
  completed: "completed",
  partial: "completed",
  failed: "failed",
};

const STAGE_MESSAGES: Record<ProgressStage, string> = {
  idle: "대기 중",
  collecting: "소스 데이터 수집 중...",
  analyzing: "개별 기사 분석 중...",
  synthesizing: "최종 인사이트 도출 중...",
  completed: "완료",
  partial: "일부 소스 실패 (완료)",
  failed: "실패",
};

export function useReportProgress(reportId: string | null) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["report-progress", reportId],
    queryFn: async (): Promise<{ stage: ProgressStage; message: string }> => {
      if (!reportId) return { stage: "idle", message: "" };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { stage: "idle", message: "" };

      const { data: report } = await supabase
        .from("reports")
        .select("status")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .single();

      if (!report) return { stage: "idle", message: "" };

      const stage = STATUS_TO_STAGE[report.status];
      return {
        stage,
        message: STAGE_MESSAGES[stage],
      };
    },
    enabled: !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // 진행 중일 때만 폴링 (completed/failed면 중지)
      if (data?.stage === "completed" || data?.stage === "failed") {
        return false;
      }
      return 2000; // 2초마다 폴링
    },
  });

  return {
    stage: data?.stage || "idle",
    message: data?.message || "",
    isLoading,
  };
}
```

**기술 스택**: TanStack Query (`refetchInterval`), React Hook, 동적 폴링

**검증**:
- [ ] 진행 중일 때만 폴링
- [ ] 완료/실패 시 폴링 중지
- [ ] 상태별 메시지 표시

---

### 2.9: 리포트 생성 트리거 (Route Handler)
**데이터 흐름**: 설정 저장 → Route Handler → 백엔드 API 호출 → 리포트 생성 시작

**파일**: `app/api/reports/generate/route.ts` (새 파일)

**구현 내용**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // 사용자 설정 조회
    const { data: config } = await supabase
      .from("user_configs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: { code: "NO_CONFIG", message: "설정이 없습니다." } },
        { status: 400 }
      );
    }

    // 소스 목록 조회
    const { data: sources } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "valid");

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_SOURCES", message: "유효한 소스가 없습니다." } },
        { status: 400 }
      );
    }

    // 리포트 레코드 생성 (pending 상태)
    const configSnapshot = {
      keywords: config.keywords,
      viewpoint: config.viewpoint,
      schedule_cron: config.schedule_cron,
      sources: sources.map((s) => ({
        source_id: s.id,
        url: s.url,
        status: s.status,
      })),
    };

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        status: "pending",
        config_snapshot: configSnapshot,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "리포트 생성 실패" } },
        { status: 500 }
      );
    }

    // 백엔드 API 호출 (FastAPI /api/reports/generate)
    // TODO: 실제 백엔드 URL로 변경
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    const backendResponse = await fetch(`${backendUrl}/api/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report_id: report.id,
        user_id: user.id,
        config: configSnapshot,
      }),
    });

    if (!backendResponse.ok) {
      // 리포트 상태를 failed로 업데이트
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", report.id);

      return NextResponse.json(
        { error: { code: "BACKEND_ERROR", message: "백엔드 처리 실패" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { report_id: report.id } });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: String(error) } },
      { status: 500 }
    );
  }
}
```

**기술 스택**: Next.js Route Handler, Supabase INSERT, Fetch API (백엔드 호출)

**검증**:
- [ ] 리포트 레코드 생성 확인
- [ ] 백엔드 API 호출 성공
- [ ] 에러 시 상태 업데이트

---

### 2.10: 리포트 피드백 저장 (Mutation)
**데이터 흐름**: 사용자 입력 → `report_feedbacks` INSERT → 캐시 무효화

**파일**: `hooks/use-report-feedback.ts` (새 파일)

**구현 내용**:
```typescript
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ReportFeedbacksInsert } from "@/types/database";

export function useReportFeedback(reportId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      comment?: string;
      rating?: number;
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("report_feedbacks").insert({
        report_id: reportId,
        user_id: user.id,
        comment: payload.comment || null,
        rating: payload.rating || null,
      });

      // 리포트 상세 캐시 무효화 (피드백이 추가됨)
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
    },
  });
}
```

**기술 스택**: TanStack Query (`useMutation`), Supabase INSERT, Optimistic Update

**검증**:
- [ ] 피드백 저장 성공
- [ ] 캐시 무효화로 최신 데이터 반영

---

## 🎨 Phase 3: Interaction & Feedback (상태 변경, 알림, 에러 핸들링)

### 3.1: 설정 저장 UI 바인딩
**데이터 흐름**: 폼 입력 → `useConfig().save()` 호출 → 성공/실패 토스트 표시

**파일**: `components/domain/config/config-modal.tsx`

**구현 내용**:
```typescript
"use client";
import { useState } from "react";
import { useConfig } from "@/hooks/use-config";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function ConfigModal() {
  const { config, sources, save, isSaving } = useConfig();
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<string[]>(config?.keywords || []);
  const [viewpoint, setViewpoint] = useState<string>(config?.viewpoint || ""); // 사용자 입력, 미리 정해진 기본값 없음

  const handleSave = async () => {
    try {
      await save({
        keywords,
        viewpoint,
        sources: sources.map((s) => ({ url: s.url, id: s.id })),
      });

      toast({
        title: "설정 저장 완료",
        description: "설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
      });
    }
  };

  return (
    // UI 컴포넌트...
  );
}
```

**기술 스택**: React Hook Form (선택), `useToast`, `useConfig` 훅

**검증**:
- [ ] 저장 성공 시 토스트 표시
- [ ] 에러 시 에러 토스트 표시
- [ ] 로딩 상태 표시

---

### 3.2: 리포트 목록 UI 바인딩
**데이터 흐름**: `useReports()` → 리포트 배열 → 리스트 컴포넌트 렌더링

**파일**: `app/dashboard/history/page.tsx`

**구현 내용**:
```typescript
import { ReportsList } from "@/components/domain/report/reports-list";
import { getReportsList } from "@/lib/data/reports";

export default async function HistoryPage() {
  const reports = await getReportsList(50);

  return (
    <div>
      <h1>리포트 히스토리</h1>
      <ReportsList initialReports={reports} />
    </div>
  );
}
```

**파일**: `components/domain/report/reports-list.tsx` (새 파일)

**구현 내용**:
```typescript
"use client";
import { useReports } from "@/hooks/use-reports";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportsRow } from "@/types/database";

export function ReportsList({ initialReports }: { initialReports: ReportsRow[] }) {
  const { data: reports = initialReports, isLoading } = useReports(50);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

**기술 스택**: Server Component (초기 데이터), Client Component (인터랙션), TanStack Query

**검증**:
- [ ] 초기 데이터 SSR 렌더링
- [ ] 클라이언트에서 자동 리페칭
- [ ] 로딩 스켈레톤 표시

---

### 3.3: 리포트 상세 UI 바인딩
**데이터 흐름**: 리포트 ID → `useReport()` → 리포트 상세 객체 → UI 렌더링

**파일**: `app/dashboard/reports/[id]/page.tsx`

**구현 내용**:
```typescript
import { ReportView } from "@/components/domain/report/report-view";
import { getReportDetail } from "@/lib/data/reports";
import { notFound } from "next/navigation";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReportDetail(id);

  if (!report) {
    notFound();
  }

  return <ReportView initialReport={report} />;
}
```

**파일**: `components/domain/report/report-view.tsx`

**구현 내용**:
```typescript
"use client";
import { useReport } from "@/hooks/use-report";
import { parseExecutiveSummary, parseActionItem } from "@/lib/utils/report";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportDetail } from "@/hooks/use-report";

export function ReportView({ initialReport }: { initialReport: ReportDetail }) {
  const { data: report = initialReport, isLoading } = useReport(initialReport.id);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const summary = parseExecutiveSummary(report.executive_summary);
  const actionItem = parseActionItem(report.action_item);

  return (
    <div>
      {summary && (
        <div>
          <h2>Executive Summary</h2>
          <ul>
            {summary.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}
      {report.sections.map((section) => (
        <div key={section.id}>
          <h3>{section.url}</h3>
          <p>{section.content}</p>
        </div>
      ))}
      {actionItem && <div>{actionItem.text}</div>}
    </div>
  );
}
```

**기술 스택**: Server Component, Client Component, JSONB 파싱 유틸리티

**검증**:
- [ ] 리포트 상세 SSR 렌더링
- [ ] JSONB 데이터 올바르게 파싱
- [ ] 섹션 순서 확인

---

### 3.4: 리포트 진행 상태 UI 바인딩
**데이터 흐름**: 리포트 ID → `useReportProgress()` → 진행 상태 → 단계별 메시지 표시

**파일**: `components/domain/report/report-progress.tsx`

**구현 내용**:
```typescript
"use client";
import { useReportProgress } from "@/hooks/use-report-progress";
import { Progress } from "@/components/ui/progress"; // shadcn 추가 필요

export function ReportProgress({ reportId }: { reportId: string | null }) {
  const { stage, message, isLoading } = useReportProgress(reportId);

  const progressValue = {
    idle: 0,
    collecting: 25,
    analyzing: 50,
    synthesizing: 75,
    completed: 100,
    partial: 100,
    failed: 0,
  }[stage];

  if (isLoading || stage === "idle") {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{message}</span>
        <span>{progressValue}%</span>
      </div>
      <Progress value={progressValue} />
    </div>
  );
}
```

**기술 스택**: React Hook, Progress 컴포넌트, 동적 폴링

**검증**:
- [ ] 진행 상태 실시간 업데이트
- [ ] 완료 시 폴링 중지 확인
- [ ] 단계별 메시지 표시

---

### 3.5: 리포트 생성 트리거 UI 바인딩
**데이터 흐름**: 버튼 클릭 → Route Handler 호출 → 리포트 생성 시작 → 진행 상태 표시

**파일**: `components/domain/report/report-generate-button.tsx` (새 파일)

**구현 내용**:
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ReportGenerateButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "리포트 생성 실패");
      }

      toast({
        title: "리포트 생성 시작",
        description: "리포트가 생성 중입니다. 잠시만 기다려주세요.",
      });

      // 리포트 상세 페이지로 이동
      router.push(`/dashboard/reports/${result.data.report_id}`);
    } catch (error) {
      toast({
        title: "생성 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? "생성 중..." : "리포트 생성"}
    </Button>
  );
}
```

**기술 스택**: Fetch API, `useRouter`, `useToast`

**검증**:
- [ ] 리포트 생성 시작 확인
- [ ] 리포트 상세 페이지로 리다이렉트
- [ ] 에러 처리 확인

---

### 3.6: 에러 핸들링 유틸리티
**데이터 흐름**: Supabase 에러 → 표준화된 에러 객체 변환 → UI 표시

**파일**: `lib/utils/errors.ts` (새 파일)

**구현 내용**:
```typescript
import type { PostgrestError } from "@supabase/supabase-js";
import type { ApiError } from "@/types/api";

export function normalizeSupabaseError(error: PostgrestError | null): ApiError | null {
  if (!error) return null;

  // RLS 에러 처리
  if (error.code === "42501") {
    return {
      code: "PERMISSION_DENIED",
      message: "권한이 없습니다.",
    };
  }

  // 외래키 제약 에러
  if (error.code === "23503") {
    return {
      code: "FOREIGN_KEY_VIOLATION",
      message: "관련 데이터가 없습니다.",
    };
  }

  // UNIQUE 제약 에러
  if (error.code === "23505") {
    return {
      code: "UNIQUE_VIOLATION",
      message: "이미 존재하는 데이터입니다.",
    };
  }

  return {
    code: "DATABASE_ERROR",
    message: error.message || "데이터베이스 오류가 발생했습니다.",
  };
}
```

**기술 스택**: TypeScript, 에러 코드 매핑

**검증**:
- [ ] 다양한 Supabase 에러 처리
- [ ] 사용자 친화적 메시지 변환

---

### 3.7: 글로벌 에러 바운더리
**데이터 흐름**: 컴포넌트 에러 → Error Boundary 캐치 → 에러 UI 표시

**파일**: `components/common/error-boundary.tsx` (새 파일)

**구현 내용**:
```typescript
"use client";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || "알 수 없는 오류"}
          </p>
          <Button onClick={() => window.location.reload()}>
            페이지 새로고침
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**기술 스택**: React Error Boundary, 클래스 컴포넌트

**검증**:
- [ ] 에러 발생 시 UI 표시
- [ ] 새로고침 버튼 작동

---

### 3.8: TanStack Query Provider 설정
**데이터 흐름**: 앱 루트 → QueryClient 생성 → QueryClientProvider 설정

**파일**: `components/providers/query-provider.tsx` (새 파일)

**구현 내용**:
```typescript
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**파일**: `app/layout.tsx` (수정)

**추가 내용**:
```typescript
import { QueryProvider } from "@/components/providers/query-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

**기술 스택**: TanStack Query, React Context

**검증**:
- [ ] QueryClientProvider가 앱 전체에 적용됨
- [ ] 기본 쿼리 옵션 적용 확인

---

## 📋 구현 체크리스트 요약

### Phase 1: Foundation (7개)
- [x] 1.1: Supabase 브라우저 클라이언트
- [x] 1.2: Supabase 서버 클라이언트
- [x] 1.3: 인증 상태 페칭 (서버)
- [x] 1.4: 인증 상태 관리 훅 (클라이언트)
- [ ] 1.5: 프로필 데이터 페칭 (서버)
- [ ] 1.6: 프로필 데이터 페칭 (클라이언트 훅)
- [ ] 1.7: 타입 변환 유틸리티

**추가 구현 완료**:
- [x] Route Handler용 Supabase 클라이언트 (`lib/supabase/route-handler.ts`)
- [x] Google OAuth 로그인 구현 (`app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`)
- [x] OAuth 콜백 핸들러 (`app/auth/callback/route.ts`)

### Phase 2: Core Logic (10개)
- [x] 2.1: 사용자 설정 데이터 페칭 (서버) – `lib/data/config.ts`
- [ ] 2.2: 사용자 설정 데이터 페칭 (클라이언트 훅) – `use-config.ts` 스텁 상태
- [ ] 2.3: 소스 URL 검증 및 상태 업데이트
- [x] 2.4: 리포트 목록 페칭 (서버) – `lib/data/reports.ts`
- [ ] 2.5: 리포트 목록 페칭 (클라이언트 훅) – `use-reports.ts` 미생성
- [x] 2.6: 리포트 상세 페칭 (서버) – `lib/data/reports.ts`
- [x] 2.7: 리포트 상세 페칭 (클라이언트 훅) – `hooks/use-report.ts`
- [ ] 2.8: 리포트 진행 상태 폴링 (클라이언트) – `use-report-progress.ts` 스텁
- [x] 2.9: 리포트 생성 트리거 (Route Handler) – `app/api/reports/generate/route.ts`
- [ ] 2.10: 리포트 피드백 저장 (Mutation)

### Phase 3: Interaction & Feedback (8개)
- [ ] 3.1: 설정 저장 UI 바인딩
- [ ] 3.2: 리포트 목록 UI 바인딩
- [ ] 3.3: 리포트 상세 UI 바인딩
- [ ] 3.4: 리포트 진행 상태 UI 바인딩
- [ ] 3.5: 리포트 생성 트리거 UI 바인딩
- [ ] 3.6: 에러 핸들링 유틸리티
- [ ] 3.7: 글로벌 에러 바운더리
- [x] 3.8: TanStack Query Provider 설정 – `app/layout.tsx` 적용 완료

**총 25개 작업 항목** (완료: 10개)

---

## ✅ 상세 구현 체크리스트

### 🔧 Phase 1: Foundation 상세 체크리스트

#### 1.1: Supabase 브라우저 클라이언트
**구현 전**:
- [x] `@supabase/supabase-js`, `@supabase/ssr` 패키지 설치 확인
- [x] `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 확인
- [x] `types/database.ts` 타입 정의 확인

**구현 중**:
- [x] `createBrowserClient` import 및 구현
- [x] Database 타입 제네릭 적용
- [x] 환경 변수 검증 로직 추가

**구현 후**:
- [x] 브라우저 콘솔에서 클라이언트 인스턴스 생성 테스트
- [x] 타입 에러 없음 확인
- [x] 개발자 도구에서 네트워크 요청 확인

---

#### 1.2: Supabase 서버 클라이언트
**구현 전**:
- [x] Next.js `cookies()` API 이해
- [x] Server Component vs Route Handler 차이 이해

**구현 중**:
- [x] `createServerClient` import 및 구현
- [x] 쿠키 `getAll()`, `setAll()` 구현
- [x] Server Component 제약사항 처리 (setAll 에러 핸들링)

**구현 후**:
- [x] Server Component에서 클라이언트 생성 테스트
- [x] 쿠키 기반 세션 관리 작동 확인
- [x] 타입 에러 없음 확인

---

#### 1.3: 인증 상태 페칭 (서버)
**구현 전**:
- [x] Supabase Auth API 문서 확인
- [x] `auth.users` 테이블 구조 이해

**구현 중**:
- [x] `getAuthUser()` 함수 구현
- [x] `requireAuth()` 함수 구현 (리다이렉트 포함)
- [x] 에러 처리 추가

**구현 후**:
- [x] 로그인 상태에서 올바른 User 반환 확인
- [x] 미인증 시 `/login` 리다이렉트 확인
- [x] 여러 Server Component에서 재사용 가능 확인

---

#### 1.4: 인증 상태 관리 훅 (클라이언트)
**구현 전**:
- [x] React `useEffect`, `useState` 이해
- [x] Supabase `onAuthStateChange` 이벤트 이해

**구현 중**:
- [x] 초기 상태 확인 (`getUser()`)
- [x] 실시간 상태 변경 감지 (`onAuthStateChange`)
- [x] `signOut()` 함수 구현
- [x] 메모리 누수 방지 (cleanup 함수)

**구현 후**:
- [x] 로그인 시 상태 업데이트 확인
- [x] 로그아웃 시 상태 초기화 확인
- [x] 여러 탭에서 상태 동기화 확인
- [x] 컴포넌트 언마운트 시 구독 해제 확인

---

#### 1.5: 프로필 데이터 페칭 (서버)
**구현 전**:
- [ ] `profiles` 테이블 스키마 확인
- [ ] RLS 정책 확인

**구현 중**:
- [ ] `requireAuth()`로 사용자 확인
- [ ] Supabase Query Builder로 프로필 조회
- [ ] 에러 처리 (프로필 없음 케이스)

**구현 후**:
- [ ] 로그인 사용자의 프로필 반환 확인
- [ ] 다른 사용자 프로필 접근 불가 확인 (RLS)
- [ ] 프로필 없을 때 `null` 반환 확인

---

#### 1.6: 프로필 데이터 페칭 (클라이언트 훅)
**구현 전**:
- [ ] TanStack Query 기본 개념 이해
- [ ] `useQuery` 훅 사용법 확인

**구현 중**:
- [ ] `useQuery` 훅 구현
- [ ] `queryKey` 정의
- [ ] `queryFn` 구현
- [ ] `staleTime` 설정

**구현 후**:
- [ ] 프로필 데이터 캐싱 작동 확인
- [ ] 자동 리페칭 설정 확인
- [ ] 로딩 상태 표시 확인
- [ ] 에러 상태 처리 확인

---

#### 1.7: 타입 변환 유틸리티
**구현 전**:
- [ ] JSONB 구조 이해
- [ ] TypeScript 타입 가드 이해

**구현 중**:
- [ ] `parseExecutiveSummary()` 구현
- [ ] `parseActionItem()` 구현
- [ ] `parseConfigSnapshot()` 구현
- [ ] 타입 가드 로직 추가

**구현 후**:
- [ ] 올바른 JSONB 형식 파싱 확인
- [ ] 잘못된 JSONB 형식 처리 확인
- [ ] 타입 안전성 보장 확인
- [ ] `null` 반환 케이스 처리 확인

---

### 🔧 Phase 2: Core Logic 상세 체크리스트

#### 2.1: 사용자 설정 데이터 페칭 (서버)
**구현 전**:
- [ ] `user_configs`, `sources` 테이블 스키마 확인
- [ ] JOIN vs 별도 쿼리 전략 결정

**구현 중**:
- [ ] `getUserConfig()` 함수 구현
- [ ] `user_configs` 조회
- [ ] `sources` 조회 (별도 쿼리)
- [ ] 결과 조합 (`UserConfigWithSources`)

**구현 후**:
- [ ] 설정이 없을 때 `null` 반환 확인
- [ ] 소스 목록 정렬 확인 (`created_at`)
- [ ] RLS로 다른 사용자 데이터 접근 불가 확인

---

#### 2.2: 사용자 설정 데이터 페칭 (클라이언트 훅)
**구현 전**:
- [ ] TanStack Query `useQuery` 고급 옵션 확인
- [ ] `Promise.all()` 병렬 쿼리 이해

**구현 중**:
- [ ] `useQuery` 훅 구현
- [ ] `user_configs`, `sources` 병렬 조회
- [ ] `useMutation` 구현 (설정 저장)
- [ ] `upsert` 로직 구현
- [ ] Optimistic Update (`invalidateQueries`)

**구현 후**:
- [ ] 설정 조회 캐싱 확인
- [ ] 설정 저장 후 자동 리페칭 확인
- [ ] 소스 URL 중복 처리 확인 (UNIQUE 제약)
- [ ] 에러 처리 확인

---

#### 2.3: 소스 URL 검증 및 상태 업데이트
**구현 전**:
- [ ] HTTP HEAD 요청 이해
- [ ] 타임아웃 처리 방법 확인

**구현 중**:
- [ ] `validateSourceUrl()` 함수 구현
- [ ] `fetch` API with HEAD method
- [ ] `AbortSignal.timeout()` 사용
- [ ] `updateSourceStatus()` 함수 구현

**구현 후**:
- [ ] 유효한 URL 검증 성공 확인
- [ ] 무효한 URL 검증 실패 확인
- [ ] 타임아웃 처리 (10초) 확인
- [ ] RLS로 다른 사용자 소스 수정 불가 확인

---

#### 2.4: 리포트 목록 페칭 (서버)
**구현 전**:
- [ ] `reports` 테이블 스키마 확인
- [ ] 페이지네이션 전략 결정

**구현 중**:
- [ ] `getReportsList()` 함수 구현
- [ ] `requireAuth()`로 사용자 확인
- [ ] `order` by `created_at DESC`
- [ ] `limit` 파라미터 처리

**구현 후**:
- [ ] 최신 리포트가 먼저 나오는지 확인
- [ ] 페이지네이션 작동 확인
- [ ] RLS로 다른 사용자 리포트 접근 불가 확인

---

#### 2.5: 리포트 목록 페칭 (클라이언트 훅)
**구현 전**:
- [ ] TanStack Query `staleTime` 설정 이해

**구현 중**:
- [ ] `useReports()` 훅 구현
- [ ] `queryKey`에 `limit` 포함
- [ ] `staleTime` 설정 (30초)

**구현 후**:
- [ ] 리포트 목록 캐싱 확인
- [ ] 자동 리페칭 간격 확인
- [ ] 로딩 상태 표시 확인

---

#### 2.6: 리포트 상세 페칭 (서버)
**구현 전**:
- [ ] `report_sections` 테이블 스키마 확인
- [ ] JOIN 전략 결정

**구현 중**:
- [ ] `getReportDetail()` 함수 구현
- [ ] 리포트 조회 (단일)
- [ ] 섹션 조회 (별도 쿼리)
- [ ] 결과 조합 (`ReportDetail`)

**구현 후**:
- [ ] 리포트와 섹션이 올바르게 조인되는지 확인
- [ ] 섹션 정렬 순서 확인 (`sort_order`)
- [ ] RLS로 다른 사용자 리포트 접근 불가 확인

---

#### 2.7: 리포트 상세 페칭 (클라이언트 훅)
**구현 전**:
- [ ] TanStack Query `enabled` 옵션 이해

**구현 중**:
- [ ] `useReport()` 훅 구현
- [ ] 리포트, 섹션 병렬 조회
- [ ] `enabled` 옵션으로 조건부 쿼리
- [ ] `staleTime` 설정 (1분)

**구현 후**:
- [ ] 리포트 ID가 없을 때 쿼리 비활성화 확인
- [ ] 리포트 상세 캐싱 확인
- [ ] 섹션 정렬 순서 확인

---

#### 2.8: 리포트 진행 상태 폴링 (클라이언트)
**구현 전**:
- [ ] TanStack Query `refetchInterval` 이해
- [ ] 리포트 상태 enum 이해

**구현 중**:
- [ ] `useReportProgress()` 훅 구현
- [ ] 상태 → 단계 매핑 (`STATUS_TO_STAGE`)
- [ ] 단계별 메시지 정의 (`STAGE_MESSAGES`)
- [ ] 동적 폴링 (`refetchInterval` 함수)

**구현 후**:
- [ ] 진행 중일 때만 폴링 확인 (2초 간격)
- [ ] 완료/실패 시 폴링 중지 확인
- [ ] 상태별 메시지 표시 확인
- [ ] 메모리 누수 없음 확인

---

#### 2.9: 리포트 생성 트리거 (Route Handler)
**구현 전**:
- [ ] Next.js Route Handler 구조 이해
- [ ] 백엔드 API 엔드포인트 확인

**구현 중**:
- [ ] `POST` 핸들러 구현
- [ ] 사용자 설정 조회
- [ ] 소스 목록 조회
- [ ] 리포트 레코드 생성 (`pending` 상태)
- [ ] 백엔드 API 호출
- [ ] 에러 처리 (백엔드 실패 시 상태 업데이트)

**구현 후**:
- [ ] 리포트 레코드 생성 확인
- [ ] 백엔드 API 호출 성공 확인
- [ ] 에러 시 상태 업데이트 확인
- [ ] RLS 보안 확인

---

#### 2.10: 리포트 피드백 저장 (Mutation)
**구현 전**:
- [ ] `report_feedbacks` 테이블 스키마 확인
- [ ] TanStack Query `useMutation` 이해

**구현 중**:
- [ ] `useReportFeedback()` 훅 구현
- [ ] `mutationFn` 구현 (INSERT)
- [ ] 캐시 무효화 (`invalidateQueries`)

**구현 후**:
- [ ] 피드백 저장 성공 확인
- [ ] 캐시 무효화로 최신 데이터 반영 확인
- [ ] 에러 처리 확인

---

### 🔧 Phase 3: Interaction & Feedback 상세 체크리스트

#### 3.1: 설정 저장 UI 바인딩
**구현 전**:
- [ ] `config-modal.tsx` 컴포넌트 구조 확인
- [ ] React Hook Form 사용 여부 결정

**구현 중**:
- [ ] `useConfig()` 훅 연결
- [ ] 폼 상태 관리 (`keywords`, `viewpoint`)
- [ ] `handleSave()` 함수 구현
- [ ] 성공/실패 토스트 표시
- [ ] 로딩 상태 표시

**구현 후**:
- [ ] 저장 성공 시 토스트 표시 확인
- [ ] 에러 시 에러 토스트 표시 확인
- [ ] 로딩 상태 표시 확인
- [ ] 폼 검증 확인

---

#### 3.2: 리포트 목록 UI 바인딩
**구현 전**:
- [ ] Server Component + Client Component 패턴 이해
- [ ] `reports-list.tsx` 컴포넌트 구조 확인

**구현 중**:
- [ ] Server Component에서 초기 데이터 페칭
- [ ] Client Component에서 `useReports()` 연결
- [ ] 로딩 스켈레톤 구현
- [ ] 리포트 카드 컴포넌트 구현

**구현 후**:
- [ ] 초기 데이터 SSR 렌더링 확인
- [ ] 클라이언트에서 자동 리페칭 확인
- [ ] 로딩 스켈레톤 표시 확인
- [ ] 빈 목록 처리 확인

---

#### 3.3: 리포트 상세 UI 바인딩
**구현 전**:
- [ ] `report-view.tsx` 컴포넌트 구조 확인
- [ ] JSONB 파싱 유틸리티 확인

**구현 중**:
- [ ] Server Component에서 초기 데이터 페칭
- [ ] Client Component에서 `useReport()` 연결
- [ ] `parseExecutiveSummary()` 사용
- [ ] `parseActionItem()` 사용
- [ ] 섹션 렌더링

**구현 후**:
- [ ] 리포트 상세 SSR 렌더링 확인
- [ ] JSONB 데이터 올바르게 파싱 확인
- [ ] 섹션 순서 확인
- [ ] 빈 데이터 처리 확인

---

#### 3.4: 리포트 진행 상태 UI 바인딩
**구현 전**:
- [ ] Progress 컴포넌트 확인 (shadcn)
- [ ] `report-progress.tsx` 컴포넌트 구조 확인

**구현 중**:
- [ ] `useReportProgress()` 훅 연결
- [ ] 진행률 계산 로직
- [ ] Progress 컴포넌트 연결
- [ ] 단계별 메시지 표시

**구현 후**:
- [ ] 진행 상태 실시간 업데이트 확인
- [ ] 완료 시 폴링 중지 확인
- [ ] 단계별 메시지 표시 확인
- [ ] 진행률 표시 확인

---

#### 3.5: 리포트 생성 트리거 UI 바인딩
**구현 전**:
- [ ] Route Handler 엔드포인트 확인
- [ ] `report-generate-button.tsx` 컴포넌트 구조 확인

**구현 중**:
- [ ] `handleGenerate()` 함수 구현
- [ ] `fetch` API로 Route Handler 호출
- [ ] 성공/실패 토스트 표시
- [ ] 로딩 상태 표시
- [ ] 리다이렉트 처리

**구현 후**:
- [ ] 리포트 생성 시작 확인
- [ ] 리포트 상세 페이지로 리다이렉트 확인
- [ ] 에러 처리 확인
- [ ] 중복 클릭 방지 확인

---

#### 3.6: 에러 핸들링 유틸리티
**구현 전**:
- [ ] Supabase 에러 코드 문서 확인
- [ ] `errors.ts` 파일 구조 확인

**구현 중**:
- [ ] `normalizeSupabaseError()` 함수 구현
- [ ] RLS 에러 처리 (`42501`)
- [ ] 외래키 제약 에러 처리 (`23503`)
- [ ] UNIQUE 제약 에러 처리 (`23505`)
- [ ] 일반 에러 처리

**구현 후**:
- [ ] 다양한 Supabase 에러 처리 확인
- [ ] 사용자 친화적 메시지 변환 확인
- [ ] 타입 안전성 확인

---

#### 3.7: 글로벌 에러 바운더리
**구현 전**:
- [ ] React Error Boundary 개념 이해
- [ ] 클래스 컴포넌트 vs 함수 컴포넌트

**구현 중**:
- [ ] `ErrorBoundary` 클래스 컴포넌트 구현
- [ ] `getDerivedStateFromError()` 구현
- [ ] `componentDidCatch()` 구현
- [ ] 에러 UI 구현

**구현 후**:
- [ ] 에러 발생 시 UI 표시 확인
- [ ] 새로고침 버튼 작동 확인
- [ ] 에러 로깅 확인

---

#### 3.8: TanStack Query Provider 설정
**구현 전**:
- [ ] TanStack Query Provider 개념 이해
- [ ] `app/layout.tsx` 구조 확인

**구현 중**:
- [ ] `QueryProvider` 컴포넌트 구현
- [ ] `QueryClient` 생성 및 설정
- [ ] 기본 쿼리 옵션 설정
- [ ] `app/layout.tsx`에 Provider 추가

**구현 후**:
- [ ] QueryClientProvider가 앱 전체에 적용됨 확인
- [ ] 기본 쿼리 옵션 적용 확인
- [ ] React DevTools에서 QueryClient 확인

---

## 🧪 통합 테스트 체크리스트

### 인증 플로우 테스트
- [ ] 이메일/비밀번호 회원가입 → 이메일 확인 → 로그인 → 대시보드 접근
- [ ] Google OAuth 로그인 → 대시보드 접근
- [ ] 로그아웃 → 랜딩 페이지 리다이렉트
- [ ] 미인증 상태에서 보호된 라우트 접근 → 로그인 페이지 리다이렉트
- [ ] 여러 탭에서 인증 상태 동기화

### 설정 관리 플로우 테스트
- [ ] 설정 페이지 접근 → 기존 설정 로드
- [ ] 키워드 추가/삭제 → 저장 → 자동 리페칭
- [ ] 관점 변경 → 저장 → 자동 리페칭
- [ ] 소스 URL 추가 → 검증 → 저장
- [ ] 소스 URL 삭제 → 저장 → 자동 리페칭
- [ ] 설정 없을 때 빈 상태 표시

### 리포트 생성 플로우 테스트
- [ ] 리포트 생성 버튼 클릭 → 리포트 레코드 생성 (`pending`)
- [ ] 진행 상태 폴링 → 단계별 메시지 표시
- [ ] 리포트 완료 → 상세 페이지 자동 업데이트
- [ ] 리포트 실패 → 에러 메시지 표시
- [ ] 리포트 부분 실패 (`partial`) → 완료 상태로 표시

### 리포트 조회 플로우 테스트
- [ ] 리포트 목록 페이지 → 최신순 정렬 확인
- [ ] 리포트 상세 페이지 → Executive Summary 표시
- [ ] 리포트 상세 페이지 → 섹션 목록 표시
- [ ] 리포트 상세 페이지 → Action Item 표시
- [ ] 리포트 피드백 저장 → 캐시 무효화 확인

### 에러 처리 테스트
- [ ] 네트워크 에러 → 사용자 친화적 메시지 표시
- [ ] RLS 에러 → 권한 없음 메시지 표시
- [ ] 잘못된 데이터 형식 → 에러 바운더리 작동
- [ ] 백엔드 API 에러 → 리포트 상태 업데이트 확인

---

## 🚀 배포 전 체크리스트

### 환경 변수 확인
- [ ] `.env.local` 파일에 모든 필수 변수 설정
- [ ] `.env.example` 파일 업데이트
- [ ] 프로덕션 환경 변수 설정 확인

### 보안 확인
- [ ] RLS 정책이 모든 테이블에 적용됨
- [ ] 환경 변수가 Git에 커밋되지 않음
- [ ] Supabase Anon Key가 클라이언트에 노출되어도 안전함 (RLS로 보호)
- [ ] 백엔드 API 키가 서버 사이드에서만 사용됨

### 성능 확인
- [ ] TanStack Query 캐싱 작동 확인
- [ ] 불필요한 리페칭 없음 확인
- [ ] 페이지 로딩 속도 확인 (< 2초)
- [ ] 이미지 최적화 확인 (필요 시)

### 접근성 확인
- [ ] 키보드 네비게이션 작동
- [ ] 스크린 리더 호환성 (필요 시)
- [ ] 색상 대비 확인

### 문서화 확인
- [ ] README.md 업데이트
- [ ] API 문서 업데이트 (필요 시)
- [ ] 주석 및 타입 정의 완료

---

## 📊 진행 상황 추적

### Phase 1 진행률: 4/7 (57%)
- [x] 1.1: Supabase 브라우저 클라이언트
- [x] 1.2: Supabase 서버 클라이언트
- [x] 1.3: 인증 상태 페칭 (서버)
- [x] 1.4: 인증 상태 관리 훅 (클라이언트)
- [ ] 1.5: 프로필 데이터 페칭 (서버)
- [ ] 1.6: 프로필 데이터 페칭 (클라이언트 훅)
- [ ] 1.7: 타입 변환 유틸리티

### Phase 2 진행률: 5/10 (50%)
- [x] 2.1: 사용자 설정 데이터 페칭 (서버)
- [ ] 2.2: 사용자 설정 데이터 페칭 (클라이언트 훅)
- [ ] 2.3: 소스 URL 검증 및 상태 업데이트
- [x] 2.4: 리포트 목록 페칭 (서버)
- [ ] 2.5: 리포트 목록 페칭 (클라이언트 훅)
- [x] 2.6: 리포트 상세 페칭 (서버)
- [x] 2.7: 리포트 상세 페칭 (클라이언트 훅)
- [ ] 2.8: 리포트 진행 상태 폴링 (클라이언트)
- [x] 2.9: 리포트 생성 트리거 (Route Handler)
- [ ] 2.10: 리포트 피드백 저장 (Mutation)

### Phase 3 진행률: 1/8 (13%)
- [ ] 3.1
- [ ] 3.2
- [ ] 3.3
- [ ] 3.4
- [ ] 3.5
- [ ] 3.6
- [ ] 3.7
- [x] 3.8: TanStack Query Provider 설정

**전체 진행률: 10/25 (40%)**

**추가 완료 항목**:
- Route Handler용 Supabase 클라이언트
- Google OAuth 로그인 및 로그아웃
- OAuth 콜백 핸들러
- lib/data/config.ts, lib/data/reports.ts
- hooks/use-report.ts
- app/api/reports/generate/route.ts
- QueryProvider 및 layout 적용

---

**마지막 업데이트**: 2026-02-22  
**다음 리뷰**: 각 Phase 완료 시점

**최근 업데이트 내용** (2026-02-22):
- ✅ Phase 2.1, 2.4, 2.6, 2.7, 2.9 완료 (설정/리포트 서버 페칭, use-report 훅, 리포트 생성 Route Handler)
- ✅ Phase 3.8 완료 (TanStack Query Provider)
- ✅ lib/data/config.ts, lib/data/reports.ts 구현 완료
- ✅ app/api/reports/generate/route.ts 백엔드 연동 및 config_snapshot 처리 완료

---

## 🎯 구현 우선순위

### 높은 우선순위 (필수)
1. Phase 1 전체 (Foundation) - 모든 기능의 기반
2. Phase 2.1 ~ 2.2 (설정 데이터) - 핵심 기능
3. Phase 2.4 ~ 2.7 (리포트 데이터) - 핵심 기능
4. Phase 3.8 (Query Provider) - 상태 관리 기반

### 중간 우선순위 (권장)
5. Phase 2.8 (진행 상태 폴링) - UX 개선
6. Phase 2.9 (리포트 생성 트리거) - 핵심 기능
7. Phase 3.1 ~ 3.5 (UI 바인딩) - 사용자 인터랙션

### 낮은 우선순위 (선택사항)
8. Phase 2.3 (소스 검증) - 보조 기능
9. Phase 2.10 (피드백 저장) - 부가 기능
10. Phase 3.6 ~ 3.7 (에러 핸들링) - 안정성 개선

---

## 📌 기술 스택 요약

### 데이터 페칭
- **Server Component**: `lib/data/*.ts` (서버 사이드 데이터 페칭)
- **Client Hook**: `hooks/use-*.ts` (TanStack Query 기반)
- **Route Handler**: `app/api/**/route.ts` (백엔드 API 호출)

### 상태 관리
- **TanStack Query**: 서버 상태 관리 및 캐싱
- **React State**: 로컬 UI 상태
- **Supabase Realtime**: 실시간 업데이트 (선택사항)

### 인증
- **Supabase Auth**: Google OAuth, 이메일/비밀번호
- **RLS**: 데이터베이스 레벨 보안

### 에러 처리
- **에러 유틸리티**: `lib/utils/errors.ts`
- **Error Boundary**: 글로벌 에러 캐치
- **Toast**: 사용자 피드백

---

**작성 완료일**: 2026-01-29  
**다음 단계**: Phase 1부터 순차적으로 구현 시작

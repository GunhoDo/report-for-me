# Report-for-Me 구현 로드맵: Supabase SDK & Google OAuth

> **목표**: Supabase SDK를 활용한 인증 시스템 구축 및 Google OAuth 연동  
> **작성일**: 2026-01-29  
> **기준**: PRD, FLOW, tech-stack.md, db-schema.md 분석 결과

---

## 📋 현재 상태 분석

### ✅ 완료된 항목
- [x] 데이터베이스 스키마 설계 완료 (`supabase/migrations/20260129120000_create_report_schema.sql`)
- [x] RLS(Row Level Security) 정책 정의 완료
- [x] 프로필 자동 생성 트리거 함수 구현 (`handle_new_user()`)
- [x] 인증 UI 컴포넌트 구조 완성 (`app/(auth)/login`, `app/(auth)/signup`)
- [x] Google OAuth 버튼 UI 구현 (기능 미연동)

### ❌ 미구현 항목
- [ ] Supabase SDK 패키지 설치
- [ ] Supabase 클라이언트 구현 (브라우저/서버)
- [ ] Google OAuth Provider 설정 (Supabase Dashboard)
- [ ] 이메일/비밀번호 인증 로직
- [ ] Google OAuth 인증 로직
- [ ] 인증 상태 관리 훅 (`use-auth.ts`)
- [ ] 보호된 라우트 미들웨어
- [ ] 환경 변수 설정

---

## 🎯 Phase 1: 환경 설정 및 Supabase SDK 설치

### Step 1.1: Supabase 패키지 설치
**목표**: 필요한 Supabase 패키지 설치

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

**설명**:
- `@supabase/supabase-js`: Supabase JavaScript 클라이언트
- `@supabase/ssr`: Next.js App Router용 SSR 지원 패키지

**검증**:
- `package.json`에 패키지가 추가되었는지 확인
- `pnpm-lock.yaml`이 업데이트되었는지 확인

---

### Step 1.2: 환경 변수 설정
**목표**: Supabase 프로젝트 정보를 환경 변수로 설정

**파일**: `.env.local` (이미 존재)

**필요한 환경 변수**:
```env
# Supabase 프로젝트 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth (Supabase Dashboard에서 설정 후 필요 시)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id (선택사항, Supabase가 관리)
```

**설명**:
- Supabase Dashboard → Settings → API에서 URL과 Anon Key 확인
- Google OAuth는 Supabase Dashboard에서 직접 설정하므로 클라이언트 ID는 필요 없을 수 있음

**검증**:
- `.env.local` 파일에 값이 올바르게 설정되었는지 확인
- `.gitignore`에 `.env.local`이 포함되어 있는지 확인 (보안)

---

### Step 1.3: Supabase 프로젝트 생성 및 마이그레이션 적용
**목표**: Supabase 프로젝트 생성 및 스키마 적용

**작업**:
1. [Supabase Dashboard](https://app.supabase.com)에서 새 프로젝트 생성
2. 프로젝트 생성 후 SQL Editor에서 마이그레이션 실행:
   ```sql
   -- supabase/migrations/20260129120000_create_report_schema.sql 실행
   ```
3. 마이그레이션 검증:
   ```sql
   -- 테이블 확인
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- RLS 활성화 확인
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public';
   ```

**검증**:
- 모든 테이블이 생성되었는지 확인 (`profiles`, `user_configs`, `sources`, `reports`, `report_sections`, `report_feedbacks`)
- RLS가 모든 테이블에 활성화되었는지 확인
- 트리거 함수 `handle_new_user()`가 생성되었는지 확인

---

## 🔐 Phase 2: Supabase 클라이언트 구현

### Step 2.1: 브라우저 클라이언트 구현
**목표**: 클라이언트 컴포넌트용 Supabase 클라이언트 구현

**파일**: `lib/supabase/client.ts`

**구현 내용**:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

**설명**:
- `createBrowserClient`는 브라우저 환경에서 쿠키를 자동으로 관리
- 클라이언트 컴포넌트에서만 사용 (`"use client"`)

**검증**:
- 타입 에러가 없는지 확인
- 브라우저 콘솔에서 클라이언트 인스턴스 생성 테스트

---

### Step 2.2: 서버 클라이언트 구현
**목표**: Server Components 및 Route Handlers용 Supabase 클라이언트 구현

**파일**: `lib/supabase/server.ts`

**구현 내용**:
```typescript
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 쿠키 설정은 무시
          }
        },
      },
    }
  );
}
```

**설명**:
- `createServerClient`는 서버 환경에서 쿠키를 안전하게 관리
- Server Components와 Route Handlers에서 사용
- `setAll`에서 에러 처리는 Server Component의 제약 때문

**검증**:
- 타입 에러가 없는지 확인
- 서버 컴포넌트에서 클라이언트 인스턴스 생성 테스트

---

### Step 2.3: Route Handler용 클라이언트 구현 (선택사항)
**목표**: Route Handlers에서 쿠키를 수정할 수 있는 클라이언트 구현

**파일**: `lib/supabase/route-handler.ts` (새 파일)

**구현 내용**:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function createClient(request: NextRequest) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

**설명**:
- Route Handlers (`app/api/**/route.ts`)에서만 사용
- 쿠키 수정이 가능한 버전

**검증**:
- Route Handler에서 인증 상태 확인 테스트

---

## 🔑 Phase 3: Google OAuth 설정

### Step 3.1: Google Cloud Console 설정
**목표**: Google OAuth 클라이언트 ID 생성

**작업**:
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** → **Credentials** 이동
4. **Create Credentials** → **OAuth client ID** 선택
5. Application type: **Web application**
6. Authorized redirect URIs 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
   (로컬 개발 시)
   ```
   http://localhost:54321/auth/v1/callback
   ```
7. Client ID와 Client Secret 복사

**설명**:
- Redirect URI는 Supabase가 제공하는 콜백 엔드포인트 사용
- 로컬 개발 시 Supabase CLI를 사용하는 경우 localhost URI도 추가

**검증**:
- Client ID와 Client Secret이 생성되었는지 확인

---

### Step 3.2: Supabase Dashboard에서 Google Provider 설정
**목표**: Supabase에 Google OAuth Provider 등록

**작업**:
1. Supabase Dashboard → **Authentication** → **Providers** 이동
2. **Google** Provider 찾기
3. **Enable Google** 토글 활성화
4. Google Cloud Console에서 복사한 값 입력:
   - **Client ID (for OAuth)**: Google Cloud Console의 Client ID
   - **Client Secret (for OAuth)**: Google Cloud Console의 Client Secret
5. **Save** 클릭

**설명**:
- Supabase가 OAuth 플로우를 자동으로 처리
- 콜백 URL은 Supabase가 자동으로 관리

**검증**:
- Google Provider가 활성화되었는지 확인
- 테스트 로그인 시도 (Step 4.2에서)

---

## 🚀 Phase 4: 인증 로직 구현

### Step 4.1: 이메일/비밀번호 회원가입 구현
**목표**: `signup-form.tsx`에 실제 회원가입 로직 구현

**파일**: `components/domain/auth/signup-form.tsx`

**구현 내용**:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // 이메일 확인이 필요한 경우
    if (data.user && !data.session) {
      toast({
        title: "이메일 확인 필요",
        description: "이메일을 확인하여 계정을 활성화해주세요.",
      });
      setIsLoading(false);
      return;
    }

    // 자동 로그인된 경우 (이메일 확인 불필요 시)
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 기존 UI 코드 유지 */}
    </form>
  );
}
```

**설명**:
- `supabase.auth.signUp()`으로 회원가입 처리
- 이메일 확인이 활성화된 경우 `data.session`이 없을 수 있음
- 트리거 함수 `handle_new_user()`가 자동으로 `profiles` 레코드 생성

**검증**:
- 회원가입 성공 시 `profiles` 테이블에 레코드가 생성되는지 확인
- 에러 처리 메시지가 올바르게 표시되는지 확인

---

### Step 4.2: 이메일/비밀번호 로그인 구현
**목표**: `login-form.tsx`에 실제 로그인 로직 구현

**파일**: `components/domain/auth/login-form.tsx`

**구현 내용**:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 기존 UI 코드 유지 */}
    </form>
  );
}
```

**설명**:
- `supabase.auth.signInWithPassword()`로 로그인 처리
- 성공 시 세션이 생성되고 쿠키에 저장됨

**검증**:
- 로그인 성공 시 대시보드로 리다이렉트되는지 확인
- 잘못된 자격증명 시 에러 메시지가 표시되는지 확인

---

### Step 4.3: Google OAuth 로그인 구현
**목표**: Google OAuth 버튼에 실제 인증 로직 연결

**파일**: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`

**구현 내용**:
```typescript
const handleGoogleLogin = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    toast({
      title: "로그인 실패",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

**설명**:
- `signInWithOAuth()`로 Google OAuth 플로우 시작
- Supabase가 자동으로 리다이렉트 처리
- 콜백 URL은 `/auth/callback`으로 설정 (Step 4.4에서 구현)

**검증**:
- Google 로그인 버튼 클릭 시 Google 인증 페이지로 리다이렉트되는지 확인

---

### Step 4.4: OAuth 콜백 핸들러 구현
**목표**: OAuth 인증 후 콜백 처리

**파일**: `app/auth/callback/route.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 인증 성공 후 대시보드로 리다이렉트
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
```

**설명**:
- OAuth 인증 후 Google에서 리다이렉트된 코드를 세션으로 교환
- `exchangeCodeForSession()`으로 세션 생성

**검증**:
- Google 로그인 완료 후 대시보드로 리다이렉트되는지 확인
- 세션이 올바르게 생성되었는지 확인

---

## 🔒 Phase 5: 인증 상태 관리 및 보호된 라우트

### Step 5.1: useAuth 훅 구현
**목표**: 인증 상태를 관리하는 커스텀 훅 구현

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
    // 초기 사용자 상태 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return { user, isLoading, signOut };
}
```

**설명**:
- `getUser()`로 초기 상태 확인
- `onAuthStateChange()`로 실시간 상태 변경 감지
- `signOut()`으로 로그아웃 처리

**검증**:
- 로그인/로그아웃 시 사용자 상태가 올바르게 업데이트되는지 확인

---

### Step 5.2: 서버 사이드 인증 확인 유틸리티
**목표**: Server Components에서 인증 상태 확인

**파일**: `lib/supabase/auth.ts` (새 파일)

**구현 내용**:
```typescript
import { createClient } from "./server";
import { redirect } from "next/navigation";

/**
 * 서버 컴포넌트에서 인증된 사용자 확인
 * 미인증 시 로그인 페이지로 리다이렉트
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * 서버 컴포넌트에서 사용자 정보 가져오기 (리다이렉트 없음)
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
```

**설명**:
- `requireAuth()`: 보호된 페이지에서 사용, 미인증 시 자동 리다이렉트
- `getAuthUser()`: 선택적 인증 확인

**검증**:
- 보호된 페이지에서 미인증 시 로그인 페이지로 리다이렉트되는지 확인

---

### Step 5.3: 대시보드 라우트 보호
**목표**: 대시보드 페이지에 인증 보호 적용

**파일**: `app/dashboard/layout.tsx` 또는 각 페이지

**구현 내용**:
```typescript
import { requireAuth } from "@/lib/supabase/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 미인증 시 자동으로 /login으로 리다이렉트
  await requireAuth();

  return <>{children}</>;
}
```

**설명**:
- Server Component에서 `requireAuth()` 호출로 보호
- 미인증 사용자는 자동으로 로그인 페이지로 이동

**검증**:
- 미인증 상태에서 `/dashboard` 접근 시 로그인 페이지로 리다이렉트되는지 확인

---

### Step 5.4: 랜딩 페이지에서 인증 상태에 따른 리다이렉트
**목표**: 이미 로그인한 사용자는 대시보드로 자동 리다이렉트

**파일**: `app/page.tsx`

**구현 내용**:
```typescript
import { getAuthUser } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getAuthUser();

  // 이미 로그인한 사용자는 대시보드로 리다이렉트
  if (user) {
    redirect("/dashboard");
  }

  // 미인증 사용자에게 랜딩 페이지 표시
  return (
    // 기존 랜딩 페이지 컴포넌트
  );
}
```

**설명**:
- 로그인한 사용자가 랜딩 페이지 접근 시 대시보드로 자동 이동
- UX 개선

**검증**:
- 로그인 상태에서 루트 접근 시 대시보드로 리다이렉트되는지 확인

---

## ✅ Phase 6: 통합 테스트 및 검증

### Step 6.1: 이메일/비밀번호 인증 플로우 테스트
**목표**: 전체 인증 플로우 검증

**테스트 시나리오**:
1. 회원가입 → 이메일 확인 (필요 시) → 로그인 → 대시보드 접근
2. 잘못된 자격증명으로 로그인 시도 → 에러 메시지 확인
3. 로그아웃 → 랜딩 페이지로 리다이렉트

**검증 항목**:
- [ ] 회원가입 성공 시 `profiles` 테이블에 레코드 생성 확인
- [ ] 로그인 성공 시 세션 생성 확인
- [ ] 보호된 라우트 접근 시 인증 확인
- [ ] 로그아웃 시 세션 삭제 확인

---

### Step 6.2: Google OAuth 플로우 테스트
**목표**: Google OAuth 인증 검증

**테스트 시나리오**:
1. Google 로그인 버튼 클릭 → Google 인증 페이지로 리다이렉트
2. Google 계정 선택 → 콜백 처리 → 대시보드 접근
3. 첫 로그인 시 `profiles` 테이블에 레코드 생성 확인

**검증 항목**:
- [ ] Google 인증 페이지로 올바르게 리다이렉트되는지 확인
- [ ] 콜백 후 세션 생성 확인
- [ ] 첫 로그인 시 프로필 자동 생성 확인
- [ ] 기존 사용자 재로그인 시 프로필 중복 생성 안 되는지 확인

---

### Step 6.3: 인증 상태 실시간 동기화 테스트
**목표**: 여러 탭에서 인증 상태 동기화 확인

**테스트 시나리오**:
1. 탭 A에서 로그인
2. 탭 B에서 새로고침 → 자동으로 로그인 상태 확인
3. 탭 A에서 로그아웃
4. 탭 B에서 새로고침 → 자동으로 로그아웃 상태 확인

**검증 항목**:
- [ ] 여러 탭에서 인증 상태가 실시간으로 동기화되는지 확인
- [ ] `onAuthStateChange` 이벤트가 올바르게 작동하는지 확인

---

## 📝 Phase 7: 문서화 및 마무리

### Step 7.1: 환경 변수 문서화
**목표**: `.env.example` 파일 생성

**파일**: `.env.example` (새 파일)

**내용**:
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**설명**:
- 실제 값 없이 환경 변수 목록만 제공
- 새 개발자가 빠르게 시작할 수 있도록

---

### Step 7.2: README 업데이트
**목표**: 인증 설정 방법 문서화

**파일**: `README.md`

**추가 내용**:
```markdown
## 인증 설정

### Supabase 프로젝트 설정
1. [Supabase Dashboard](https://app.supabase.com)에서 프로젝트 생성
2. `.env.local`에 프로젝트 URL과 Anon Key 설정
3. 마이그레이션 실행: `supabase/migrations/20260129120000_create_report_schema.sql`

### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com)에서 OAuth 클라이언트 생성
2. Supabase Dashboard → Authentication → Providers → Google에서 설정
3. Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
```

---

## 🎯 구현 우선순위

### 높은 우선순위 (필수)
1. ✅ Phase 1: 환경 설정 및 Supabase SDK 설치
2. ✅ Phase 2: Supabase 클라이언트 구현
3. ✅ Phase 3: Google OAuth 설정
4. ✅ Phase 4: 인증 로직 구현
5. ✅ Phase 5: 인증 상태 관리 및 보호된 라우트

### 중간 우선순위 (권장)
6. ✅ Phase 6: 통합 테스트 및 검증

### 낮은 우선순위 (선택사항)
7. ✅ Phase 7: 문서화 및 마무리

---

## 🔍 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Supabase SSR 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Google OAuth 설정 가이드](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Next.js App Router 문서](https://nextjs.org/docs/app)

---

## 📌 주의사항

1. **보안**: `.env.local` 파일은 절대 Git에 커밋하지 않기
2. **RLS**: 모든 테이블에 RLS가 활성화되어 있는지 확인
3. **트리거**: `handle_new_user()` 트리거가 올바르게 작동하는지 확인
4. **에러 처리**: 모든 인증 관련 에러를 사용자에게 명확하게 표시
5. **타입 안정성**: TypeScript 타입을 최대한 활용하여 런타임 에러 방지

---

**작성 완료일**: 2026-01-29  
**다음 단계**: Phase 1부터 순차적으로 구현 시작

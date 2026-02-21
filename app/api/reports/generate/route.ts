import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import type { ReportsInsert, Tables } from "@/types/database";

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

    const configRow = config as Tables<"user_configs">;

    // 소스 목록 조회
    const { data: sourcesData } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "valid");

    const sources = (sourcesData ?? []) as Tables<"sources">[];

    if (sources.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_SOURCES", message: "유효한 소스가 없습니다." } },
        { status: 400 }
      );
    }

    // 리포트 레코드 생성 (pending 상태)
    const configSnapshot = {
      keywords: configRow.keywords,
      viewpoint: configRow.viewpoint,
      schedule_cron: configRow.schedule_cron ?? undefined,
      sources: sources.map((s) => ({
        source_id: s.id,
        url: s.url,
        status: s.status as "valid" | "failed",
      })),
      metadata: {
        llm_model: process.env.LLM_PROVIDER || "gemini",
        pipeline_version: "1.0.0",
      },
    };

    const insertPayload: ReportsInsert = {
      user_id: user.id,
      status: "pending",
      config_snapshot: configSnapshot,
      started_at: new Date().toISOString(),
    };

    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert(insertPayload as never)
      .select()
      .single();

    if (reportError || !reportData) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "리포트 생성 실패" } },
        { status: 500 }
      );
    }

    const report = reportData as Tables<"reports">;

    // 백엔드 API 호출 (FastAPI /api/reports/generate)
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/reports/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_id: report.id,
          user_id: user.id,
          config: configSnapshot,
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        
        // 리포트 상태를 failed로 업데이트
        // @ts-expect-error - Supabase SSR client 타입 추론 이슈
        await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);

        return NextResponse.json(
          { 
            error: { 
              code: "BACKEND_ERROR", 
              message: errorData.detail || "백엔드 처리 실패" 
            } 
          },
          { status: 500 }
        );
      }

      const backendData = await backendResponse.json();

      return NextResponse.json({ 
        data: { 
          report_id: report.id,
          task_id: backendData.task_id,
        } 
      });
    } catch (fetchError) {
      // 네트워크 에러 등
      // @ts-expect-error - Supabase SSR client 타입 추론 이슈
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);

      return NextResponse.json(
        { 
          error: { 
            code: "BACKEND_CONNECTION_ERROR", 
            message: "백엔드 서버에 연결할 수 없습니다." 
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: String(error) } },
      { status: 500 }
    );
  }
}

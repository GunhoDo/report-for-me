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
      schedule_cron: config.schedule_cron || null,
      sources: sources.map((s) => ({
        source_id: s.id,
        url: s.url,
        status: s.status,
      })),
      metadata: {
        llm_model: process.env.LLM_PROVIDER || "gemini",
        pipeline_version: "1.0.0",
      },
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
        await supabase
          .from("reports")
          .update({ status: "failed" })
          .eq("id", report.id);

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
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", report.id);

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

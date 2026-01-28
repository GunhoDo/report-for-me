/**
 * Supabase PostgreSQL 스키마 타입.
 * supabase gen types typescript --project-id <id> 로 생성 후 병합 가능.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: { Row: unknown; Insert: unknown; Update: unknown };
      user_configs: { Row: unknown; Insert: unknown; Update: unknown };
      sources: { Row: unknown; Insert: unknown; Update: unknown };
      reports: { Row: unknown; Insert: unknown; Update: unknown };
      report_sections: { Row: unknown; Insert: unknown; Update: unknown };
      report_feedbacks: { Row: unknown; Insert: unknown; Update: unknown };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

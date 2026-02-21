/**
 * Supabase PostgreSQL 스키마 타입.
 * supabase gen types typescript --project-id <id> 로 생성 후 병합 가능.
 * 
 * 이 파일은 마이그레이션 20260129120000_create_report_schema.sql과 동기화되어야 합니다.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// ENUMS
// ============================================================================

export type ReportStatusEnum =
  | "pending"
  | "collecting"
  | "analyzing"
  | "synthesizing"
  | "completed"
  | "partial"
  | "failed";

export type SourceStatusEnum = "pending" | "valid" | "failed" | "archived";

export type SectionStatusEnum = "success" | "failed" | "skipped";

// ============================================================================
// CONFIG SNAPSHOT TYPES
// ============================================================================

export interface ConfigSnapshotSource {
  source_id: string | null;
  url: string;
  status: "valid" | "failed";
  crawled_at?: string; // ISO 8601 timestamp
}

export interface ConfigSnapshotMetadata {
  config_version?: number;
  llm_model?: string;
  pipeline_version?: string;
}

export interface ConfigSnapshot {
  keywords: string[];
  viewpoint: string;
  schedule_cron?: string;
  sources: ConfigSnapshotSource[];
  metadata?: ConfigSnapshotMetadata;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface ProfilesRow {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ProfilesInsert {
  id: string;
  email: string;
  display_name?: string | null;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfilesUpdate {
  id?: string;
  email?: string;
  display_name?: string | null;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserConfigsRow {
  id: string;
  user_id: string;
  keywords: string[];
  viewpoint: string;
  schedule_cron: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserConfigsInsert {
  id?: string;
  user_id: string;
  keywords: string[];
  viewpoint: string;
  schedule_cron?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserConfigsUpdate {
  id?: string;
  user_id?: string;
  keywords?: string[];
  viewpoint?: string;
  schedule_cron?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SourcesRow {
  id: string;
  user_id: string;
  url: string;
  status: SourceStatusEnum;
  last_checked_at: string | null;
  last_crawled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourcesInsert {
  id?: string;
  user_id: string;
  url: string;
  status?: SourceStatusEnum;
  last_checked_at?: string | null;
  last_crawled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SourcesUpdate {
  id?: string;
  user_id?: string;
  url?: string;
  status?: SourceStatusEnum;
  last_checked_at?: string | null;
  last_crawled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReportsRow {
  id: string;
  user_id: string;
  status: ReportStatusEnum;
  executive_summary: Json | null; // { bullets: string[] }
  action_item: Json | null; // { text: string, perspective?: string }
  config_snapshot: ConfigSnapshot; // JSONB
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportsInsert {
  id?: string;
  user_id: string;
  status?: ReportStatusEnum;
  executive_summary?: Json | null;
  action_item?: Json | null;
  config_snapshot: ConfigSnapshot;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReportsUpdate {
  id?: string;
  user_id?: string;
  status?: ReportStatusEnum;
  executive_summary?: Json | null;
  action_item?: Json | null;
  config_snapshot?: ConfigSnapshot;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReportSectionsRow {
  id: string;
  report_id: string;
  source_id: string | null;
  url: string;
  content: string;
  citation: string | null;
  status: SectionStatusEnum;
  error_message: string | null;
  sort_order: number;
  created_at: string;
}

export interface ReportSectionsInsert {
  id?: string;
  report_id: string;
  source_id?: string | null;
  url: string;
  content: string;
  citation?: string | null;
  status?: SectionStatusEnum;
  error_message?: string | null;
  sort_order?: number;
  created_at?: string;
}

export interface ReportSectionsUpdate {
  id?: string;
  report_id?: string;
  source_id?: string | null;
  url?: string;
  content?: string;
  citation?: string | null;
  status?: SectionStatusEnum;
  error_message?: string | null;
  sort_order?: number;
  created_at?: string;
}

export interface ReportFeedbacksRow {
  id: string;
  report_id: string;
  user_id: string;
  comment: string | null;
  rating: number | null; // 1-5
  created_at: string;
}

export interface ReportFeedbacksInsert {
  id?: string;
  report_id: string;
  user_id: string;
  comment?: string | null;
  rating?: number | null;
  created_at?: string;
}

export interface ReportFeedbacksUpdate {
  id?: string;
  report_id?: string;
  user_id?: string;
  comment?: string | null;
  rating?: number | null;
  created_at?: string;
}

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
      };
      user_configs: {
        Row: UserConfigsRow;
        Insert: UserConfigsInsert;
        Update: UserConfigsUpdate;
      };
      sources: {
        Row: SourcesRow;
        Insert: SourcesInsert;
        Update: SourcesUpdate;
      };
      reports: {
        Row: ReportsRow;
        Insert: ReportsInsert;
        Update: ReportsUpdate;
      };
      report_sections: {
        Row: ReportSectionsRow;
        Insert: ReportSectionsInsert;
        Update: ReportSectionsUpdate;
      };
      report_feedbacks: {
        Row: ReportFeedbacksRow;
        Insert: ReportFeedbacksInsert;
        Update: ReportFeedbacksUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      set_reports_completed_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      report_status_enum: ReportStatusEnum;
      source_status_enum: SourceStatusEnum;
      section_status_enum: SectionStatusEnum;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// HELPER TYPES (Supabase gen types 호환)
// ============================================================================

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

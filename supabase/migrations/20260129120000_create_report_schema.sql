-- ============================================================================
-- Report-for-Me Database Schema Migration
-- Created: 2026-01-29
-- Description: Complete schema for LLM-powered daily insight reports
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS
-- ============================================================================

-- Report execution status
CREATE TYPE report_status_enum AS ENUM (
  'pending',        -- 리포트 생성 요청됨
  'collecting',     -- 소스 데이터 수집 중
  'analyzing',      -- 개별 기사 분석 중
  'synthesizing',   -- 최종 인사이트 도출 중
  'completed',      -- 완료
  'partial',        -- 일부 소스 실패했지만 리포트 발행됨
  'failed'          -- 전체 실패
);

-- Source URL status
CREATE TYPE source_status_enum AS ENUM (
  'pending',        -- 검증 대기 중
  'valid',          -- 유효한 URL
  'failed',         -- 검증 실패 또는 크롤링 실패
  'archived'        -- 더 이상 모니터링하지 않음
);

-- Report section status (individual source analysis)
CREATE TYPE section_status_enum AS ENUM (
  'success',        -- 성공적으로 분석됨
  'failed',         -- 분석 실패
  'skipped'         -- 건너뜀
);

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 profiles
-- ----------------------------------------------------------------------------
-- User profile table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  timezone text NOT NULL DEFAULT 'Asia/Seoul',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles (1:1 with auth.users)';
COMMENT ON COLUMN public.profiles.timezone IS 'Timezone for scheduling reports (e.g., Asia/Seoul)';

-- ----------------------------------------------------------------------------
-- 3.2 user_configs
-- ----------------------------------------------------------------------------
-- User configuration for report generation (keywords, viewpoint, schedule)
CREATE TABLE IF NOT EXISTS public.user_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  keywords text[] NOT NULL DEFAULT '{}',
  viewpoint text NOT NULL,
  schedule_cron text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_configs_keywords_not_empty CHECK (array_length(keywords, 1) > 0)
);

COMMENT ON TABLE public.user_configs IS 'User configuration for report generation (1:1 per user)';
COMMENT ON COLUMN public.user_configs.keywords IS 'Array of keywords of interest (e.g., ["영업이익", "React 19"])';
COMMENT ON COLUMN public.user_configs.viewpoint IS 'Analysis perspective key (e.g., critical, investor, beginner, fact)';
COMMENT ON COLUMN public.user_configs.schedule_cron IS 'Cron expression for scheduled report generation';

-- ----------------------------------------------------------------------------
-- 3.3 sources
-- ----------------------------------------------------------------------------
-- Monitoring URLs per user
CREATE TABLE IF NOT EXISTS public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  status source_status_enum NOT NULL DEFAULT 'pending',
  last_checked_at timestamptz,
  last_crawled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sources_user_url_unique UNIQUE (user_id, url)
);

COMMENT ON TABLE public.sources IS 'Monitoring URLs per user';
COMMENT ON COLUMN public.sources.status IS 'URL validation and crawling status';
COMMENT ON COLUMN public.sources.last_checked_at IS 'Last time URL was validated';
COMMENT ON COLUMN public.sources.last_crawled_at IS 'Last time URL was successfully crawled';

-- ----------------------------------------------------------------------------
-- 3.4 reports
-- ----------------------------------------------------------------------------
-- Report execution records with LLM-generated insights
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status report_status_enum NOT NULL DEFAULT 'pending',
  
  -- LLM-generated content (JSONB for flexibility)
  executive_summary jsonb,
  action_item jsonb,
  
  -- Configuration snapshot at generation time
  config_snapshot jsonb NOT NULL,
  
  -- Execution metadata
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT reports_executive_summary_format CHECK (
    executive_summary IS NULL OR 
    (executive_summary ? 'bullets' AND jsonb_typeof(executive_summary->'bullets') = 'array')
  ),
  CONSTRAINT reports_action_item_format CHECK (
    action_item IS NULL OR 
    (action_item ? 'text' AND jsonb_typeof(action_item->'text') = 'string')
  ),
  CONSTRAINT reports_config_snapshot_format CHECK (
    config_snapshot ? 'keywords' AND 
    config_snapshot ? 'viewpoint' AND
    config_snapshot ? 'sources'
  )
);

COMMENT ON TABLE public.reports IS 'Report execution records with LLM-generated insights';
COMMENT ON COLUMN public.reports.executive_summary IS 'JSONB: { bullets: string[] } - 3-line executive summary';
COMMENT ON COLUMN public.reports.action_item IS 'JSONB: { text: string, perspective?: string } - Recommended action';
COMMENT ON COLUMN public.reports.config_snapshot IS 'JSONB: Snapshot of user_configs and sources at generation time';
COMMENT ON COLUMN public.reports.status IS 'Report generation pipeline status';

-- ----------------------------------------------------------------------------
-- 3.5 report_sections
-- ----------------------------------------------------------------------------
-- Source-wise analysis sections (URL별 분석 결과)
CREATE TABLE IF NOT EXISTS public.report_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  url text NOT NULL,
  content text NOT NULL,
  citation text,
  status section_status_enum NOT NULL DEFAULT 'success',
  error_message text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.report_sections IS 'Source-wise analysis sections per report';
COMMENT ON COLUMN public.report_sections.source_id IS 'FK to sources (NULL if source was deleted or failed)';
COMMENT ON COLUMN public.report_sections.url IS 'Actual URL analyzed (required even if source_id is NULL)';
COMMENT ON COLUMN public.report_sections.status IS 'Individual section analysis status';
COMMENT ON COLUMN public.report_sections.error_message IS 'Error message if status is failed';

-- ----------------------------------------------------------------------------
-- 3.6 report_feedbacks
-- ----------------------------------------------------------------------------
-- User feedback on reports (for Vector DB integration)
CREATE TABLE IF NOT EXISTS public.report_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.report_feedbacks IS 'User feedback on reports (intermediate storage before Vector DB)';

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- User configs
CREATE INDEX IF NOT EXISTS idx_user_configs_user_id ON public.user_configs(user_id);

-- Sources
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON public.sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_user_status ON public.sources(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sources_status ON public.sources(status) WHERE status = 'failed';

-- Reports
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_created_desc ON public.reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status) WHERE status IN ('pending', 'collecting', 'analyzing', 'synthesizing');
CREATE INDEX IF NOT EXISTS idx_reports_completed_at ON public.reports(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;

-- Reports: JSONB indexes for config_snapshot queries
CREATE INDEX IF NOT EXISTS idx_reports_config_keywords_gin ON public.reports USING GIN ((config_snapshot->'keywords'));
CREATE INDEX IF NOT EXISTS idx_reports_config_viewpoint ON public.reports(user_id, (config_snapshot->>'viewpoint'), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_config_sources_gin ON public.reports USING GIN ((config_snapshot->'sources'));

-- Reports: JSONB indexes for executive_summary and action_item
CREATE INDEX IF NOT EXISTS idx_reports_executive_summary_gin ON public.reports USING GIN (executive_summary) WHERE executive_summary IS NOT NULL;

-- Report sections
CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON public.report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_report_sort ON public.report_sections(report_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_report_sections_source_id ON public.report_sections(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_report_sections_status ON public.report_sections(report_id, status) WHERE status != 'success';

-- Report feedbacks
CREATE INDEX IF NOT EXISTS idx_report_feedbacks_report_id ON public.report_feedbacks(report_id);
CREATE INDEX IF NOT EXISTS idx_report_feedbacks_user_id ON public.report_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_report_feedbacks_rating ON public.report_feedbacks(report_id, rating) WHERE rating IS NOT NULL;

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to automatically update updated_at column';

-- Function to set completed_at when report status changes to terminal state
CREATE OR REPLACE FUNCTION public.set_reports_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'partial', 'failed') AND OLD.status NOT IN ('completed', 'partial', 'failed') THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_reports_completed_at() IS 'Trigger function to set completed_at when report reaches terminal status';

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create profile when new user signs up';

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update updated_at for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for user_configs
DROP TRIGGER IF EXISTS update_user_configs_updated_at ON public.user_configs;
CREATE TRIGGER update_user_configs_updated_at
  BEFORE UPDATE ON public.user_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for sources
DROP TRIGGER IF EXISTS update_sources_updated_at ON public.sources;
CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for reports
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set completed_at for reports
DROP TRIGGER IF EXISTS set_reports_completed_at_trigger ON public.reports;
CREATE TRIGGER set_reports_completed_at_trigger
  BEFORE UPDATE OF status ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reports_completed_at();

-- Auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_feedbacks ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7.1 profiles RLS policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 7.2 user_configs RLS policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own config" ON public.user_configs;
CREATE POLICY "Users can view own config"
  ON public.user_configs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own config" ON public.user_configs;
CREATE POLICY "Users can insert own config"
  ON public.user_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own config" ON public.user_configs;
CREATE POLICY "Users can update own config"
  ON public.user_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own config" ON public.user_configs;
CREATE POLICY "Users can delete own config"
  ON public.user_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7.3 sources RLS policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own sources" ON public.sources;
CREATE POLICY "Users can view own sources"
  ON public.sources FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sources" ON public.sources;
CREATE POLICY "Users can insert own sources"
  ON public.sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sources" ON public.sources;
CREATE POLICY "Users can update own sources"
  ON public.sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sources" ON public.sources;
CREATE POLICY "Users can delete own sources"
  ON public.sources FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7.4 reports RLS policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7.5 report_sections RLS policies
-- ----------------------------------------------------------------------------
-- Note: report_sections access is controlled via JOIN with reports
DROP POLICY IF EXISTS "Users can view own report sections" ON public.report_sections;
CREATE POLICY "Users can view own report sections"
  ON public.report_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_sections.report_id
      AND reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own report sections" ON public.report_sections;
CREATE POLICY "Users can insert own report sections"
  ON public.report_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_sections.report_id
      AND reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own report sections" ON public.report_sections;
CREATE POLICY "Users can update own report sections"
  ON public.report_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_sections.report_id
      AND reports.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_sections.report_id
      AND reports.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own report sections" ON public.report_sections;
CREATE POLICY "Users can delete own report sections"
  ON public.report_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_sections.report_id
      AND reports.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7.6 report_feedbacks RLS policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own feedbacks" ON public.report_feedbacks;
CREATE POLICY "Users can view own feedbacks"
  ON public.report_feedbacks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own feedbacks" ON public.report_feedbacks;
CREATE POLICY "Users can insert own feedbacks"
  ON public.report_feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own feedbacks" ON public.report_feedbacks;
CREATE POLICY "Users can update own feedbacks"
  ON public.report_feedbacks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feedbacks" ON public.report_feedbacks;
CREATE POLICY "Users can delete own feedbacks"
  ON public.report_feedbacks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions for future tables/sequences/functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

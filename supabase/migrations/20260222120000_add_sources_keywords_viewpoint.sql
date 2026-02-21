-- Migration: Add keywords and viewpoint to sources table
-- Description: PRD 요구사항 - 소스별 독립적인 keywords, viewpoint 설정. 기존 데이터는 빈 값으로 초기화.
-- Author: Cursor

BEGIN;
  -- Add keywords column (text[] - user input, comma-separated in UI → split to array)
  ALTER TABLE public.sources
    ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}';

  -- Add viewpoint column (text - user input, free text)
  ALTER TABLE public.sources
    ADD COLUMN IF NOT EXISTS viewpoint text NOT NULL DEFAULT '';

  COMMENT ON COLUMN public.sources.keywords IS 'Per-source keywords for analysis (user input)';
  COMMENT ON COLUMN public.sources.viewpoint IS 'Per-source analysis viewpoint (user input)';
COMMIT;

-- 만약 이 마이그레이션을 되돌려야 한다면 실행할 쿼리:
-- ALTER TABLE public.sources DROP COLUMN IF EXISTS keywords;
-- ALTER TABLE public.sources DROP COLUMN IF EXISTS viewpoint;

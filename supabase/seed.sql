-- ============================================================================
-- Report-for-Me Seed Data
-- Created: 2026-01-29
-- Description: High-quality sample data for dashboard UI testing
-- Usage: Run this file after migrations in local Supabase environment
-- ============================================================================

-- ============================================================================
-- 1. TEST USER CREATION (auth.users)
-- ============================================================================

-- Insert test user into auth.users
-- Note: Supabase requires specific fields for auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- test-user-id
  '00000000-0000-0000-0000-000000000000'::uuid,  -- instance_id (default)
  'authenticated',                                -- aud
  'authenticated',                                -- role
  'test@reportforme.com',
  crypt('testpassword123', gen_salt('bf')),      -- Encrypted password
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "테스트 사용자"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. USER PROFILE (profiles)
-- ============================================================================

INSERT INTO public.profiles (
  id,
  email,
  display_name,
  timezone,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- test-user-id
  'test@reportforme.com',
  '테스트 사용자',
  'Asia/Seoul',
  now() - INTERVAL '30 days',
  now() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. USER CONFIGURATION (user_configs)
-- ============================================================================

INSERT INTO public.user_configs (
  id,
  user_id,
  keywords,
  viewpoint,
  schedule_cron,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,  -- test-user-id
  ARRAY['생성형 AI', 'LLM 에이전트', 'NVIDIA 실적', '반도체 투자'],
  'investor',
  '0 9 * * *',  -- 매일 오전 9시
  now() - INTERVAL '25 days',
  now() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SOURCES (Monitoring URLs)
-- ============================================================================

INSERT INTO public.sources (
  id,
  user_id,
  url,
  status,
  last_checked_at,
  last_crawled_at,
  created_at,
  updated_at
) VALUES
-- Source 1: 기술 뉴스 사이트
(
  '00000000-0000-0000-0000-000000000100'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://www.theverge.com/ai',
  'valid',
  now() - INTERVAL '2 hours',
  now() - INTERVAL '2 hours',
  now() - INTERVAL '20 days',
  now() - INTERVAL '2 hours'
),
-- Source 2: 주식 시장 뉴스
(
  '00000000-0000-0000-0000-000000000101'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://www.bloomberg.com/technology',
  'valid',
  now() - INTERVAL '1 hour',
  now() - INTERVAL '1 hour',
  now() - INTERVAL '18 days',
  now() - INTERVAL '1 hour'
),
-- Source 3: AI 전문 블로그
(
  '00000000-0000-0000-0000-000000000102'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://openai.com/blog',
  'valid',
  now() - INTERVAL '3 hours',
  now() - INTERVAL '3 hours',
  now() - INTERVAL '15 days',
  now() - INTERVAL '3 hours'
),
-- Source 4: 반도체 업계 뉴스
(
  '00000000-0000-0000-0000-000000000103'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://www.anandtech.com',
  'valid',
  now() - INTERVAL '4 hours',
  now() - INTERVAL '4 hours',
  now() - INTERVAL '12 days',
  now() - INTERVAL '4 hours'
),
-- Source 5: 실패한 소스 (Case B 테스트용)
(
  '00000000-0000-0000-0000-000000000104'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://example-failed-source.com/news',
  'failed',
  now() - INTERVAL '1 day',
  NULL,
  now() - INTERVAL '10 days',
  now() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. REPORTS
-- ============================================================================

-- ============================================================================
-- Case A: 성공한 리포트 (completed)
-- ============================================================================

INSERT INTO public.reports (
  id,
  user_id,
  status,
  executive_summary,
  action_item,
  config_snapshot,
  started_at,
  completed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000001000'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'completed',
  -- executive_summary: { bullets: string[] }
  jsonb_build_object(
    'bullets', jsonb_build_array(
      'NVIDIA의 2024년 4분기 실적이 시장 기대치를 크게 상회하며, 데이터센터 부문 매출이 전년 대비 409% 증가했다.',
      '생성형 AI 에이전트 시장에서 OpenAI의 GPT-4o와 Anthropic의 Claude 3.5가 경쟁을 격화시키고 있으며, 멀티모달 기능이 핵심 차별화 포인트로 부상했다.',
      '반도체 업계 전반에 걸쳐 AI 칩 수요 급증으로 TSMC와 삼성전자 등 파운드리 기업들의 주문량이 사상 최고치를 기록했다.'
    )
  ),
  -- action_item: { text: string, perspective?: string }
  jsonb_build_object(
    'text', 'NVIDIA 주식은 단기 조정 가능성이 있으나, 장기적으로는 AI 인프라 투자 확대에 따라 상승 모멘텀이 지속될 것으로 예상됩니다. 현재 보유 포지션을 유지하되, 10% 이상 하락 시 추가 매수 기회로 활용하세요.',
    'perspective', 'investor'
  ),
  -- config_snapshot: 생성 시점의 설정 스냅샷
  jsonb_build_object(
    'keywords', jsonb_build_array('생성형 AI', 'LLM 에이전트', 'NVIDIA 실적', '반도체 투자'),
    'viewpoint', 'investor',
    'schedule_cron', '0 9 * * *',
    'sources', jsonb_build_array(
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000100'::text,
        'url', 'https://www.theverge.com/ai',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '1 day')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000101'::text,
        'url', 'https://www.bloomberg.com/technology',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '1 day')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000102'::text,
        'url', 'https://openai.com/blog',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '1 day')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000103'::text,
        'url', 'https://www.anandtech.com',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '1 day')::text
      )
    ),
    'metadata', jsonb_build_object(
      'llm_model', 'gpt-4o',
      'pipeline_version', '1.0.0',
      'config_version', 1
    )
  ),
  now() - INTERVAL '1 day' + INTERVAL '5 minutes',  -- started_at
  now() - INTERVAL '1 day' + INTERVAL '42 seconds',  -- completed_at (목표 < 45s)
  now() - INTERVAL '1 day',
  now() - INTERVAL '1 day' + INTERVAL '42 seconds'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Case B: 부분 실패 리포트 (partial)
-- ============================================================================

INSERT INTO public.reports (
  id,
  user_id,
  status,
  executive_summary,
  action_item,
  config_snapshot,
  started_at,
  completed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000001001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'partial',
  -- executive_summary: 일부 소스만 성공했지만 요약은 생성됨
  jsonb_build_object(
    'bullets', jsonb_build_array(
      'LLM 에이전트 시장에서 OpenAI와 Anthropic 간 경쟁이 심화되고 있으며, 개발자 생산성 향상에 초점을 맞춘 기능들이 주목받고 있다.',
      '생성형 AI 도입을 고려하는 기업들이 점점 늘어나고 있으며, 특히 고객 서비스와 콘텐츠 제작 분야에서 활용도가 높아지고 있다.'
    )
  ),
  -- action_item: 부분 실패를 고려한 조언
  jsonb_build_object(
    'text', '일부 소스 수집에 실패했지만, 수집된 정보를 바탕으로 AI 에이전트 시장 동향을 지속적으로 모니터링하시기 바랍니다.',
    'perspective', 'investor'
  ),
  -- config_snapshot: 실패한 소스 포함
  jsonb_build_object(
    'keywords', jsonb_build_array('생성형 AI', 'LLM 에이전트', 'NVIDIA 실적'),
    'viewpoint', 'investor',
    'schedule_cron', '0 9 * * *',
    'sources', jsonb_build_array(
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000100'::text,
        'url', 'https://www.theverge.com/ai',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '2 days')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000102'::text,
        'url', 'https://openai.com/blog',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '2 days')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000104'::text,
        'url', 'https://example-failed-source.com/news',
        'status', 'failed',
        'crawled_at', NULL
      )
    ),
    'metadata', jsonb_build_object(
      'llm_model', 'gpt-4o',
      'pipeline_version', '1.0.0',
      'config_version', 1
    )
  ),
  now() - INTERVAL '2 days' + INTERVAL '3 minutes',
  now() - INTERVAL '2 days' + INTERVAL '38 seconds',
  now() - INTERVAL '2 days',
  now() - INTERVAL '2 days' + INTERVAL '38 seconds'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Case C: 진행 중 리포트 (analyzing)
-- ============================================================================

INSERT INTO public.reports (
  id,
  user_id,
  status,
  executive_summary,
  action_item,
  config_snapshot,
  started_at,
  completed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000001002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'analyzing',
  NULL,  -- 아직 생성되지 않음
  NULL,   -- 아직 생성되지 않음
  -- config_snapshot: 생성 시점 설정은 저장됨
  jsonb_build_object(
    'keywords', jsonb_build_array('생성형 AI', 'LLM 에이전트', 'NVIDIA 실적', '반도체 투자'),
    'viewpoint', 'investor',
    'schedule_cron', '0 9 * * *',
    'sources', jsonb_build_array(
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000100'::text,
        'url', 'https://www.theverge.com/ai',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '10 minutes')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000101'::text,
        'url', 'https://www.bloomberg.com/technology',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '8 minutes')::text
      ),
      jsonb_build_object(
        'source_id', '00000000-0000-0000-0000-000000000102'::text,
        'url', 'https://openai.com/blog',
        'status', 'valid',
        'crawled_at', (now() - INTERVAL '5 minutes')::text
      )
    ),
    'metadata', jsonb_build_object(
      'llm_model', 'gpt-4o',
      'pipeline_version', '1.0.0',
      'config_version', 1
    )
  ),
  now() - INTERVAL '15 minutes',  -- started_at
  NULL,                            -- completed_at (아직 완료되지 않음)
  now() - INTERVAL '15 minutes',
  now() - INTERVAL '5 minutes'     -- updated_at (최근 업데이트)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. REPORT SECTIONS
-- ============================================================================

-- ============================================================================
-- Case A 리포트의 섹션들 (성공 케이스)
-- ============================================================================

INSERT INTO public.report_sections (
  id,
  report_id,
  source_id,
  url,
  content,
  citation,
  status,
  error_message,
  sort_order,
  created_at
) VALUES
-- Section 1: The Verge AI 뉴스
(
  '00000000-0000-0000-0000-000000010000'::uuid,
  '00000000-0000-0000-0000-000000001000'::uuid,  -- Case A 리포트
  '00000000-0000-0000-0000-000000000100'::uuid,  -- The Verge 소스
  'https://www.theverge.com/ai',
  'OpenAI가 최근 발표한 GPT-4o는 멀티모달 기능을 강화하여 텍스트, 이미지, 오디오를 통합적으로 처리할 수 있게 되었습니다. 특히 실시간 대화 기능이 개선되어 고객 서비스 분야에서의 활용도가 높아질 것으로 예상됩니다. 투자자 관점에서 보면, 이러한 기술 발전은 OpenAI의 시장 경쟁력을 강화하고 있으며, 특히 엔터프라이즈 고객 확보에 유리한 포지셔닝을 만들어가고 있습니다.',
  'The Verge, "OpenAI announces GPT-4o with enhanced multimodal capabilities", 2024-01-28',
  'success',
  NULL,
  0,
  now() - INTERVAL '1 day'
),
-- Section 2: Bloomberg Technology
(
  '00000000-0000-0000-0000-000000010001'::uuid,
  '00000000-0000-0000-0000-000000001000'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,  -- Bloomberg 소스
  'https://www.bloomberg.com/technology',
  'NVIDIA의 2024년 4분기 실적 발표에서 데이터센터 부문 매출이 전년 대비 409% 증가한 184억 달러를 기록했습니다. 이는 생성형 AI 인프라에 대한 기업들의 투자가 급증하고 있음을 보여줍니다. 특히 클라우드 서비스 제공업체들(AWS, Azure, GCP)의 대규모 GPU 구매가 주요 성장 동력이었습니다. 투자자들은 이러한 추세가 최소한 2025년 상반기까지 지속될 것으로 전망하고 있으며, NVIDIA의 주가는 실적 발표 후 장중 8% 상승했습니다.',
  'Bloomberg, "NVIDIA Q4 Earnings Beat Estimates as AI Chip Demand Soars", 2024-01-28',
  'success',
  NULL,
  1,
  now() - INTERVAL '1 day'
),
-- Section 3: OpenAI Blog
(
  '00000000-0000-0000-0000-000000010002'::uuid,
  '00000000-0000-0000-0000-000000001000'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,  -- OpenAI 소스
  'https://openai.com/blog',
  'OpenAI는 최근 발표한 연구 논문에서 LLM 에이전트가 복잡한 작업을 자율적으로 수행할 수 있는 능력이 크게 향상되었음을 보여주었습니다. 특히 코드 생성, 데이터 분석, 리서치 작업에서 인간 수준에 근접한 성능을 보이고 있습니다. 이는 개발자 생산성 향상과 자동화 가능 영역의 확대를 의미하며, 투자자들에게는 AI 에이전트 시장의 성장 가능성을 시사합니다. 다만, 이러한 기술 발전이 일자리 대체로 이어질 수 있다는 우려도 함께 제기되고 있습니다.',
  'OpenAI Blog, "Advancing AI Agents: New Capabilities and Research Directions", 2024-01-27',
  'success',
  NULL,
  2,
  now() - INTERVAL '1 day'
),
-- Section 4: AnandTech (반도체 뉴스)
(
  '00000000-0000-0000-0000-000000010003'::uuid,
  '00000000-0000-0000-0000-000000001000'::uuid,
  '00000000-0000-0000-0000-000000000103'::uuid,  -- AnandTech 소스
  'https://www.anandtech.com',
  'TSMC와 삼성전자 등 주요 파운드리 기업들이 AI 칩 수요 급증으로 인해 주문량이 사상 최고치를 기록하고 있습니다. 특히 5nm 이하 공정 노드에 대한 수요가 급증하고 있으며, NVIDIA, AMD, Apple 등 주요 고객사들의 주문이 밀려들고 있습니다. 이는 반도체 업계 전반에 걸쳐 생산 능력 확대 투자가 필요함을 의미하며, 장기적으로는 공급망 안정화와 함께 수익성 개선이 예상됩니다. 투자자들은 이러한 추세가 향후 2-3년간 지속될 것으로 보고 있으며, 파운드리 기업들의 주가도 상승세를 보이고 있습니다.',
  'AnandTech, "Foundry Orders Hit Record Highs as AI Chip Demand Surges", 2024-01-26',
  'success',
  NULL,
  3,
  now() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Case B 리포트의 섹션들 (부분 실패 케이스)
-- ============================================================================

INSERT INTO public.report_sections (
  id,
  report_id,
  source_id,
  url,
  content,
  citation,
  status,
  error_message,
  sort_order,
  created_at
) VALUES
-- Section 1: 성공한 섹션
(
  '00000000-0000-0000-0000-000000010100'::uuid,
  '00000000-0000-0000-0000-000000001001'::uuid,  -- Case B 리포트
  '00000000-0000-0000-0000-000000000100'::uuid,  -- The Verge 소스
  'https://www.theverge.com/ai',
  'LLM 에이전트 시장에서 OpenAI와 Anthropic 간의 경쟁이 심화되고 있습니다. 두 회사 모두 개발자 생산성 향상에 초점을 맞춘 새로운 기능들을 지속적으로 출시하고 있으며, 특히 코드 생성과 자동화 도구 분야에서 혁신을 이끌고 있습니다. 투자자 관점에서 보면, 이러한 경쟁은 시장 성장을 촉진하고 있으며, 엔터프라이즈 고객들의 AI 도입 속도가 가속화되고 있습니다.',
  'The Verge, "AI Agent Competition Intensifies Between OpenAI and Anthropic", 2024-01-26',
  'success',
  NULL,
  0,
  now() - INTERVAL '2 days'
),
-- Section 2: 성공한 섹션
(
  '00000000-0000-0000-0000-000000010101'::uuid,
  '00000000-0000-0000-0000-000000001001'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,  -- OpenAI 소스
  'https://openai.com/blog',
  '생성형 AI 도입을 고려하는 기업들이 점점 늘어나고 있으며, 특히 고객 서비스와 콘텐츠 제작 분야에서 활용도가 높아지고 있습니다. 최근 설문 조사에 따르면, Fortune 500 기업의 60% 이상이 향후 12개월 내 생성형 AI 도입을 계획하고 있으며, 이를 통해 운영 효율성 향상과 비용 절감을 기대하고 있습니다.',
  'OpenAI Blog, "Enterprise AI Adoption Trends: A Comprehensive Survey", 2024-01-25',
  'success',
  NULL,
  1,
  now() - INTERVAL '2 days'
),
-- Section 3: 실패한 섹션 (Case B의 핵심)
(
  '00000000-0000-0000-0000-000000010102'::uuid,
  '00000000-0000-0000-0000-000000001001'::uuid,
  '00000000-0000-0000-0000-000000000104'::uuid,  -- 실패한 소스
  'https://example-failed-source.com/news',
  '',  -- 빈 콘텐츠 (실패했으므로)
  NULL,
  'failed',
  'Connection timeout after 10 seconds. URL may be temporarily unavailable or blocked.',
  2,
  now() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. REPORT FEEDBACKS (선택사항 - 테스트용)
-- ============================================================================

INSERT INTO public.report_feedbacks (
  id,
  report_id,
  user_id,
  comment,
  rating,
  created_at
) VALUES
-- Case A 리포트에 대한 긍정적 피드백
(
  '00000000-0000-0000-0000-000000020000'::uuid,
  '00000000-0000-0000-0000-000000001000'::uuid,  -- Case A 리포트
  '00000000-0000-0000-0000-000000000001'::uuid,  -- test-user-id
  '매우 유용한 인사이트였습니다. 특히 NVIDIA 실적 분석이 투자 결정에 도움이 되었어요.',
  5,
  now() - INTERVAL '1 day' + INTERVAL '1 hour'
),
-- Case B 리포트에 대한 중립적 피드백
(
  '00000000-0000-0000-0000-000000020001'::uuid,
  '00000000-0000-0000-0000-000000001001'::uuid,  -- Case B 리포트
  '00000000-0000-0000-0000-000000000001'::uuid,
  '일부 소스 수집 실패가 아쉽지만, 수집된 정보는 유용했습니다.',
  3,
  now() - INTERVAL '2 days' + INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

-- Verify data insertion
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  config_count INTEGER;
  source_count INTEGER;
  report_count INTEGER;
  section_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO config_count FROM public.user_configs WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO source_count FROM public.sources WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO report_count FROM public.reports WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
  SELECT COUNT(*) INTO section_count FROM public.report_sections;
  
  RAISE NOTICE 'Seed data verification:';
  RAISE NOTICE '  Users: %', user_count;
  RAISE NOTICE '  Profiles: %', profile_count;
  RAISE NOTICE '  Configs: %', config_count;
  RAISE NOTICE '  Sources: %', source_count;
  RAISE NOTICE '  Reports: %', report_count;
  RAISE NOTICE '  Sections: %', section_count;
END $$;

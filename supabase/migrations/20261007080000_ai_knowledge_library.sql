CREATE TABLE IF NOT EXISTS public.ai_knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  kind TEXT NOT NULL CHECK (kind IN ('skill', 'reference')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 50000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_knowledge_sources_active_kind_idx
  ON public.ai_knowledge_sources (active, kind, updated_at DESC);

ALTER TABLE public.ai_knowledge_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin manages AI knowledge" ON public.ai_knowledge_sources;
CREATE POLICY "superadmin manages AI knowledge"
  ON public.ai_knowledge_sources
  FOR ALL
  TO authenticated
  USING (lower(auth.jwt()->>'email') = 'jaimilsonvendas@gmail.com')
  WITH CHECK (lower(auth.jwt()->>'email') = 'jaimilsonvendas@gmail.com');

REVOKE ALL ON public.ai_knowledge_sources FROM anon;
REVOKE ALL ON public.ai_knowledge_sources FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_knowledge_sources TO authenticated;
GRANT ALL ON public.ai_knowledge_sources TO service_role;

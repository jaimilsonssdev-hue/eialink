-- Migration: 20261112170000_add_gemini_prospecting_fields.sql
-- Adiciona colunas para prospecção enriquecida com Gemini + Google Maps Grounding
-- Preserva rigorosamente todas as colunas e tabelas existentes no Supabase

ALTER TABLE public.prospected_companies
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS nota_google numeric,
  ADD COLUMN IF NOT EXISTS total_avaliacoes integer,
  ADD COLUMN IF NOT EXISTS niche_slug text;

-- Cria índice opcional para consultas rápidas por nicho_slug
CREATE INDEX IF NOT EXISTS prospected_companies_niche_slug_idx 
  ON public.prospected_companies (niche_slug);

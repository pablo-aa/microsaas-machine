-- Migration: Create cache tables for metrics and costs
-- Created: 2025-01-26
-- Description: Tables to cache data from get-analytics and Google Ads API

-- =====================================================
-- Table: metrics_cache
-- Purpose: Cache responses from get-analytics edge function
-- =====================================================
CREATE TABLE IF NOT EXISTS public.metrics_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_metrics_cache_key ON public.metrics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_created ON public.metrics_cache(created_at);

-- Add comment
COMMENT ON TABLE public.metrics_cache IS 'Cache for get-analytics API responses';
COMMENT ON COLUMN public.metrics_cache.cache_key IS 'Format: endpoint_YYYY-MM-DD';
COMMENT ON COLUMN public.metrics_cache.data IS 'Full JSON response from get-analytics';

-- =====================================================
-- Table: costs_cache
-- Purpose: Cache costs from Google Ads API
-- =====================================================
CREATE TABLE IF NOT EXISTS public.costs_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  cost_reais numeric(10,2) NOT NULL,
  cost_micros bigint NOT NULL,
  source text NOT NULL DEFAULT 'google_ads',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_source CHECK (source IN ('google_ads'))
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_costs_cache_date ON public.costs_cache(date);
CREATE INDEX IF NOT EXISTS idx_costs_cache_created ON public.costs_cache(created_at);

-- Add comment
COMMENT ON TABLE public.costs_cache IS 'Cache for Google Ads costs';
COMMENT ON COLUMN public.costs_cache.date IS 'Date in YYYY-MM-DD format';
COMMENT ON COLUMN public.costs_cache.cost_reais IS 'Cost in Brazilian Reais (BRL)';
COMMENT ON COLUMN public.costs_cache.cost_micros IS 'Original cost in micros from Google Ads';
COMMENT ON COLUMN public.costs_cache.source IS 'Source of the cost data';

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costs_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access to metrics_cache"
  ON public.metrics_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to costs_cache"
  ON public.costs_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read (optional, adjust as needed)
CREATE POLICY "Authenticated users can read metrics_cache"
  ON public.metrics_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read costs_cache"
  ON public.costs_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_metrics_cache_updated_at
  BEFORE UPDATE ON public.metrics_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_costs_cache_updated_at
  BEFORE UPDATE ON public.costs_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Function: Clean old cache (optional maintenance)
-- =====================================================
CREATE OR REPLACE FUNCTION public.clean_old_cache(days_to_keep integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  DELETE FROM public.metrics_cache
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
  
  DELETE FROM public.costs_cache
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.clean_old_cache IS 'Delete cache entries older than specified days (default: 90)';



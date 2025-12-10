-- FIXED SCHEMA SCRIPT: RUN THIS IN SUPABASE SQL EDITOR
-- This will add all missing columns including 'updated_at' which is causing the sync error.

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text
);

-- 2. Add Helper Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Add Columns (using IF NOT EXISTS to be safe)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(); -- CRITICAL FIX
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS simulator_id TEXT DEFAULT '';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS simulator_name TEXT DEFAULT '';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS simulator_type TEXT DEFAULT '';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'professional';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS ratings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS handwritten_comment_url TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS audio_comment_url TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT true;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS text_comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS overall_rating NUMERIC;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS device_name TEXT;

-- Convert photos_url to JSONB if it exists differently, or add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='photos_url') THEN
        ALTER TABLE public.reviews ADD COLUMN photos_url JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 4. Enable RLS and Policies (Public Access)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.reviews;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.reviews;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.reviews;

CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.reviews FOR UPDATE USING (true);

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. DATA MIGRATION: Fix Inconsistent Simulator IDs (Legacy Numbers -> New Text IDs)
UPDATE public.reviews SET simulator_id = 'sim_super_mushshak' WHERE simulator_id = '1';
UPDATE public.reviews SET simulator_id = 'sim_enstrom_280fx' WHERE simulator_id = '2';
UPDATE public.reviews SET simulator_id = 'sim_mushshak_mfi17' WHERE simulator_id = '3';
UPDATE public.reviews SET simulator_id = 'sim_mi17' WHERE simulator_id = '4';
UPDATE public.reviews SET simulator_id = 'sim_as350' WHERE simulator_id = '5';

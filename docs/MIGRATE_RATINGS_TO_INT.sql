-- SQL Migration to Enforce Integer Ratings
-- This script rounds all decimal values in the 'ratings' JSONB column to the nearest integer.

-- 1. Create a function to round values in a JSONB object
CREATE OR REPLACE FUNCTION round_ratings(ratings jsonb)
RETURNS jsonb AS $$
DECLARE
    key text;
    value numeric;
    result jsonb := ratings;
BEGIN
    FOR key, value IN SELECT * FROM jsonb_each_text(ratings)
    LOOP
        -- Round the value and update the JSON object
        result := jsonb_set(result, ARRAY[key], to_jsonb(round(value::numeric)));
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the reviews table using the function
UPDATE public.reviews
SET ratings = round_ratings(ratings)
WHERE ratings IS NOT NULL;

-- 3. (Optional) Drop the function if you don't need it anymore
-- DROP FUNCTION round_ratings(jsonb);

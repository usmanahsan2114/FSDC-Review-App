-- Migration Script: Enforce Integer Ratings & Target 4.7 Average

-- 1. Create a function to distribute ratings for a target average of ~4.7
-- Logic: For 33 reviews, we need ~23 reviews at 5 stars and ~10 reviews at 4 stars.
-- 23 * 5 + 10 * 4 = 115 + 40 = 155. 155 / 33 = 4.6969... ~= 4.7

DO $$
DECLARE
    r RECORD;
    counter INT := 0;
    target_5_stars INT := 23; -- Adjust based on total count if needed, but fixed for 33
BEGIN
    -- Loop through all reviews ordered by ID (or random)
    FOR r IN SELECT id, ratings FROM public.reviews ORDER BY id LOOP
        counter := counter + 1;
        
        -- Update ratings JSONB
        -- We'll set all categories to either 5 or 4 based on the counter
        IF counter <= target_5_stars THEN
            -- Set all ratings to 5
            UPDATE public.reviews
            SET ratings = jsonb_build_object(
                'overallExperience', 5,
                'visualQuality', 5,
                'motionExperience', 5,
                'easeOfUse', 5,
                'safetyFeeling', 5,
                'thrillLevel', 5,
                'wouldRecommend', 5,
                'overallSatisfaction', 5,
                'cockpitRealismLayout', 5,
                'visualQualityFOV', 5,
                'controlLoadingRealism', 5,
                'motionFidelity', 5,
                'aerodynamicResponse', 5,
                'instrumentSwitchFunctionality', 5,
                'visualMotionSync', 5,
                'instructorControlTrainingFlow', 5,
                'aircraftBehaviorMatch', 5,
                'soundVibrationRealism', 5,
                'overallImmersionRealism', 5
            ),
            overall_rating = 5
            WHERE id = r.id;
        ELSE
            -- Set all ratings to 4
            UPDATE public.reviews
            SET ratings = jsonb_build_object(
                'overallExperience', 4,
                'visualQuality', 4,
                'motionExperience', 4,
                'easeOfUse', 4,
                'safetyFeeling', 4,
                'thrillLevel', 4,
                'wouldRecommend', 4,
                'overallSatisfaction', 4,
                'cockpitRealismLayout', 4,
                'visualQualityFOV', 4,
                'controlLoadingRealism', 4,
                'motionFidelity', 4,
                'aerodynamicResponse', 4,
                'instrumentSwitchFunctionality', 4,
                'visualMotionSync', 4,
                'instructorControlTrainingFlow', 4,
                'aircraftBehaviorMatch', 4,
                'soundVibrationRealism', 4,
                'overallImmersionRealism', 4
            ),
            overall_rating = 4
            WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

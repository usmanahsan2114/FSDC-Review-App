import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateRatings() {
  console.log('Starting migration: Enforce Integer Ratings & Target 4.7 Average');

  try {
    // 1. Fetch all reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('id');

    if (error) {
      throw new Error(`Error fetching reviews: ${error.message}`);
    }

    if (!reviews || reviews.length === 0) {
      console.log('No reviews found to migrate.');
      return;
    }

    console.log(`Found ${reviews.length} reviews. Processing...`);

    // 2. Logic: Target ~4.7 average.
    // For N reviews, we want roughly 70% to be 5 stars and 30% to be 4 stars.
    // 0.7 * 5 + 0.3 * 4 = 3.5 + 1.2 = 4.7
    
    const target5StarsCount = Math.ceil(reviews.length * 0.7);
    let processedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const shouldBe5Stars = i < target5StarsCount;
      const targetRating = shouldBe5Stars ? 5 : 4;

      // Construct new ratings object
      const newRatings = {
        'overallExperience': targetRating,
        'visualQuality': targetRating,
        'motionExperience': targetRating,
        'easeOfUse': targetRating,
        'safetyFeeling': targetRating,
        'thrillLevel': targetRating,
        'wouldRecommend': targetRating,
        'overallSatisfaction': targetRating,
        'cockpitRealismLayout': targetRating,
        'visualQualityFOV': targetRating,
        'controlLoadingRealism': targetRating,
        'motionFidelity': targetRating,
        'aerodynamicResponse': targetRating,
        'instrumentSwitchFunctionality': targetRating,
        'visualMotionSync': targetRating,
        'instructorControlTrainingFlow': targetRating,
        'aircraftBehaviorMatch': targetRating,
        'soundVibrationRealism': targetRating,
        'overallImmersionRealism': targetRating,
      };

      // Update the review
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          ratings: newRatings,
          overall_rating: targetRating
        })
        .eq('id', review.id);

      if (updateError) {
        console.error(`Failed to update review ${review.id}:`, updateError.message);
      } else {
        updatedCount++;
      }
      processedCount++;
    }

    console.log(`Migration completed. Successfully updated ${updatedCount} out of ${processedCount} reviews.`);

  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateRatings();

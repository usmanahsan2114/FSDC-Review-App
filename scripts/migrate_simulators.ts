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

async function migrateSimulators() {
  console.log('Starting migration: Standardize Simulator Names');

  try {
    // 1. Super Mushshak
    const { error: err1 } = await supabase
      .from('reviews')
      .update({ simulator_name: 'Super Mushshak' })
      .ilike('simulator_name', 'Super Mushshak%')
      .select('id');
    if (err1) console.error('Error updating Super Mushshak:', err1);
    else console.log(`Updated Super Mushshak records.`);

    // 2. Mi-17
    const { error: err2 } = await supabase
      .from('reviews')
      .update({ simulator_name: 'Mi-17' })
      .ilike('simulator_name', 'Mi-17%');
    if (err2) console.error('Error updating Mi-17:', err2);
    else console.log(`Updated Mi-17 records.`);

    // 3. Bell 412
    const { error: err3 } = await supabase
      .from('reviews')
      .update({ simulator_name: 'Bell 412' })
      .ilike('simulator_name', 'Bell 412%');
    if (err3) console.error('Error updating Bell 412:', err3);
    else console.log(`Updated Bell 412 records.`);

    // 4. Cessna 172
    const { error: err4 } = await supabase
      .from('reviews')
      .update({ simulator_name: 'Cessna 172' })
      .ilike('simulator_name', 'Cessna 172%');
    if (err4) console.error('Error updating Cessna 172:', err4);
    else console.log(`Updated Cessna 172 records.`);

    // 5. Hybrid Infinity System
    const { error: err5 } = await supabase
      .from('reviews')
      .update({ simulator_name: 'Hybrid Infinity System' })
      .ilike('simulator_name', 'Hybrid Infinity System%');
    if (err5) console.error('Error updating Hybrid Infinity System:', err5);
    else console.log(`Updated Hybrid Infinity System records.`);

    // 6. Generic VR Trainer -> Hybrid Infinity System
    const { error: err6 } = await supabase
      .from('reviews')
      .update({ simulator_name: 'Hybrid Infinity System' })
      .ilike('simulator_name', 'Generic VR Trainer%');
    if (err6) console.error('Error updating Generic VR Trainer:', err6);
    else console.log(`Updated Generic VR Trainer records.`);

    console.log('Migration completed.');

  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateSimulators();

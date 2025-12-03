-- SQL Migration to Standardize Simulator Names
-- Updates existing records to match the new simplified naming convention.

UPDATE public.reviews
SET simulator_name = 'Super Mushshak'
WHERE simulator_name LIKE 'Super Mushshak%';

UPDATE public.reviews
SET simulator_name = 'Mi-17'
WHERE simulator_name LIKE 'Mi-17%';

UPDATE public.reviews
SET simulator_name = 'Bell 412'
WHERE simulator_name LIKE 'Bell 412%';

UPDATE public.reviews
SET simulator_name = 'Cessna 172'
WHERE simulator_name LIKE 'Cessna 172%';

UPDATE public.reviews
SET simulator_name = 'Hybrid Infinity System'
WHERE simulator_name LIKE 'Hybrid Infinity System%';

-- Map Generic VR Trainer to Hybrid Infinity System (Standardization)
UPDATE public.reviews
SET simulator_name = 'Hybrid Infinity System'
WHERE simulator_name LIKE 'Generic VR Trainer%';

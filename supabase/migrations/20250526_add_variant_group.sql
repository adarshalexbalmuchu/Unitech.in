-- Add variant grouping columns
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS variant_group_id UUID,
  ADD COLUMN IF NOT EXISTS variant_group_label TEXT,
  ADD COLUMN IF NOT EXISTS variant_display_name TEXT;

CREATE INDEX IF NOT EXISTS idx_products_variant_group_id ON public.products (variant_group_id) WHERE variant_group_id IS NOT NULL;

-- Eco Star Power Strip (2yd / 4yd)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000001', variant_group_label = 'Cable Length'
WHERE slug IN ('eco-star-power-strip-2yrd', 'eco-star-power-strip-4yrd');

-- Royal Power Strip (2yd / 4yd)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000002', variant_group_label = 'Cable Length'
WHERE slug IN ('royal-power-strip-2yrd', 'royal-power-strip-4yrd');

-- Crown Power Strip (2yd / 4yd)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000003', variant_group_label = 'Cable Length'
WHERE slug IN ('crown-power-strip-2yrd', 'crown-power-strip-4yrd');

-- Classic Power Strip (4yd / 7yd)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000004', variant_group_label = 'Cable Length'
WHERE slug IN ('classic-power-strip-4yrd', 'classic-power-strip-7yrd');

-- Queen Power Strip (4yd / 7yd)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000005', variant_group_label = 'Cable Length'
WHERE slug IN ('queen-power-strip-4yrd', 'queen-power-strip-7yrd');

-- Gypsy Horn (2020 / 4040)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000006', variant_group_label = 'Power Output'
WHERE slug IN ('gypsy-horn-2020', 'gypsy-horn-4040');

-- Car Tape 7 (Standard / Plus / Pro)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000007', variant_group_label = 'Model'
WHERE slug IN ('7-standard-car-tape', '7-plus-car-tape', '7-pro-car-tape');

-- 12V Adaptors (1A / 1.5A / 2A / 3A / 5A)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000008', variant_group_label = 'Current'
WHERE slug IN ('12v-1a-adaptor', '12v-1-5a-adaptor', '12v-2a-adaptor', '12v-3a-adaptor', '12v-5a-adaptor');

-- 5V Adaptors (1A / 2A)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-000000000009', variant_group_label = 'Current'
WHERE slug IN ('5v-1a-adaptor', '5v-2a-adaptor');

-- 9V Adaptors (1A / 2A)
UPDATE public.products SET variant_group_id = 'a0000001-0000-0000-0000-00000000000a', variant_group_label = 'Current'
WHERE slug IN ('9v-1a-adaptor', '9v-2a-adaptor');

-- variant_display_name labels for each grouped product
UPDATE public.products SET variant_display_name = '2 Yard' WHERE slug IN ('eco-star-power-strip-2yrd', 'royal-power-strip-2yrd', 'crown-power-strip-2yrd');
UPDATE public.products SET variant_display_name = '4 Yard' WHERE slug IN ('eco-star-power-strip-4yrd', 'royal-power-strip-4yrd', 'crown-power-strip-4yrd', 'classic-power-strip-4yrd', 'queen-power-strip-4yrd');
UPDATE public.products SET variant_display_name = '7 Yard' WHERE slug IN ('classic-power-strip-7yrd', 'queen-power-strip-7yrd');
UPDATE public.products SET variant_display_name = '2020' WHERE slug = 'gypsy-horn-2020';
UPDATE public.products SET variant_display_name = '4040' WHERE slug = 'gypsy-horn-4040';
UPDATE public.products SET variant_display_name = 'Standard' WHERE slug = '7-standard-car-tape';
UPDATE public.products SET variant_display_name = 'Plus' WHERE slug = '7-plus-car-tape';
UPDATE public.products SET variant_display_name = 'Pro' WHERE slug = '7-pro-car-tape';
UPDATE public.products SET variant_display_name = '1A' WHERE slug IN ('12v-1a-adaptor', '5v-1a-adaptor', '9v-1a-adaptor');
UPDATE public.products SET variant_display_name = '1.5A' WHERE slug = '12v-1-5a-adaptor';
UPDATE public.products SET variant_display_name = '2A' WHERE slug IN ('12v-2a-adaptor', '5v-2a-adaptor', '9v-2a-adaptor');
UPDATE public.products SET variant_display_name = '3A' WHERE slug = '12v-3a-adaptor';
UPDATE public.products SET variant_display_name = '5A' WHERE slug = '12v-5a-adaptor';

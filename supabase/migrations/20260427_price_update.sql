-- =============================================================
-- Unitech Price Update — April 2026
-- price          = selling price shown on the site (Purchase Price)
-- original_price = MRP / strikethrough price shown on site
-- =============================================================
-- HOW TO APPLY: paste this entire file into the Supabase
-- SQL Editor and click Run.  Check the "rows affected" count
-- after each block to confirm matches.
-- =============================================================


-- ── 1. 3434 (MIC variants) ────────────────────────────────────
UPDATE public.products SET price = 2790, original_price = 3375
WHERE model_number ILIKE '3434'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 2890, original_price = 4375
WHERE model_number ILIKE '3434'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 2. DRAGON (MIC variants) ──────────────────────────────────
UPDATE public.products SET price = 4990, original_price = 6870
WHERE model_number ILIKE 'DRAGON'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 5990, original_price = 7870
WHERE model_number ILIKE 'DRAGON'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 3. 7474 (MIC variants) ────────────────────────────────────
UPDATE public.products SET price = 3990, original_price = 5670
WHERE model_number ILIKE '7474'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 4990, original_price = 6670
WHERE model_number ILIKE '7474'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 4. 7575 (MIC variants) ────────────────────────────────────
UPDATE public.products SET price = 4490, original_price = 6270
WHERE model_number ILIKE '7575'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 5490, original_price = 7270
WHERE model_number ILIKE '7575'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 5. 8383 (MIC variants) ────────────────────────────────────
UPDATE public.products SET price = 4690, original_price = 6450
WHERE model_number ILIKE '8383'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 4790, original_price = 7450
WHERE model_number ILIKE '8383'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 6. DHOOM (MIC variants) ───────────────────────────────────
UPDATE public.products SET price = 5990, original_price = 8670
WHERE model_number ILIKE 'DHOOM'
  AND model_number NOT ILIKE '%2%'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 6990, original_price = 9670
WHERE model_number ILIKE 'DHOOM'
  AND model_number NOT ILIKE '%2%'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 7. 8585 (MIC variants) ────────────────────────────────────
UPDATE public.products SET price = 5990, original_price = 9450
WHERE model_number ILIKE '8585'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 6990, original_price = 10450
WHERE model_number ILIKE '8585'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 8. DHOOM 2 (MIC variants) ─────────────────────────────────
UPDATE public.products SET price = 6990, original_price = 10770
WHERE model_number ILIKE 'DHOOM 2'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 7990, original_price = 11770
WHERE model_number ILIKE 'DHOOM 2'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 9. DHURANDHAR (MIC variants) ─────────────────────────────
UPDATE public.products SET price = 14990, original_price = 17970
WHERE model_number ILIKE 'DHURANDHAR'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 15990, original_price = 18970
WHERE model_number ILIKE 'DHURANDHAR'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 10. ROCK STAR (MIC variants) ─────────────────────────────
UPDATE public.products SET price = 9990, original_price = 14970
WHERE model_number ILIKE 'ROCK STAR'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 10990, original_price = 15970
WHERE model_number ILIKE 'ROCK STAR'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 11–20. Home Theatre (no MIC variants) ────────────────────
UPDATE public.products SET price = 1990, original_price = 3450  WHERE model_number ILIKE '2383';
UPDATE public.products SET price = 3490, original_price = 3870  WHERE model_number ILIKE '4383';
UPDATE public.products SET price = 3690, original_price = 4100  WHERE model_number ILIKE '4393';
UPDATE public.products SET price = 3690, original_price = 4100  WHERE model_number ILIKE '4848';
UPDATE public.products SET price = 3690, original_price = 4100  WHERE model_number ILIKE '4949';
UPDATE public.products SET price = 4790, original_price = 5300  WHERE model_number ILIKE '5151';
UPDATE public.products SET price = 5790, original_price = 6450  WHERE model_number ILIKE '6363';
UPDATE public.products SET price = 5790, original_price = 6450  WHERE model_number ILIKE '8787';
UPDATE public.products SET price = 5890, original_price = 6500  WHERE model_number ILIKE '8802';
UPDATE public.products SET price = 7990, original_price = 8970  WHERE model_number ILIKE '9494';


-- ── 21–30. Tower Speakers ─────────────────────────────────────
UPDATE public.products SET price = 1190, original_price = 1545  WHERE model_number ILIKE '1313';
UPDATE public.products SET price = 1290, original_price = 1710  WHERE model_number ILIKE '1414';
UPDATE public.products SET price = 1390, original_price = 1980  WHERE model_number ILIKE '1010';
UPDATE public.products SET price = 1390, original_price = 1980  WHERE model_number ILIKE '1515';
UPDATE public.products SET price = 1390, original_price = 1980  WHERE model_number ILIKE '1717';
UPDATE public.products SET price = 1390, original_price = 1980  WHERE model_number ILIKE '2626';
UPDATE public.products SET price = 2190, original_price = 2910  WHERE model_number ILIKE '5000';
UPDATE public.products SET price = 2590, original_price = 3150  WHERE model_number ILIKE '5500';
UPDATE public.products SET price = 2990, original_price = 3675  WHERE model_number ILIKE '8000';
UPDATE public.products SET price = 5990, original_price = 6870  WHERE model_number ILIKE '9696';


-- ── 31. 5454 ─────────────────────────────────────────────────
UPDATE public.products SET price = 3590, original_price = 4050  WHERE model_number ILIKE '5454';


-- ── 32–33. Column Speakers ───────────────────────────────────
UPDATE public.products SET price = 1490, original_price = 1690
WHERE model_number ILIKE '1525' OR name ILIKE '%1525%coloum%';

UPDATE public.products SET price = 2690, original_price = 2990
WHERE model_number ILIKE '1990' OR name ILIKE '%1990%coloum%';


-- ── 34–37. PA / Outdoor Speakers ─────────────────────────────
UPDATE public.products SET price = 690,  original_price = 1005  WHERE model_number ILIKE 'TIGER';
UPDATE public.products SET price = 790,  original_price = 1185  WHERE model_number ILIKE 'BOSS';
UPDATE public.products SET price = 1390, original_price = 1590  WHERE model_number ILIKE 'UDAAN';
UPDATE public.products SET price = 1590, original_price = 2010  WHERE model_number ILIKE 'DRONE';


-- ── 38. ECO STAR PS (power strip — matched by slug) ──────────
UPDATE public.products SET price = 190, original_price = 290
WHERE slug ILIKE '%eco-star%2yrd%' OR slug ILIKE '%eco-star%2yd%';

UPDATE public.products SET price = 290, original_price = 390
WHERE slug ILIKE '%eco-star%4yrd%' OR slug ILIKE '%eco-star%4yd%';


-- ── 39. ROYAL power strip ────────────────────────────────────
UPDATE public.products SET price = 330, original_price = 430
WHERE slug ILIKE '%royal%2yrd%' OR slug ILIKE '%royal%2yd%';

UPDATE public.products SET price = 390, original_price = 440
WHERE slug ILIKE '%royal%4yrd%' OR slug ILIKE '%royal%4yd%';


-- ── 40. CROWN power strip ────────────────────────────────────
UPDATE public.products SET price = 340, original_price = 405
WHERE slug ILIKE '%crown%2yrd%' OR slug ILIKE '%crown%2yd%';

UPDATE public.products SET price = 390, original_price = 480
WHERE slug ILIKE '%crown%4yrd%' OR slug ILIKE '%crown%4yd%';


-- ── 41. CLASSIC power strip ──────────────────────────────────
UPDATE public.products SET price = 290, original_price = 324
WHERE slug ILIKE '%classic%4yrd%' OR slug ILIKE '%classic%4yd%';

UPDATE public.products SET price = 390, original_price = 440
WHERE slug ILIKE '%classic%7yrd%' OR slug ILIKE '%classic%7yd%';


-- ── 42. QUEEN power strip ────────────────────────────────────
UPDATE public.products SET price = 340, original_price = 490
WHERE slug ILIKE '%queen%4yrd%' OR slug ILIKE '%queen%4yd%';

UPDATE public.products SET price = 390, original_price = 435
WHERE slug ILIKE '%queen%7yrd%' OR slug ILIKE '%queen%7yd%';


-- ── 43. GANG BOX DUAL USB ────────────────────────────────────
UPDATE public.products SET price = 690, original_price = 885
WHERE model_number ILIKE 'GANG BOX%' OR name ILIKE '%gang box%dual%usb%';


-- ── 44. MEGA PHONE ───────────────────────────────────────────
UPDATE public.products SET price = 790, original_price = 1035
WHERE model_number ILIKE 'MEGA PHONE' OR name ILIKE '%mega%phone%';


-- ── 45. DTH WIRE 13 MTR ──────────────────────────────────────
UPDATE public.products SET price = 140, original_price = 204
WHERE model_number ILIKE '%DTH%WIRE%13%' OR name ILIKE '%dth%wire%13%';


-- ── 46–48. Car Tapes ─────────────────────────────────────────
UPDATE public.products SET price = 190, original_price = 225  WHERE model_number ILIKE '502';
UPDATE public.products SET price = 290, original_price = 390  WHERE model_number ILIKE '602';
UPDATE public.products SET price = 390, original_price = 465  WHERE model_number ILIKE '801';


-- ── 49. BEAT ─────────────────────────────────────────────────
UPDATE public.products SET price = 990, original_price = 1275  WHERE model_number ILIKE 'BEAT';


-- ── 50. TIAGO (3-way MIC variants) ───────────────────────────
UPDATE public.products SET price = 1190, original_price = 1995
WHERE model_number ILIKE 'TIAGO'
  AND (name ILIKE '%without%mic%' OR variant_display_name ILIKE '%without%');

UPDATE public.products SET price = 1290, original_price = 2090
WHERE model_number ILIKE 'TIAGO'
  AND (name ILIKE '%wired%mic%' OR variant_display_name ILIKE '%wired%');

UPDATE public.products SET price = 1890, original_price = 2590
WHERE model_number ILIKE 'TIAGO'
  AND (name ILIKE '%wireless%mic%' OR variant_display_name ILIKE '%wireless%');


-- ── 51. Fire Trolly ──────────────────────────────────────────
UPDATE public.products SET price = 2890, original_price = 3290
WHERE model_number ILIKE 'FIRE%TROLLY' OR name ILIKE '%fire%trolly%';


-- ── 52. 12V Adaptors (matched by slug from existing migration) ──
UPDATE public.products SET price = 149, original_price = 290   WHERE slug ILIKE '%12v-1a%';
UPDATE public.products SET price = 159, original_price = 280   WHERE slug ILIKE '%12v-1-5a%' OR slug ILIKE '%12v-1.5a%';
UPDATE public.products SET price = 199, original_price = 325   WHERE slug ILIKE '%12v-2a%';
UPDATE public.products SET price = 390, original_price = 535   WHERE slug ILIKE '%12v-3a%';
UPDATE public.products SET price = 489, original_price = 640   WHERE slug ILIKE '%12v-5a%';


-- ── 53. 5V Adaptors ──────────────────────────────────────────
UPDATE public.products SET price = 139, original_price = 520   WHERE slug ILIKE '%5v-1a%';
UPDATE public.products SET price = 159, original_price = 280   WHERE slug ILIKE '%5v-2a%';


-- ── 54. 9V Adaptors ──────────────────────────────────────────
UPDATE public.products SET price = 139, original_price = 250   WHERE slug ILIKE '%9v-1a%';
UPDATE public.products SET price = 199, original_price = 325   WHERE slug ILIKE '%9v-2a%';


-- ── 55. 19V Adaptor ──────────────────────────────────────────
UPDATE public.products SET price = 590, original_price = 760
WHERE model_number ILIKE '19V%' OR name ILIKE '%19v%';


-- ── 56. BRITLITE ─────────────────────────────────────────────
UPDATE public.products SET price = 90, original_price = 290
WHERE model_number ILIKE 'BRITLITE' AND name NOT ILIKE '%auto%cut%';

UPDATE public.products SET price = 119, original_price = 390
WHERE (model_number ILIKE 'BRITLITE%' OR name ILIKE '%britlite%')
  AND name ILIKE '%auto%cut%';


-- ── 57. AGRI Auto Cut ────────────────────────────────────────
UPDATE public.products SET price = 369, original_price = 590
WHERE model_number ILIKE 'AGRI%' OR name ILIKE '%agri%auto%cut%';


-- ── 58. 102B ─────────────────────────────────────────────────
UPDATE public.products SET price = 119, original_price = 126  WHERE model_number ILIKE '102B';


-- ── 59. 003 PAIR ─────────────────────────────────────────────
UPDATE public.products SET price = 199, original_price = 225
WHERE model_number ILIKE '003%' OR name ILIKE '%003%pair%';


-- ── 60. 1008 ─────────────────────────────────────────────────
UPDATE public.products SET price = 199, original_price = 225  WHERE model_number ILIKE '1008';


-- ── 61. UT404 ────────────────────────────────────────────────
UPDATE public.products SET price = 1329, original_price = 1470  WHERE model_number ILIKE 'UT404';


-- ── 62. UT 606 ───────────────────────────────────────────────
UPDATE public.products SET price = 1759, original_price = 1950  WHERE model_number ILIKE 'UT%606';


-- ── 63. 8 INCH BASE TUBE ─────────────────────────────────────
UPDATE public.products SET price = 6079, original_price = 6750
WHERE model_number ILIKE '%8%inch%base%' OR name ILIKE '%8 inch%base%tube%';


-- ── 64. 10 INCH BASE TUBE ────────────────────────────────────
UPDATE public.products SET price = 6729, original_price = 7470
WHERE model_number ILIKE '%10%inch%base%' OR name ILIKE '%10 inch%base%tube%';


-- ── 65. 1340 ─────────────────────────────────────────────────
UPDATE public.products SET price = 990, original_price = 1395  WHERE model_number ILIKE '1340';


-- ── 66. TRACTOR USB ──────────────────────────────────────────
UPDATE public.products SET price = 1090, original_price = 1425
WHERE model_number ILIKE 'TRACTOR%USB' OR name ILIKE '%tractor%usb%';


-- ── 67. CLASS D Amplifier (wattage variants) ─────────────────
UPDATE public.products SET price = 1990, original_price = 2370
WHERE model_number ILIKE 'CLASS D'
  AND (name ILIKE '%50%50%' OR variant_display_name ILIKE '%50%50%');

UPDATE public.products SET price = 2990, original_price = 3870
WHERE model_number ILIKE 'CLASS D'
  AND (name ILIKE '%100%100%' OR variant_display_name ILIKE '%100%100%');


-- ── 68–74. Misc components ───────────────────────────────────
UPDATE public.products SET price = 129, original_price = 340  WHERE model_number ILIKE '1245';
UPDATE public.products SET price = 229, original_price = 350  WHERE model_number ILIKE '1285';
UPDATE public.products SET price = 290, original_price = 430  WHERE model_number ILIKE '2510';
UPDATE public.products SET price = 229, original_price = 475  WHERE model_number ILIKE '6025';
UPDATE public.products SET price = 390, original_price = 540  WHERE model_number ILIKE '6035';
UPDATE public.products SET price = 290, original_price = 415  WHERE model_number ILIKE '10 PRO' OR model_number ILIKE '10PRO' OR name ILIKE '%10 pro%';
UPDATE public.products SET price = 349, original_price = 475  WHERE model_number ILIKE 'UT-26DX' OR model_number ILIKE 'UT26DX';


-- ── 75. 045 DTH Stand ────────────────────────────────────────
UPDATE public.products SET price = 99, original_price = 120
WHERE model_number ILIKE '045%DTH%' OR name ILIKE '%045%dth%stand%';


-- ── 76. Gypsy Horn (matched by slug from existing migration) ──
UPDATE public.products SET price = 490, original_price = 615
WHERE slug ILIKE '%gypsy%horn%2020%' OR (model_number ILIKE 'GYPSY HORN 2020');

UPDATE public.products SET price = 790, original_price = 915
WHERE slug ILIKE '%gypsy%horn%4040%' OR (model_number ILIKE 'GYPSY HORN 4040');


-- ── 77. 2200W Infrared Cooktop ────────────────────────────────
UPDATE public.products SET price = 3290, original_price = 5300
WHERE model_number ILIKE '%2200W%' OR name ILIKE '%2200%infrared%cooktop%';


-- ── 78. Toofan Multipurpose Fan ───────────────────────────────
UPDATE public.products SET price = 1290, original_price = 2175
WHERE model_number ILIKE 'TOOFAN%' OR name ILIKE '%toofan%fan%';

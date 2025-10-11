-- Fix the foreign key reference error in categories table
ALTER TABLE public.categories DROP COLUMN canteen_id;
ALTER TABLE public.categories ADD COLUMN canteen_id UUID REFERENCES public.canteens(id);

-- Update the existing menu items and categories to link to the first canteen
-- Get the first canteen ID and assign it to existing data
UPDATE public.menu_items 
SET canteen_id = (SELECT id FROM public.canteens LIMIT 1) 
WHERE canteen_id IS NULL;

UPDATE public.categories 
SET canteen_id = (SELECT id FROM public.canteens LIMIT 1) 
WHERE canteen_id IS NULL;
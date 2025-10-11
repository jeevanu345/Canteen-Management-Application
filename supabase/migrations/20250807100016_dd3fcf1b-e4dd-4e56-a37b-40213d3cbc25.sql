-- Drop the policies that depend on the canteen_id column
DROP POLICY "Anyone can view categories from active canteens" ON public.categories;

-- Drop and recreate the canteen_id column with correct foreign key
ALTER TABLE public.categories DROP COLUMN canteen_id CASCADE;
ALTER TABLE public.categories ADD COLUMN canteen_id UUID REFERENCES public.canteens(id);

-- Recreate the policy
CREATE POLICY "Anyone can view categories from active canteens" 
ON public.categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.canteens 
  WHERE canteens.id = categories.canteen_id 
  AND canteens.is_active = true
));

-- Update existing data to link to the first canteen
UPDATE public.menu_items 
SET canteen_id = (SELECT id FROM public.canteens LIMIT 1) 
WHERE canteen_id IS NULL;

UPDATE public.categories 
SET canteen_id = (SELECT id FROM public.canteens LIMIT 1) 
WHERE canteen_id IS NULL;
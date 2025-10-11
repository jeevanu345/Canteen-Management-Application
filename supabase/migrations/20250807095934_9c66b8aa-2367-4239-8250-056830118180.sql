-- Create canteens table
CREATE TABLE public.canteens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  staff_id UUID REFERENCES public.profiles(user_id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;

-- Create policies for canteens
CREATE POLICY "Anyone can view active canteens" 
ON public.canteens 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage their own canteen" 
ON public.canteens 
FOR ALL 
USING (staff_id = auth.uid());

-- Add canteen_id to menu_items and categories
ALTER TABLE public.menu_items ADD COLUMN canteen_id UUID REFERENCES public.canteens(id);
ALTER TABLE public.categories ADD COLUMN canteen_id UUID REFERENCES public.categories(id);

-- Update existing policies to include canteen context
DROP POLICY "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items from active canteens" 
ON public.menu_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.canteens 
  WHERE canteens.id = menu_items.canteen_id 
  AND canteens.is_active = true
));

DROP POLICY "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories from active canteens" 
ON public.categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.canteens 
  WHERE canteens.id = categories.canteen_id 
  AND canteens.is_active = true
));

-- Add orders canteen context
ALTER TABLE public.orders ADD COLUMN canteen_id UUID REFERENCES public.canteens(id);

-- Add trigger for timestamp updates
CREATE TRIGGER update_canteens_updated_at
BEFORE UPDATE ON public.canteens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample canteens
INSERT INTO public.canteens (name, description, location, is_active) VALUES
('Main Canteen', 'The primary canteen serving variety of meals', 'Ground Floor, Main Building', true),
('Snacks Corner', 'Quick snacks and beverages', 'First Floor, Library Building', true),
('Cafe Express', 'Coffee and light meals', 'Second Floor, Academic Block', true);
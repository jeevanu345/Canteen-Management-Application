-- Add some sample menu items to get started
INSERT INTO public.menu_items (category_id, name, description, price, is_available) 
SELECT 
  c.id,
  items.name,
  items.description,
  items.price,
  items.is_available
FROM public.categories c
CROSS JOIN (
  VALUES 
    ('Samosa', 'Crispy triangular pastry filled with spiced potatoes', 15.00, true),
    ('Tea', 'Fresh brewed chai tea', 10.00, true),
    ('Sandwich', 'Grilled vegetable sandwich', 35.00, true),
    ('Coffee', 'Hot filter coffee', 15.00, true),
    ('Rice Meal', 'Complete rice meal with dal and vegetables', 60.00, true),
    ('Ice Cream', 'Vanilla ice cream scoop', 25.00, true)
) AS items(name, description, price, is_available)
WHERE 
  (c.name = 'Snacks' AND items.name IN ('Samosa', 'Sandwich')) OR
  (c.name = 'Beverages' AND items.name IN ('Tea', 'Coffee')) OR
  (c.name = 'Main Course' AND items.name = 'Rice Meal') OR
  (c.name = 'Desserts' AND items.name = 'Ice Cream');
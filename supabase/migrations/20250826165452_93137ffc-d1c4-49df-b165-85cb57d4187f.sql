-- Delete all related data for canteens except "Coffe Kutera"
-- First, delete menu items from other canteens
DELETE FROM menu_items WHERE canteen_id IN (
  SELECT id FROM canteens WHERE name != 'Coffe Kutera'
);

-- Delete categories from other canteens  
DELETE FROM categories WHERE canteen_id IN (
  SELECT id FROM canteens WHERE name != 'Coffe Kutera'
);

-- Finally, delete the canteens except "Coffe Kutera"
DELETE FROM canteens WHERE name != 'Coffe Kutera';
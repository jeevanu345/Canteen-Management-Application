import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MenuCard } from '@/components/menu/MenuCard';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { CanteenSelector } from '@/components/canteen/CanteenSelector';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Search, LogOut, User, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  canteen_id: string;
}

interface Canteen {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
}

const StudentDashboard = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setCanteen } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);

  useEffect(() => {
    if (selectedCanteen) {
      fetchCategoriesAndMenuItems();
    }
  }, [selectedCanteen]);

  const fetchCategoriesAndMenuItems = async () => {
    if (!selectedCanteen) return;
    
    setLoading(true);
    try {
      // Fetch categories for the selected canteen
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('canteen_id', selectedCanteen.id)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Fetch menu items for the selected canteen
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('canteen_id', selectedCanteen.id);

      if (menuItemsError) throw menuItemsError;

      setCategories(categoriesData || []);
      setMenuItems(menuItemsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCanteenSelect = (canteen: Canteen) => {
    setSelectedCanteen(canteen);
    setActiveCategory('all');
    setSearchQuery('');
    
    // Update cart context with selected canteen
    if (canteen) {
      setCanteen({ id: canteen.id, name: canteen.name });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Instant Canteen</h1>
              <Badge variant="secondary" className="ml-2">Student</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <CartSidebar />
              <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                <History className="w-4 h-4 mr-2" />
                Orders
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Canteen Selection */}
        {!selectedCanteen ? (
          <CanteenSelector
            onCanteenSelect={handleCanteenSelect}
            selectedCanteen={selectedCanteen}
          />
        ) : (
          <>
            <CanteenSelector
              onCanteenSelect={handleCanteenSelect}
              selectedCanteen={selectedCanteen}
            />

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

        {/* Categories Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Items</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMenuItems.map((item) => (
                <MenuCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image_url={item.image_url}
                  is_available={item.is_available}
                />
              ))}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMenuItems
                  .filter(item => item.category_id === category.id)
                  .map((item) => (
                    <MenuCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      image_url={item.image_url}
                      is_available={item.is_available}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

            {filteredMenuItems.length === 0 && selectedCanteen && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No menu items found</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;

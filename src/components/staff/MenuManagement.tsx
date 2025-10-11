import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { CanteenSettings } from './CanteenSettings';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category_id: string;
  categories: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface Canteen {
  id: string;
  name: string;
  description: string;
  location: string;
}

export const MenuManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0
  });

  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    is_available: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (user) {
      fetchStaffCanteen();
    }
  }, [user]);

  useEffect(() => {
    if (canteen) {
      fetchCategories();
      fetchMenuItems();
    }
  }, [canteen]);

  const fetchStaffCanteen = async () => {
    try {
      const { data, error } = await supabase
        .from('canteens')
        .select('*')
        .eq('staff_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        setCanteen(data[0]);
      } else {
        setCanteen(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your canteen",
        variant: "destructive"
      });
      setCanteen(null);
    } finally {
      // Avoid infinite loading when no canteen is found
      if (!canteen) setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('canteen_id', canteen?.id)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('canteen_id', canteen?.id)
        .order('name');

      if (error) throw error;
      setMenuItems((data || []) as MenuItem[]);
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

  const handleCreateCategory = async () => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          ...categoryForm,
          canteen_id: canteen?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully"
      });

      setCategoryForm({ name: '', description: '', display_order: 0 });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update(categoryForm)
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully"
      });

      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', display_order: 0 });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  const handleCreateMenuItem = async () => {
    try {
      // Basic validation to prevent DB errors
      if (!menuItemForm.name.trim()) {
        toast({ title: "Missing name", description: "Please enter an item name.", variant: "destructive" });
        return;
      }
      if (!menuItemForm.category_id) {
        toast({ title: "Select category", description: "Please select a category.", variant: "destructive" });
        return;
      }
      if (!menuItemForm.price || Number.isNaN(menuItemForm.price)) {
        toast({ title: "Invalid price", description: "Please enter a valid price.", variant: "destructive" });
        return;
      }

      let imageUrl: string | null = null;

      if (imageFile && user) {
        const ext = imageFile.name.split('.').pop();
        const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}`;
        const filePath = `${user.id}/${uuid}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, imageFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath);
        imageUrl = publicData.publicUrl;
      }

      const { error } = await supabase
        .from('menu_items')
        .insert({
          name: menuItemForm.name,
          description: menuItemForm.description,
          price: menuItemForm.price,
          category_id: menuItemForm.category_id || null,
          is_available: menuItemForm.is_available,
          image_url: imageUrl,
          canteen_id: canteen?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item created successfully"
      });

      setMenuItemForm({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        is_available: true
      });
      setImageFile(null);
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create menu item",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!editingItem) return;

    try {
      let newImageUrl: string | undefined;

      if (editImageFile && user) {
        const ext = editImageFile.name.split('.').pop();
        const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now()}`;
        const filePath = `${user.id}/${uuid}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, editImageFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath);
        newImageUrl = publicData.publicUrl;
      }

      const payload: any = { ...menuItemForm };
      if (newImageUrl) payload.image_url = newImageUrl;

      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item updated successfully"
      });

      setEditingItem(null);
      setEditImageFile(null);
      setMenuItemForm({
        name: '',
        description: '',
        price: 0,
        category_id: '',
        is_available: true
      });
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted successfully"
      });

      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive"
      });
    }
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  if (loading) {
    return <div className="text-center py-8">Loading menu management...</div>;
  }

  if (!canteen) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Canteen Found</h3>
          <p className="text-muted-foreground">
            You need to have a canteen associated with your account to manage menu items.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Canteen Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Canteen: {canteen.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{canteen.description}</p>
          <p className="text-sm text-muted-foreground mt-1">📍 {canteen.location}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="menu-items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="canteen-settings">Canteen Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="menu-items">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Menu Items</h3>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="item-name">Name</Label>
                      <Input
                        id="item-name"
                        value={menuItemForm.name}
                        onChange={(e) => setMenuItemForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter item name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="item-description">Description</Label>
                      <Textarea
                        id="item-description"
                        value={menuItemForm.description}
                        onChange={(e) => setMenuItemForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter item description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="item-price">Price (₹)</Label>
                      <Input
                        id="item-price"
                        type="number"
                        value={menuItemForm.price}
                        onChange={(e) => setMenuItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="item-category">Category</Label>
                      <Select 
                        value={menuItemForm.category_id}
                        onValueChange={(value) => setMenuItemForm(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger className="z-50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="z-[999999] bg-background border shadow-lg">
                          {categories.length === 0 ? (
                            <SelectItem value="no-categories" disabled>
                              No categories available - Create one first
                            </SelectItem>
                          ) : (
                            categories.map(category => (
                              <SelectItem key={category.id} value={category.id} className="cursor-pointer">
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {categories.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          You need to create categories first in the Categories tab
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="item-image">Image</Label>
                      <Input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    <Button onClick={handleCreateMenuItem} className="w-full">
                      Create Menu Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map(item => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{item.categories.name}</p>
                      </div>
                      <Badge variant={item.is_available ? "default" : "secondary"}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={`${item.name} image`}
                        className="w-full h-40 object-cover rounded mb-3"
                        loading="lazy"
                      />
                    )}
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-lg font-semibold text-primary">₹{item.price}</p>
                    
                    <div className="flex gap-2 mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingItem(item);
                              setMenuItemForm({
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                category_id: item.category_id,
                                is_available: item.is_available
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Menu Item</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-item-name">Name</Label>
                              <Input
                                id="edit-item-name"
                                value={menuItemForm.name}
                                onChange={(e) => setMenuItemForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter item name"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="edit-item-description">Description</Label>
                              <Textarea
                                id="edit-item-description"
                                value={menuItemForm.description}
                                onChange={(e) => setMenuItemForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter item description"
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-item-price">Price (₹)</Label>
                              <Input
                                id="edit-item-price"
                                type="number"
                                value={menuItemForm.price}
                                onChange={(e) => setMenuItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-item-category">Category</Label>
                              <Select 
                                value={menuItemForm.category_id}
                                onValueChange={(value) => setMenuItemForm(prev => ({ ...prev, category_id: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="edit-item-image">Image</Label>
                              <Input
                                id="edit-item-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="edit-item-available"
                                checked={menuItemForm.is_available}
                                onChange={(e) => setMenuItemForm(prev => ({ ...prev, is_available: e.target.checked }))}
                                className="rounded"
                              />
                              <Label htmlFor="edit-item-available">Available for order</Label>
                            </div>

                            <Button onClick={handleUpdateMenuItem} className="w-full">
                              Update Menu Item
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteMenuItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Categories</h3>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Name</Label>
                      <Input
                        id="category-name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category-description">Description</Label>
                      <Textarea
                        id="category-description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter category description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category-order">Display Order</Label>
                      <Input
                        id="category-order"
                        type="number"
                        value={categoryForm.display_order}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>

                    <Button onClick={handleCreateCategory} className="w-full">
                      Create Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <Badge variant="outline">Order: {category.display_order}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingCategory(category);
                            setCategoryForm({
                              name: category.name,
                              description: category.description,
                              display_order: category.display_order
                            });
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-category-name">Name</Label>
                            <Input
                              id="edit-category-name"
                              value={categoryForm.name}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter category name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-category-description">Description</Label>
                            <Textarea
                              id="edit-category-description"
                              value={categoryForm.description}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Enter category description"
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-category-order">Display Order</Label>
                            <Input
                              id="edit-category-order"
                              type="number"
                              value={categoryForm.display_order}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                              placeholder="0"
                            />
                          </div>

                          <Button onClick={handleUpdateCategory} className="w-full">
                            Update Category
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Canteen Settings Tab */}
        <TabsContent value="canteen-settings" className="space-y-6">
          <CanteenSettings canteen={canteen} onUpdate={fetchStaffCanteen} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
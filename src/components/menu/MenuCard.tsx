import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface MenuItemProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

export const MenuCard: React.FC<MenuItemProps> = ({
  id,
  name,
  description,
  price,
  image_url,
  is_available
}) => {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(item => item.id === id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addItem({ id, name, price, image_url });
  };

  const handleIncrement = () => {
    updateQuantity(id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(id, quantity - 1);
  };

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${!is_available ? 'opacity-60' : ''}`}>
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={image_url || '/placeholder.svg'}
            alt={name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 right-2">
            <Badge variant={is_available ? "default" : "destructive"}>
              {is_available ? "Available" : "Sold Out"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mb-3">{description}</p>
        )}
        <p className="text-xl font-bold text-primary">₹{price.toFixed(2)}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {!is_available ? (
          <Button disabled className="w-full">
            Out of Stock
          </Button>
        ) : quantity === 0 ? (
          <Button onClick={handleAddToCart} className="w-full">
            Add to Cart
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecrement}
              className="w-10 h-10"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-lg">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleIncrement}
              className="w-10 h-10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
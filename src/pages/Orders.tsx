import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  total_amount: number;
  special_instructions: string;
  status: string;
  staff_notes: string;
  created_at: string;
  order_items: {
    quantity: number;
    price_at_time: number;
    menu_items: {
      name: string;
    };
  }[];
}

const statusConfig = {
  payment_pending_verification: {
    label: 'Payment Verification',
    icon: Clock,
    color: 'warning',
    description: 'We are verifying your payment'
  },
  order_confirmed: {
    label: 'Order Confirmed',
    icon: CheckCircle,
    color: 'success',
    description: 'Your order has been confirmed'
  },
  in_preparation: {
    label: 'In Preparation',
    icon: Package,
    color: 'default',
    description: 'Your order is being prepared'
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    icon: CheckCircle,
    color: 'success',
    description: 'Your order is ready!'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'secondary',
    description: 'Order completed'
  },
  rejected: {
    label: 'Rejected',
    icon: AlertCircle,
    color: 'destructive',
    description: 'Payment verification failed'
  }
};

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price_at_time,
            menu_items (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/student')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">Track your order status</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
              <Button onClick={() => navigate('/student')}>Browse Menu</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status?.icon || Clock;
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(-8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Badge variant={status?.color as any} className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {status?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm">{status?.description}</span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Items Ordered:</h4>
                      <div className="space-y-1">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.menu_items.name} × {item.quantity}</span>
                            <span>₹{(item.price_at_time * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {order.special_instructions && (
                      <div>
                        <h4 className="font-semibold mb-1">Special Instructions:</h4>
                        <p className="text-sm text-muted-foreground">{order.special_instructions}</p>
                      </div>
                    )}
                    
                    {order.staff_notes && (
                      <div>
                        <h4 className="font-semibold mb-1">Staff Notes:</h4>
                        <p className="text-sm text-muted-foreground">{order.staff_notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold text-primary">
                        ₹{order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
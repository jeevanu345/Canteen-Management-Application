import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MenuManagement } from '@/components/staff/MenuManagement';
import { 
  ClipboardList, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  LogOut,
  RefreshCw,
  ChefHat
} from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  special_instructions: string;
  status: 'payment_pending_verification' | 'order_confirmed' | 'in_preparation' | 'ready_for_pickup' | 'completed' | 'rejected';
  staff_notes: string;
  created_at: string;
  payment_screenshot_url: string;
  profiles: {
    full_name: string;
    mobile_number: string;
    student_id: string;
  } | null;
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
    label: 'Pending Verification',
    color: 'warning',
    description: 'Payment needs verification'
  },
  order_confirmed: {
    label: 'Confirmed',
    color: 'success',
    description: 'Order confirmed'
  },
  in_preparation: {
    label: 'In Preparation',
    color: 'default',
    description: 'Being prepared'
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    color: 'success',
    description: 'Ready for collection'
  },
  completed: {
    label: 'Completed',
    color: 'secondary',
    description: 'Order completed'
  },
  rejected: {
    label: 'Rejected',
    color: 'destructive',
    description: 'Payment rejected'
  }
};

const StaffDashboard = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [newStatus, setNewStatus] = useState<Order['status']>('payment_pending_verification');
  const [staffCanteen, setStaffCanteen] = useState<any>(null);
  const [createCanteenOpen, setCreateCanteenOpen] = useState(false);
  const [canteenForm, setCanteenForm] = useState({ name: '', description: '', location: '' });

  useEffect(() => {
    if (user) {
      fetchStaffCanteen();
    }
  }, [user]);

  useEffect(() => {
    if (staffCanteen) {
      fetchOrders();
      
      // Set up real-time subscription for orders
      const channel = supabase
        .channel('orders-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders' 
          }, 
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [staffCanteen]);

  const fetchStaffCanteen = async () => {
    try {
      const { data, error } = await supabase
        .from('canteens')
        .select('*')
        .eq('staff_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      
      // If multiple canteens, take the first active one
      if (data && data.length > 0) {
        setStaffCanteen(data[0]);
      } else {
        setStaffCanteen(null);
      }
    } catch (error: any) {
      console.error('Error fetching staff canteen:', error);
      setStaffCanteen(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanteen = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('canteens')
        .insert({
          name: canteenForm.name,
          description: canteenForm.description,
          location: canteenForm.location,
          staff_id: user.id,
          is_active: true
        })
        .select('*')
        .single();

      if (error) throw error;

      setStaffCanteen(data);
      setCreateCanteenOpen(false);
      setCanteenForm({ name: '', description: '', location: '' });
      toast({ title: 'Canteen created', description: 'Your canteen is ready.' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to create canteen', variant: 'destructive' });
    }
  };

  const fetchOrders = async () => {
    if (!staffCanteen) return;

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
        .eq('canteen_id', staffCanteen.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles separately (no direct FK between orders and profiles)
      const userIds = Array.from(new Set((data || []).map((o: any) => o.user_id).filter(Boolean)));
      let profilesMap: Record<string, { full_name: string; mobile_number: string; student_id: string } | null> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, mobile_number, student_id')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Failed to fetch profiles for orders', profilesError);
        } else {
          profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
            acc[p.user_id] = { full_name: p.full_name, mobile_number: p.mobile_number, student_id: p.student_id };
            return acc;
          }, {} as Record<string, { full_name: string; mobile_number: string; student_id: string } | null>);
        }
      }

      const ordersWithProfiles = (data || []).map((o: any) => ({
        ...o,
        profiles: o.user_id ? profilesMap[o.user_id] || null : null,
      }));

      setOrders(ordersWithProfiles as Order[]);
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

  const updateOrderStatus = async (orderId: string, status: Order['status'], notes?: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          staff_notes: notes || null
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status updated to ${statusConfig[status as keyof typeof statusConfig]?.label}`
      });

      fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const handleConfirmOrder = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'order_confirmed', staffNotes);
    }
  };

  const handleRejectOrder = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'rejected', staffNotes);
    }
  };

  const handleStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      updateOrderStatus(selectedOrder.id, newStatus, staffNotes);
    }
  };

  const getPaymentScreenshotUrl = (path: string) => {
    const { data } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
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
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Staff Dashboard</h1>
              <Badge variant="secondary">Staff Portal</Badge>
              {staffCanteen && (
                <Badge variant="outline">{staffCanteen.name}</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
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
        {!staffCanteen ? (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Canteen Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your canteen now to start managing your menu and orders.
              </p>
              <Dialog open={createCanteenOpen} onOpenChange={setCreateCanteenOpen}>
                <DialogTrigger asChild>
                  <Button>Create Canteen</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Canteen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-left">
                    <div>
                      <Label htmlFor="canteen-name">Name</Label>
                      <Input
                        id="canteen-name"
                        value={canteenForm.name}
                        onChange={(e) => setCanteenForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Main Campus Canteen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="canteen-location">Location</Label>
                      <Input
                        id="canteen-location"
                        value={canteenForm.location}
                        onChange={(e) => setCanteenForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g. Block A, Ground Floor"
                      />
                    </div>
                    <div>
                      <Label htmlFor="canteen-description">Description</Label>
                      <Textarea
                        id="canteen-description"
                        value={canteenForm.description}
                        onChange={(e) => setCanteenForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Short description of your canteen"
                      />
                    </div>
                    <Button onClick={handleCreateCanteen} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="menu">Menu Management</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                  <TabsTrigger value="payment_pending_verification">Pending</TabsTrigger>
                  <TabsTrigger value="order_confirmed">Confirmed</TabsTrigger>
                  <TabsTrigger value="in_preparation">Preparing</TabsTrigger>
                  <TabsTrigger value="ready_for_pickup">Ready</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                {['all', 'payment_pending_verification', 'order_confirmed', 'in_preparation', 'ready_for_pickup', 'completed'].map((status) => (
                  <TabsContent key={status} value={status} className="space-y-4">
                    {filterOrdersByStatus(status).length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Orders</h3>
                          <p className="text-muted-foreground">No orders found for this status</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filterOrdersByStatus(status).map((order) => {
                        const orderStatus = statusConfig[order.status as keyof typeof statusConfig];
                        
                        return (
                          <Card key={order.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    Order #{order.id.slice(-8)}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {order.profiles?.full_name} 
                                    {order.profiles?.student_id && ` (${order.profiles.student_id})`}
                                  </p>
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
                                <div className="flex items-center gap-2">
                                  <Badge variant={orderStatus?.color as any}>
                                    {orderStatus?.label}
                                  </Badge>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setStaffNotes(order.staff_notes || '');
                                          setNewStatus(order.status);
                                        }}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Order Details #{order.id.slice(-8)}</DialogTitle>
                                      </DialogHeader>
                                      
                                      <div className="space-y-6">
                                        {/* ... keep existing code (customer info, order items, etc.) */}
                                        {/* Customer Info */}
                                        <div>
                                          <h4 className="font-semibold mb-2">Customer Information</h4>
                                          <div className="space-y-1 text-sm">
                                            <p><strong>Name:</strong> {order.profiles?.full_name}</p>
                                            {order.profiles?.student_id && (
                                              <p><strong>Student ID:</strong> {order.profiles.student_id}</p>
                                            )}
                                            {order.profiles?.mobile_number && (
                                              <p><strong>Mobile:</strong> {order.profiles.mobile_number}</p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Order Items */}
                                        <div>
                                          <h4 className="font-semibold mb-2">Order Items</h4>
                                          <div className="space-y-2">
                                            {order.order_items.map((item, index) => (
                                              <div key={index} className="flex justify-between text-sm p-2 bg-muted rounded">
                                                <span>{item.menu_items.name} × {item.quantity}</span>
                                                <span>₹{(item.price_at_time * item.quantity).toFixed(2)}</span>
                                              </div>
                                            ))}
                                            <div className="flex justify-between font-semibold pt-2 border-t">
                                              <span>Total:</span>
                                              <span>₹{order.total_amount.toFixed(2)}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Special Instructions */}
                                        {order.special_instructions && (
                                          <div>
                                            <h4 className="font-semibold mb-2">Special Instructions</h4>
                                            <p className="text-sm bg-muted p-2 rounded">{order.special_instructions}</p>
                                          </div>
                                        )}

                                         {/* Payment Screenshot */}
                                         {order.payment_screenshot_url && (
                                           <div>
                                             <h4 className="font-semibold mb-2">Payment Screenshot</h4>
                                             <Dialog>
                                               <DialogTrigger asChild>
                                                 <img 
                                                   src={getPaymentScreenshotUrl(order.payment_screenshot_url)}
                                                   alt="Payment Screenshot"
                                                   className="max-w-full h-auto rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                                 />
                                               </DialogTrigger>
                                               <DialogContent className="max-w-4xl">
                                                 <DialogHeader>
                                                   <DialogTitle>Payment Screenshot</DialogTitle>
                                                 </DialogHeader>
                                                 <div className="flex justify-center">
                                                   <img 
                                                     src={getPaymentScreenshotUrl(order.payment_screenshot_url)}
                                                     alt="Payment Screenshot"
                                                     className="max-w-full max-h-[80vh] object-contain rounded"
                                                   />
                                                 </div>
                                               </DialogContent>
                                             </Dialog>
                                           </div>
                                         )}

                                        {/* Staff Notes */}
                                        <div>
                                          <Label htmlFor="staff-notes">Staff Notes</Label>
                                          <Textarea
                                            id="staff-notes"
                                            value={staffNotes}
                                            onChange={(e) => setStaffNotes(e.target.value)}
                                            placeholder="Add notes for this order..."
                                          />
                                        </div>

                                        {/* Status Update */}
                                        <div>
                                          <Label htmlFor="order-status">Update Status</Label>
                                          <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Order['status'])}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="payment_pending_verification">Pending Verification</SelectItem>
                                              <SelectItem value="order_confirmed">Order Confirmed</SelectItem>
                                              <SelectItem value="in_preparation">In Preparation</SelectItem>
                                              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                                              <SelectItem value="completed">Completed</SelectItem>
                                              <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                          {order.status === 'payment_pending_verification' ? (
                                            <>
                                              <Button onClick={handleConfirmOrder} className="flex-1">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Confirm Order
                                              </Button>
                                              <Button onClick={handleRejectOrder} variant="destructive" className="flex-1">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject Order
                                              </Button>
                                            </>
                                          ) : (
                                            <Button onClick={handleStatusUpdate} className="flex-1">
                                              Update Status
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Items: {order.order_items.length}</span>
                                  <span className="font-semibold">₹{order.total_amount.toFixed(2)}</span>
                                </div>
                                {order.special_instructions && (
                                  <p className="text-sm text-muted-foreground italic">
                                    "{order.special_instructions}"
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            <TabsContent value="menu">
              <MenuManagement />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
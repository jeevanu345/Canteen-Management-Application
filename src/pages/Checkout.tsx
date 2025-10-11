import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Upload, CreditCard } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const { items, specialInstructions, setSpecialInstructions, getTotalPrice, clearCart, canteen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [canteenQrCode, setCanteenQrCode] = useState<string | null>(null);
  
  const totalPrice = getTotalPrice();

  // Fetch canteen QR code when component mounts
  React.useEffect(() => {
    const fetchCanteenQrCode = async () => {
      if (canteen?.id) {
        try {
          const { data, error } = await supabase
            .from('canteens')
            .select('upi_qr_url')
            .eq('id', canteen.id)
            .single();

          if (error) throw error;
          setCanteenQrCode(data?.upi_qr_url || null);
        } catch (error) {
          console.error('Failed to fetch canteen QR code:', error);
        }
      }
    };

    fetchCanteenQrCode();
  }, [canteen?.id]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setPaymentScreenshot(file);
    }
  };

  const uploadScreenshot = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, file);

      if (error) throw error;
      
      return fileName;
    } catch (error: any) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentScreenshot) {
      toast({
        title: "Payment Screenshot Required",
        description: "Please upload your payment confirmation screenshot",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingOrder(true);
    
    try {
      // Upload screenshot
      const screenshotPath = await uploadScreenshot(paymentScreenshot);
      if (!screenshotPath) {
        throw new Error('Failed to upload screenshot');
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          total_amount: totalPrice,
          special_instructions: specialInstructions || null,
          payment_screenshot_url: screenshotPath,
          canteen_id: canteen?.id,
          status: 'payment_pending_verification'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart and navigate
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: "Your order is being verified. You'll be notified once confirmed."
      });
      
      navigate('/orders');
      
    } catch (error: any) {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate('/student')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>
        </div>
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              {canteen && (
                <p className="text-sm text-muted-foreground">
                  Ordering from: <span className="font-medium">{canteen.name}</span>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ₹{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="special-instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="special-instructions"
                  placeholder="Any special requests for your order..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold mb-4">Scan QR Code to Pay</h3>
                <div className="bg-muted p-6 rounded-lg inline-block">
                  {canteenQrCode ? (
                    <img 
                      src={canteenQrCode} 
                      alt="UPI QR Code" 
                      className="w-48 h-48 mx-auto bg-white border object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-white border flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">QR Code not available</p>
                        <p className="text-xs mt-1">Contact canteen staff</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Use any UPI app (Google Pay, PhonePe, Paytm) to scan and pay
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  Amount: ₹{totalPrice.toFixed(2)}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label htmlFor="payment-screenshot">
                  Upload Payment Confirmation Screenshot *
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <Input
                    id="payment-screenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="payment-screenshot"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {paymentScreenshot ? paymentScreenshot.name : "Click to upload screenshot"}
                    </span>
                  </Label>
                </div>
                
                {paymentScreenshot && (
                  <div className="p-2 bg-success/10 border border-success/20 rounded text-sm text-success-foreground">
                    Screenshot uploaded successfully!
                  </div>
                )}
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={!paymentScreenshot || isPlacingOrder}
                className="w-full"
                size="lg"
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Your order will be confirmed after payment verification
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
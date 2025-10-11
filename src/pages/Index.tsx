import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Users, Settings, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      setUserProfile(data);
      
      // Auto-redirect based on role
      if (data?.role === 'student') {
        navigate('/student');
      } else if (data?.role === 'staff') {
        navigate('/staff');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <ChefHat className="w-16 h-16 text-primary mr-4" />
              <h1 className="text-5xl font-bold text-primary">Instant Canteen</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Order delicious meals from your canteen with ease. Skip the queues, 
              track your orders.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Fresh & Delicious</CardTitle>
                <CardDescription>
                  Freshly prepared meals with quality ingredients from our canteen kitchen
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Easy Ordering</CardTitle>
                <CardDescription>
                  Browse menu, add to cart, and place orders in just a few clicks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Order Tracking</CardTitle>
                <CardDescription>
                  Real-time updates on your order status from preparation to pickup
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Ready to Order?</CardTitle>
                <CardDescription>
                  Sign in to start ordering from our delicious menu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full" 
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but profile is still loading
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Setting up your profile...</div>
      </div>
    );
  }

  // Fallback UI (shouldn't normally reach here due to auto-redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome, {userProfile.full_name}!</h1>
        <div className="space-x-4">
          {userProfile.role === 'student' && (
            <Button onClick={() => navigate('/student')}>Go to Student Portal</Button>
          )}
          {userProfile.role === 'staff' && (
            <Button onClick={() => navigate('/staff')}>Go to Staff Dashboard</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

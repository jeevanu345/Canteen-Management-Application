import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Users, GraduationCap } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Sign In form state
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  // Sign Up form state
  const [signUpForm, setSignUpForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    mobileNumber: '',
    canteenName: '',
    canteenDescription: '',
    canteenLocation: ''
  });

  // Handle role-based redirect
  useEffect(() => {
    if (user) {
      const redirectUser = async () => {
        const profile = await getUserProfile();
        if (profile?.role === 'staff') {
          navigate('/staff', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      };
      redirectUser();
    }
  }, [user, getUserProfile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInForm.email, signInForm.password);
    if (!error) {
      // Role-based redirect will be handled by useEffect
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (signUpForm.role === 'staff' && (!signUpForm.canteenName || !signUpForm.canteenLocation)) {
      toast({
        title: "Missing Information",
        description: "Canteen name and location are required for staff accounts",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const metadata = {
      full_name: signUpForm.fullName,
      role: signUpForm.role,
      student_id: signUpForm.studentId,
      phone: signUpForm.mobileNumber,
      canteen_name: signUpForm.canteenName,
      canteen_description: signUpForm.canteenDescription,
      canteen_location: signUpForm.canteenLocation
    };

    const { error } = await signUp(signUpForm.email, signUpForm.password, metadata);
    if (!error) {
      // Reset form
      setSignUpForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        studentId: '',
        mobileNumber: '',
        canteenName: '',
        canteenDescription: '',
        canteenLocation: ''
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-12 h-12 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-primary">Instant Canteen</h1>
          </div>
          <p className="text-muted-foreground">Order delicious meals with ease</p>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your account to start ordering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join our canteen community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="Enter your full name"
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select 
                      value={signUpForm.role} 
                      onValueChange={(value) => setSignUpForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {signUpForm.role === 'student' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-student-id">Student ID</Label>
                      <Input
                        id="signup-student-id"
                        placeholder="Enter your student ID"
                        value={signUpForm.studentId}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, studentId: e.target.value }))}
                      />
                    </div>
                  )}

                  {signUpForm.role === 'staff' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-canteen-name">Canteen Name *</Label>
                        <Input
                          id="signup-canteen-name"
                          placeholder="Enter your canteen name"
                          value={signUpForm.canteenName}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, canteenName: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-canteen-description">Canteen Description</Label>
                        <Input
                          id="signup-canteen-description"
                          placeholder="Brief description of your canteen"
                          value={signUpForm.canteenDescription}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, canteenDescription: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-canteen-location">Canteen Location *</Label>
                        <Input
                          id="signup-canteen-location"
                          placeholder="Physical location of your canteen"
                          value={signUpForm.canteenLocation}
                          onChange={(e) => setSignUpForm(prev => ({ ...prev, canteenLocation: e.target.value }))}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-mobile">Mobile Number</Label>
                    <Input
                      id="signup-mobile"
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={signUpForm.mobileNumber}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>By signing up, you agree to our terms and conditions</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

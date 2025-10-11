import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, ChefHat } from 'lucide-react';

interface Canteen {
  id: string;
  name: string;
  description: string;
  location: string;
  is_active: boolean;
}

interface CanteenSelectorProps {
  onCanteenSelect: (canteen: Canteen) => void;
  selectedCanteen: Canteen | null;
}

export const CanteenSelector: React.FC<CanteenSelectorProps> = ({
  onCanteenSelect,
  selectedCanteen
}) => {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCanteens();

    const channel = supabase
      .channel('canteens-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canteens' },
        () => fetchCanteens()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCanteens = async () => {
    try {
      const { data, error } = await supabase
        .from('canteens')
        .select('*')
        .eq('is_active', true)
        .not('staff_id', 'is', null)
        .order('name');

      if (error) throw error;

      setCanteens(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load canteens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading canteens...</div>
      </div>
    );
  }

  if (selectedCanteen) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Selected Canteen</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCanteenSelect(null as any)}
            >
              Change
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{selectedCanteen.name}</h3>
            {selectedCanteen.description && (
              <p className="text-muted-foreground">{selectedCanteen.description}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {selectedCanteen.location}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <ChefHat className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Select a Canteen</h2>
        <p className="text-muted-foreground">
          Choose a canteen to view its menu and place orders
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canteens.map((canteen) => (
          <Card
            key={canteen.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onCanteenSelect(canteen)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {canteen.name}
                <Badge variant="secondary">Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {canteen.description && (
                  <p className="text-muted-foreground">{canteen.description}</p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {canteen.location}
                </div>
                <Button className="w-full">
                  View Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {canteens.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Canteens Available</h3>
            <p className="text-muted-foreground">
              No active canteens found. Please check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
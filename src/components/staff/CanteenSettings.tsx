import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Upload, QrCode, Settings } from 'lucide-react';

interface Canteen {
  id: string;
  name: string;
  description: string;
  location: string;
  upi_qr_url?: string;
}

interface CanteenSettingsProps {
  canteen: Canteen;
  onUpdate: () => void;
}

export const CanteenSettings: React.FC<CanteenSettingsProps> = ({ canteen, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [canteenForm, setCanteenForm] = useState({
    name: canteen.name,
    description: canteen.description,
    location: canteen.location
  });

  const handleQrUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setQrFile(file);
    }
  };

  const uploadQrCode = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/qr-code.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('canteen-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;
      
      // Get public URL
      const { data: publicData } = supabase.storage
        .from('canteen-assets')
        .getPublicUrl(fileName);
      
      return publicData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleUpdateCanteen = async () => {
    setLoading(true);
    try {
      let qrUrl = canteen.upi_qr_url;

      // Upload new QR code if provided
      if (qrFile) {
        const uploadedUrl = await uploadQrCode(qrFile);
        if (!uploadedUrl) {
          throw new Error('Failed to upload QR code');
        }
        qrUrl = uploadedUrl;
      }

      // Update canteen details
      const { error } = await supabase
        .from('canteens')
        .update({
          name: canteenForm.name,
          description: canteenForm.description,
          location: canteenForm.location,
          upi_qr_url: qrUrl
        })
        .eq('id', canteen.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Canteen settings updated successfully"
      });

      setQrFile(null);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update canteen settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Canteen Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="canteen-name">Canteen Name</Label>
            <Input
              id="canteen-name"
              value={canteenForm.name}
              onChange={(e) => setCanteenForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter canteen name"
            />
          </div>
          
          <div>
            <Label htmlFor="canteen-location">Location</Label>
            <Input
              id="canteen-location"
              value={canteenForm.location}
              onChange={(e) => setCanteenForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter canteen location"
            />
          </div>
          
          <div>
            <Label htmlFor="canteen-description">Description</Label>
            <Textarea
              id="canteen-description"
              value={canteenForm.description}
              onChange={(e) => setCanteenForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter canteen description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            UPI QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your UPI QR code that students will use for payments
          </p>
          
          {canteen.upi_qr_url && (
            <div>
              <Label>Current QR Code</Label>
              <div className="mt-2">
                <img 
                  src={canteen.upi_qr_url} 
                  alt="Current UPI QR Code" 
                  className="w-48 h-48 border rounded object-contain bg-white"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="qr-upload">
              {canteen.upi_qr_url ? 'Update QR Code' : 'Upload QR Code'}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <Input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="hidden"
              />
              <Label
                htmlFor="qr-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {qrFile ? qrFile.name : "Click to upload QR code image"}
                </span>
              </Label>
            </div>
            
            {qrFile && (
              <div className="p-2 bg-success/10 border border-success/20 rounded text-sm text-success-foreground">
                QR code ready to upload!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleUpdateCanteen}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Updating...' : 'Update Canteen Settings'}
      </Button>
    </div>
  );
};
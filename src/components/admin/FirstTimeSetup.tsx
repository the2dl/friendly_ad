import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { setupAdmin } from '@/lib/api';

interface FirstTimeSetupProps {
  onSetupComplete: (key: string) => void;
}

export function FirstTimeSetup({ onSetupComplete }: FirstTimeSetupProps) {
  const [adminKey, setAdminKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminKey !== confirmKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Keys do not match",
      });
      return;
    }

    try {
      await setupAdmin(adminKey);
      toast({
        title: "Success",
        description: "Admin key set successfully",
      });
      onSetupComplete(adminKey);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set admin key",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">First Time Setup</CardTitle>
        <CardDescription>
          Create an admin key to manage your domain configurations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Create Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="h-12"
              required
            />
            <Input
              type="password"
              placeholder="Confirm Admin Key"
              value={confirmKey}
              onChange={(e) => setConfirmKey(e.target.value)}
              className="h-12"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12">
            Set Admin Key
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
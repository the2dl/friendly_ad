import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>First Time Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Create Admin Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm Admin Key"
            value={confirmKey}
            onChange={(e) => setConfirmKey(e.target.value)}
            required
          />
          <Button type="submit">Set Admin Key</Button>
        </form>
      </CardContent>
    </Card>
  );
} 
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface AdminAuthProps {
  onAuth: (key: string) => void;
}

export function AdminAuth({ onAuth }: AdminAuthProps) {
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth(adminKey);
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Admin Authentication</CardTitle>
        <CardDescription>
          Enter your admin key to access domain configuration settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="h-12"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12">
            Access Admin Panel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
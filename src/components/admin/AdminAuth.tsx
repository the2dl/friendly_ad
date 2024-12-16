import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Admin Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter Admin Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            required
          />
          <Button type="submit">Access Admin Panel</Button>
        </form>
      </CardContent>
    </Card>
  );
} 
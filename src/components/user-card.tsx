import { User } from '@/types/user';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Mail } from 'lucide-react';

interface UserCardProps {
  user: User;
  onClick: (user: User) => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  return (
    <Card
      className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onClick(user)}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-start gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div 
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                  user.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-medium text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.title}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
            {user.department}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            {user.email}
          </div>
        </div>
      </div>
    </Card>
  );
}
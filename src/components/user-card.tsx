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
      className="p-6 cursor-pointer hover:bg-secondary/80 transition-all border bg-card"
      onClick={() => onClick(user)}
    >
      <div className="flex flex-col space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {user.name?.slice(0, 2).toUpperCase() || 'N/A'}
                </AvatarFallback>
              </Avatar>
              <div 
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                  user.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.title || 'No title'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {user.department && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Building2 className="mr-2 h-4 w-4" />
              {user.department}
            </div>
          )}
          {user.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-2 h-4 w-4" />
              {user.email}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
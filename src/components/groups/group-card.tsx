import { Group } from '@/types/group';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Users, Clock, Info, Shield, UserCog } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

function parseADTimestamp(timestamp: string | null): Date | null {
  if (!timestamp) return null;
  
  try {
    const formatted = timestamp
      .replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\..*/, '$1-$2-$3T$4:$5:$6Z');
    return new Date(formatted);
  } catch (error) {
    console.error('Failed to parse timestamp:', error);
    return null;
  }
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const created = parseADTimestamp(group.created);
  const modified = parseADTimestamp(group.lastModified);

  return (
    <Card 
      className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-start gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-lg">{group.name}</h3>
            </div>
            {group.type && (
              <p className="text-sm text-muted-foreground mt-1">
                {group.type.charAt(0).toUpperCase() + group.type.slice(1)} Group
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {group.description && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="mr-2 h-4 w-4" />
              {group.description}
            </div>
          )}
          
          {group.members && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              {group.members.length} members
            </div>
          )}

          {group.owner && (
            <div className="flex items-center text-sm text-muted-foreground">
              <UserCog className="mr-2 h-4 w-4" />
              Owner: {group.owner}
            </div>
          )}

          {created && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              Created: {format(created, 'PPpp')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
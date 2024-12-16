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
      className="p-6 cursor-pointer hover:bg-secondary/80 transition-all border bg-card"
      onClick={onClick}
    >
      <div className="flex flex-col space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">{group.name}</h3>
                {group.type && (
                  <p className="text-sm text-muted-foreground">
                    {group.type.charAt(0).toUpperCase() + group.type.slice(1)} Group
                  </p>
                )}
              </div>
            </div>
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
              {group.owner}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
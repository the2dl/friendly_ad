import { Group } from '@/types/group';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Users, Clock } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  onClick: () => void;
}

function parseADTimestamp(timestamp: string | null): Date | null {
  if (!timestamp) return null;
  
  try {
    // Convert "yyyyMMddHHmmss.0Z" to "yyyy-MM-ddTHH:mm:ssZ"
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
      className="cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {group.memberCount !== undefined && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{group.memberCount} members</span>
              </div>
            )}
            {created && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Created: {format(created, 'PPpp')}</span>
              </div>
            )}
            {modified && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Modified: {format(modified, 'PPpp')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
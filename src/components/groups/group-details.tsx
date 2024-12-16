import { useState, useEffect } from 'react';
import { Group } from '@/types/group';
import { User } from '@/types/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCircle,
  Calendar,
  Info,
  ChevronRight,
  UsersRound,
} from 'lucide-react';
import { getGroupDetails, searchGroupMembers } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GroupDetailsProps {
  group: Group | null;
  open: boolean;
  onClose: () => void;
  onUserSelect?: (user: User) => void;
  source?: { type: 'user'; user: User } | null;
  onReturnToUser?: (user: User) => void;
  userSource?: { type: 'group'; group: Group } | null;
}

interface MembersViewProps {
  groupName: string;
  members: User[];
  onBack: () => void;
  onClose: () => void;
  onUserSelect: (user: User) => void;
}

function MembersView({ groupName, members, onBack, onClose, onUserSelect }: MembersViewProps) {
  const handleMemberClick = (member: User) => {
    onUserSelect(member);
  };

  return (
    <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
      <DialogHeader className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={onBack} className="hover:bg-secondary/80">
            Back to Group
          </Button>
          <ChevronRight className="h-4 w-4" />
          <DialogTitle className="text-lg font-semibold">
            {groupName} Members
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm text-muted-foreground">
          Showing {members.length} members
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-secondary/80 cursor-pointer transition-colors"
            onClick={() => handleMemberClick(member)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleMemberClick(member);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{member.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">{member.title || 'N/A'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
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

export function GroupDetails({ 
  group: initialGroup, 
  open, 
  onClose, 
  onUserSelect,
  source,
  onReturnToUser,
  userSource
}: GroupDetailsProps) {
  const [group, setGroup] = useState<Group | null>(initialGroup);
  const [members, setMembers] = useState<User[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [isResultsTruncated, setIsResultsTruncated] = useState(false);

  useEffect(() => {
    setGroup(initialGroup);
    setShowMembers(false);
  }, [initialGroup]);

  useEffect(() => {
    if (open && initialGroup?.id) {
      getGroupDetails(initialGroup.id)
        .then(data => {
          setGroup(data);
          return searchGroupMembers(data.id);
        })
        .then(response => {
          if (response) {
            setMembers(response.data || []);
            setIsResultsTruncated(response.truncated || false);
          }
        })
        .catch(error => console.error('Failed to fetch group details:', error));
    }
  }, [open, initialGroup?.id]);

  const handleUserSelect = (user: User) => {
    console.log('Handling user selection:', user.name);
    if (onUserSelect) {
      setShowMembers(false);
      onClose();
      setTimeout(() => {
        onUserSelect(user);
      }, 100);
    }
  };

  const handleMemberClick = (member: User) => {
    console.log('Member clicked:', member.name);
    handleUserSelect(member);
  };

  if (!group) return null;

  const renderBreadcrumbs = () => {
    console.log('Rendering breadcrumbs with source:', source);
    const crumbs = [];
  
    if (source?.type === 'user') {  // Add this condition
      crumbs.push(
        <Button 
          key="user"
          variant="ghost" 
          onClick={onClose}
          className="hover:bg-secondary/80"
        >
          Back to {source.user.name}
        </Button>
      );
      crumbs.push(<ChevronRight key="arrow1" className="h-4 w-4" />);
    }

    crumbs.push(
      <span key="group" className="font-semibold">
        {showMembers ? group.name : 'Group Details'}
      </span>
    );

    if (showMembers) {
      crumbs.push(<ChevronRight key="arrow2" className="h-4 w-4" />);
      crumbs.push(
        <span key="members" className="font-semibold">
          Members
        </span>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        {crumbs}
      </div>
    );
  };

  if (showMembers && onUserSelect) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader className="space-y-6">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowMembers(false)}
                className="hover:bg-secondary/80 -ml-2"
              >
                Back to Group
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{group?.name} Members</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {members.length} members
            </p>
          </DialogHeader>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg border bg-card hover:bg-secondary/80 cursor-pointer transition-colors"
                onClick={() => handleMemberClick(member)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleMemberClick(member);
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{member.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.title || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-6">
          <DialogDescription className="sr-only">Group Details</DialogDescription>
          
          {/* Breadcrumb Navigation */}
          {renderBreadcrumbs()}

          {/* Group Header */}
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-secondary rounded-lg">
              <UsersRound className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {group.name}
              </DialogTitle>
              <p className="text-muted-foreground">
                {group.description || 'No description available'}
              </p>
              <Badge 
                variant={group.type === 'security' ? 'default' : 'secondary'} 
                className="mt-2"
              >
                {group.type}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-8 space-y-8">
          {isResultsTruncated && (
            <Alert>
              <AlertDescription className="text-yellow-600">
                Due to a large number of members, only the first 1,000 results are shown.
                Please use more specific search criteria to narrow down the results.
              </AlertDescription>
            </Alert>
          )}

          {/* Group Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight">Group Information</h4>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Owner: {group.owner || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created: {group.created ? format(parseADTimestamp(group.created) || new Date(), 'PPpp') : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Last Modified: {group.lastModified ? format(parseADTimestamp(group.lastModified) || new Date(), 'PPpp') : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold tracking-tight">Members</h4>
              <Badge variant="secondary">{members.length} total</Badge>
            </div>
            <Separator />
            <div className="space-y-4">
              {members.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-secondary/80 cursor-pointer transition-colors"
                      onClick={() => handleMemberClick(member)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                  ))}
                  {members.length > 3 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowMembers(true)}
                      className="h-[3.75rem]"
                    >
                      +{members.length - 3} more
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No members found</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
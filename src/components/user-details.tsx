import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Clock,
  UserCircle,
  User as UserIcon,
  Key,
  Hash,
  AtSign,
  ChevronRight
} from 'lucide-react';
import { searchGroupMembers } from '@/lib/api';
import { User } from '@/types/user';
import { toast } from "sonner"
import { Button } from "@/components/ui/button";
import { Group } from '@/types/group';

interface UserDetailsProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  source?: { type: 'group'; group: Group } | null;
  onReturnToGroup?: (group: Group) => void;
}

function parseADTimestamp(timestamp: string): Date {
  // Convert "yyyyMMddHHmmss.0Z" to "yyyy-MM-ddTHH:mm:ssZ"
  const formatted = timestamp
    .replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\..*/, '$1-$2-$3T$4:$5:$6Z');
  return new Date(formatted);
}

interface GroupMembersViewProps {
  groupName: string;
  users: User[];
  onBack: () => void;
  onClose: () => void;
  onUserSelect: (user: User) => void;
}

function GroupMembersView({ groupName, users, onBack, onClose, onUserSelect }: GroupMembersViewProps) {
  return (
    <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
      <DialogHeader className="space-y-4">
        <DialogTitle className="sr-only">
          {groupName} Group Members
        </DialogTitle>
        <DialogDescription className="sr-only">
          Showing members of the {groupName} group
        </DialogDescription>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={onBack} className="hover:bg-secondary/80">
            Back to User
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold">{groupName} Members</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {users.length} members
        </div>
      </DialogHeader>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div 
            key={user.id}
            className="p-4 rounded-lg border hover:bg-secondary/80 cursor-pointer transition-colors"
            onClick={() => onUserSelect(user)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onUserSelect(user);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'N/A'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.title || 'N/A'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
}

function cleanManagerName(managerDN: string): string {
  return managerDN
    .split(',')[0]
    .replace('CN=', '')
    .replace(/\\/g, '')
    .trim();
}

export function UserDetails({ 
  user, 
  open, 
  onClose, 
  setUsers, 
  setSelectedUser,
  source,
  onReturnToGroup 
}: UserDetailsProps) {
  const [groupView, setGroupView] = useState<{ name: string; users: User[] } | null>(null);
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-6">
          <DialogDescription className="sr-only">User Details</DialogDescription>
          
          {/* Breadcrumb Navigation */}
          {source?.type === 'group' && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="hover:bg-secondary/80 -ml-2"
              >
                Back to {source.group.name}
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">User Details</span>
            </div>
          )}

          {/* User Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">
                {user.name?.slice(0, 2).toUpperCase() || 'N/A'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {user.name || 'N/A'}
              </DialogTitle>
              <p className="text-muted-foreground">{user.title || 'No title'}</p>
              <Badge variant={user.enabled ? 'default' : 'secondary'} className="mt-2">
                {user.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-8 space-y-8">
          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight">Account Information</h4>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Username: {user.samAccountName || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">UPN: {user.userPrincipalName || 'N/A'}</span>
                </div>
              </div>
              {(user.employeeID || user.company) && (
                <div className="space-y-4">
                  {user.employeeID && (
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Employee ID: {user.employeeID}</span>
                    </div>
                  )}
                  {user.company && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Company: {user.company}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {(user.email || user.phone || user.street || user.city || user.state || user.postalCode || user.country) && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-tight">Contact Information</h4>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  {user.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {[user.street, user.city, user.state, user.postalCode, user.country]
                    .filter(Boolean)
                    .map((value, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{value}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Groups & Department */}
          {(user.department || (user.memberOf && user.memberOf.length > 0)) && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold tracking-tight">Groups & Department</h4>
              <Separator />
              <div className="space-y-4">
                {user.department && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.department}</span>
                  </div>
                )}
                {user.memberOf && user.memberOf.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Group Memberships</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.memberOf.map((group) => (
                        <Badge 
                          key={group} 
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={() => {
                            const groupName = group.split(',')[0].replace('CN=', '');
                            const groupObj: Group = {
                              id: group,
                              name: groupName,
                              type: 'security',
                              description: '',
                              created: '',
                              lastModified: '',
                              members: [],
                              owner: '',
                            };
                            
                            if (onReturnToGroup) {
                              onClose();
                              setTimeout(() => onReturnToGroup(groupObj), 100);
                            }
                          }}
                        >
                          {group.split(',')[0].replace('CN=', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-tight">Additional Information</h4>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              {user.manager && (
                <div className="flex items-center space-x-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Manager: {cleanManagerName(user.manager)}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Last Password Set: {user.pwdLastSet ? format(new Date(parseInt(user.pwdLastSet) / 10000 - 11644473600000), 'PPpp') : 'Never'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Last Logon: {user.lastLogon ? format(new Date(parseInt(user.lastLogon) / 10000 - 11644473600000), 'PPpp') : 'Never'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created: {user.created ? format(parseADTimestamp(user.created), 'PPpp') : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Modified: {user.lastModified ? format(parseADTimestamp(user.lastModified), 'PPpp') : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
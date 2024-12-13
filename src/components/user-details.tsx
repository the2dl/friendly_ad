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
            className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-secondary/80 cursor-pointer transition-colors"
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
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogDescription className="sr-only">
            User Details
          </DialogDescription>
          {source?.type === 'group' && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="hover:bg-secondary/80"
              >
                Back to {source.group.name}
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span className="font-semibold">User Details</span>
            </div>
          )}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'N/A'}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{user.name || 'N/A'}</DialogTitle>
              <p className="text-sm text-muted-foreground">{user.title || 'N/A'}</p>
            </div>
          </div>
          <Badge variant={user.enabled ? 'default' : 'secondary'} className="w-fit">
            {user.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Account Information - Always show these core fields */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Account Information</h4>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Username: {user.samAccountName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span>UPN: {user.userPrincipalName || 'N/A'}</span>
              </div>
              {user.employeeID && (
                <div className="flex items-center space-x-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span>Employee ID: {user.employeeID}</span>
                </div>
              )}
              {user.company && (
                <div className="flex items-center space-x-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Company: {user.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information - Show section only if any contact info exists */}
          {(user.email || user.phone || user.street || user.city || user.state || user.postalCode || user.country) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contact Information</h4>
              <Separator />
              <div className="space-y-2">
                {user.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.street && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.street}</span>
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.city}</span>
                  </div>
                )}
                {user.state && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.state}</span>
                  </div>
                )}
                {user.postalCode && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.postalCode}</span>
                  </div>
                )}
                {user.country && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.country}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Department & Groups - Show if department exists or has groups */}
          {(user.department || (user.memberOf && user.memberOf.length > 0)) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Department & Groups</h4>
              <Separator />
              <div className="space-y-2">
                {user.department && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{user.department}</span>
                  </div>
                )}
                {user.memberOf && user.memberOf.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {user.memberOf.map((group) => (
                        <Badge 
                          key={group} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
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
                            
                            console.log('Clicking group from user:', user.name);
                            
                            if (onReturnToGroup) {
                              onClose();
                              setTimeout(() => {
                                onReturnToGroup(groupObj);
                              }, 100);
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

          {/* Additional Information - Always show these timestamps */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Additional Information</h4>
            <Separator />
            <div className="space-y-2">
              {user.manager && (
                <div className="flex items-center space-x-2 text-sm">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Manager: {user.manager.split(',')[0].replace('CN=', '')}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span>Last Password Set: {user.pwdLastSet ? format(new Date(parseInt(user.pwdLastSet) / 10000 - 11644473600000), 'PPpp') : 'Never'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last Logon: {user.lastLogon ? format(new Date(parseInt(user.lastLogon) / 10000 - 11644473600000), 'PPpp') : 'Never'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Created: {user.created ? format(parseADTimestamp(user.created), 'PPpp') : 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last Modified: {user.lastModified ? format(parseADTimestamp(user.lastModified), 'PPpp') : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from 'react';
import { Users, UsersRound, Search, Settings } from 'lucide-react';
import { User } from '@/types/user';
import { Group } from '@/types/group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar } from '@/components/search-bar';
import { UserGrid } from '@/components/user-grid';
import { UserDetails } from '@/components/user-details';
import { GroupGrid } from '@/components/groups/group-grid';
import { GroupDetails } from '@/components/groups/group-details';
import { Button } from "@/components/ui/button";
import { searchUsers, searchGroups, getDomains, checkSetupStatus } from '@/lib/api';
import { useToast } from "@/hooks/use-toast"
import { ToastProvider } from "@/components/ui/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Domain } from '@/lib/api';
import { DomainManager } from '@/components/admin/domainManager';
import { AdminAuth } from '@/components/admin/AdminAuth';
import { FirstTimeSetup } from '@/components/admin/FirstTimeSetup';
import { Toaster } from "@/components/ui/toaster";
import { FeatureCards } from '@/components/feature-cards';

function App() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSource, setUserSource] = useState<{ type: 'group'; group: Group } | null>(null);
  const [navigationStack, setNavigationStack] = useState<Array<{
    type: 'user' | 'group';
    item: User | Group;
  }>>([]);
  const [isPrecise, setIsPrecise] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast()
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const domains = await getDomains();
        setDomains(domains);
        if (domains.length > 0) {
          setSelectedDomainId(domains[0].id);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch domains",
        });
      }
    };
    
    fetchDomains();
  }, []);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const isSetupComplete = await checkSetupStatus();
        setIsSetup(isSetupComplete);
      } catch (error) {
        console.error('Failed to check setup status:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check setup status",
        });
      }
    };
    checkSetup();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) {
      setUsers([]);
      setGroups([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      if (activeTab === 'users') {
        const data = await searchUsers(searchQuery, isPrecise, selectedDomainId || undefined);
        setUsers(data.data);
      } else {
        const data = await searchGroups(searchQuery, isPrecise, selectedDomainId || undefined);
        setGroups(data.data);
      }
    } catch (err: unknown) {
      setError(`Failed to fetch ${activeTab}`);
      console.error(err);
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Unable to connect to the server. Please check if the server is running and try again.",
        });
      } else if ((err as any).response?.status === 500) {
        toast({
          variant: "destructive",
          title: "Server Error",
          description: "The server encountered an error. Please try again later.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Search Error",
          description: `Failed to search ${activeTab}. Please try again.`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGroups = groups;

  useEffect(() => {
    setUsers([]);
    setGroups([]);
    setSearchQuery('');
    setHasSearched(false);
  }, [activeTab]);

  const handleUserSelect = (user: User) => {
    console.log('App: handling user selection:', user.name);
    
    // If we're coming from a group view, add it to the navigation stack
    if (selectedGroup) {
      console.log('App: adding group to navigation stack:', selectedGroup.name);
      setNavigationStack(prev => [...prev, { type: 'group', item: selectedGroup }]);
    }
    
    // Clear the group selection first
    setSelectedGroup(null);
    
    // Set the selected user after a small delay
    setTimeout(() => {
      console.log('App: setting selected user:', user.name);
      setSelectedUser(user);
      setActiveTab('users'); // Ensure we're on the users tab
    }, 100);
  };

  const handleGroupSelect = (group: Group) => {
    if (selectedUser) {
      setNavigationStack(prev => [...prev, { type: 'user', item: selectedUser }]);
    }
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  useEffect(() => {
    if (users) {
      setFilteredUsers(users);
    }
  }, [users]);

  const refreshDomains = async () => {
    try {
      const domains = await getDomains();
      setDomains(domains);
      if (domains.length > 0 && !selectedDomainId) {
        setSelectedDomainId(domains[0].id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch domains",
      });
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setUsers([]);
    setGroups([]);
    setHasSearched(false);
    setSelectedUser(null);
    setSelectedGroup(null);
    setNavigationStack([]);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Directory Explorer</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Search and explore your Active Directory users and groups with powerful filtering and detailed insights.
            </p>
          </div>

          <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 border rounded-xl p-6 space-y-6">
                <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                  <TabsTrigger value="users">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="groups">
                    <UsersRound className="h-4 w-4 mr-2" />
                    Groups
                  </TabsTrigger>
                  <TabsTrigger value="admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-4 items-center">
                  <Select
                    value={selectedDomainId?.toString()}
                    onValueChange={(value) => setSelectedDomainId(Number(value))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={domains.length === 0 ? "No domains configured" : "Select Domain"} />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id.toString()}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex-1">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSearch={handleSearch}
                      placeholder={`Search ${activeTab}...`}
                      isPrecise={isPrecise}
                      onPreciseChange={setIsPrecise}
                    />
                  </div>

                  {(hasSearched || users.length > 0 || groups.length > 0) && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="h-12"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="users">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    <p>{error}</p>
                  </div>
                ) : (
                  <>
                    {(users?.length ?? 0) > 0 ? (
                      <UserGrid 
                        users={users} 
                        onUserSelect={user => handleUserSelect(user)} 
                      />
                    ) : (
                      hasSearched && searchQuery && !isLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No users found{isPrecise ? " (using precise match)" : ""}.</p>
                          <p className="text-sm mt-2">
                            Try {isPrecise ? "switching to broad search" : "a different search term"}.
                          </p>
                        </div>
                      )
                    )}
                  </>
                )}
                <UserDetails 
                  user={selectedUser}
                  open={!!selectedUser}
                  onClose={() => {
                    console.log('App: closing user details');
                    const previous = navigationStack[navigationStack.length - 1];
                    if (previous) {
                      setNavigationStack(prev => prev.slice(0, -1));
                      if (previous.type === 'group') {
                        setSelectedUser(null);
                        setSelectedGroup(previous.item as Group);
                      } else {
                        setSelectedGroup(null);
                        setSelectedUser(previous.item as User);
                      }
                    } else {
                      setSelectedUser(null);
                    }
                  }}
                  source={navigationStack.length > 0 ? 
                    { type: 'group', group: navigationStack[navigationStack.length - 1].item as Group } : 
                    null
                  }
                  setUsers={setUsers}
                  setSelectedUser={setSelectedUser}
                  onReturnToGroup={(group) => {
                    setSelectedUser(null);
                    setSelectedGroup(group);
                  }}
                />
                <GroupDetails
                  group={selectedGroup}
                  open={!!selectedGroup}
                  onClose={() => {
                    const previous = navigationStack[navigationStack.length - 1];
                    if (previous) {
                      setNavigationStack(prev => prev.slice(0, -1));
                      if (previous.type === 'user') {
                        setSelectedGroup(null);
                        setSelectedUser(previous.item as User);
                      } else {
                        setSelectedUser(null);
                        setSelectedGroup(previous.item as Group);
                      }
                    } else {
                      setSelectedGroup(null);
                    }
                  }}
                  source={navigationStack.length > 0 ? 
                    { type: 'user', user: navigationStack[navigationStack.length - 1].item as User } : 
                    null
                  }
                  onUserSelect={handleUserSelect}
                  userSource={userSource}
                />
              </TabsContent>

              <TabsContent value="groups">
                {groups.length > 0 ? (
                  <GroupGrid groups={filteredGroups} onGroupSelect={setSelectedGroup} />
                ) : (
                  hasSearched && searchQuery && !isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No groups found{isPrecise ? " (using precise match)" : ""}.</p>
                      <p className="text-sm mt-2">Try {isPrecise ? "switching to broad search" : "a different search term"}.</p>
                    </div>
                  )
                )}
                <GroupDetails
                  group={selectedGroup}
                  open={!!selectedGroup}
                  onClose={() => setSelectedGroup(null)}
                  source={selectedUser ? { type: 'user', user: selectedUser } : null}
                  onUserSelect={handleUserSelect}
                  userSource={userSource}
                />
              </TabsContent>

              <TabsContent value="admin">
                {isSetup === false ? (
                  <FirstTimeSetup onSetupComplete={(key) => {
                    setAdminKey(key);
                    setIsSetup(true);
                  }} />
                ) : adminKey ? (
                  <DomainManager 
                    adminKey={adminKey} 
                    onDomainChange={refreshDomains} 
                  />
                ) : (
                  <AdminAuth onAuth={setAdminKey} />
                )}
              </TabsContent>
            </Tabs>

            {(users.length > 0 || groups.length > 0 || (hasSearched && searchQuery) || activeTab === 'admin') && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-sm text-muted-foreground">Features & Insights</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
                <p className="text-muted-foreground">
                  Find users and groups quickly with intelligent search capabilities
                </p>
              </div>
              
              <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">User Insights</h3>
                <p className="text-muted-foreground">
                  Comprehensive user details including group memberships and permissions
                </p>
              </div>
              
              <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <UsersRound className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Group Management</h3>
                <p className="text-muted-foreground">
                  Explore and manage group hierarchies and memberships
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </ToastProvider>
  );
}

export default App;
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

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-8">
            <div className="flex items-center space-x-2">
              {activeTab === 'users' ? (
                <Users className="h-6 w-6" />
              ) : (
                <UsersRound className="h-6 w-6" />
              )}
              <h1 className="text-2xl font-bold">Active Directory</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Quick Search</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Search users by name, email, employee ID, login ID, or department. Search groups by name or description.
                </p>
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">User Details</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  View comprehensive user information including contact details and group memberships.
                </p>
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center space-x-2">
                  <UsersRound className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Group Navigation</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Explore group memberships and easily navigate between users and their groups.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-lg border bg-card">
              <div className="max-w-2xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4" />
                      Groups
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex gap-4 items-center mb-4">
                    <Select
                      value={selectedDomainId?.toString()}
                      onValueChange={(value) => setSelectedDomainId(Number(value))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id.toString()}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1 max-w-3xl mx-auto flex gap-3">
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={handleSearch}
                        placeholder={`Search ${activeTab}...`}
                        className="flex-1 h-12 text-lg"
                        isPrecise={isPrecise}
                        onPreciseChange={setIsPrecise}
                      />
                      <Button 
                        onClick={handleSearch}
                        disabled={isLoading}
                        size="lg"
                        className="h-12 px-8 text-lg"
                      >
                        {isLoading ? (
                          "Searching..."
                        ) : (
                          <>
                            <Search className="h-5 w-5 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="users" className="mt-6">
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

                  <TabsContent value="groups" className="mt-6">
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

                  <TabsContent value="admin" className="mt-6">
                    {isSetup === false ? (
                      <FirstTimeSetup onSetupComplete={(key) => {
                        setAdminKey(key);
                        setIsSetup(true);
                      }} />
                    ) : adminKey ? (
                      <DomainManager adminKey={adminKey} />
                    ) : (
                      <AdminAuth onAuth={setAdminKey} />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
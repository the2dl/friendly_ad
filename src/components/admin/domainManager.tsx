// src/components/admin/DomainManager.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addDomain, getDomains, deleteDomain, NewDomain, Domain, updateDomain, getDomain } from '@/lib/api';
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Trash2, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DomainManagerProps {
  adminKey: string;
  onDomainChange: () => void;
}

export function DomainManager({ adminKey, onDomainChange }: DomainManagerProps) {
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDomain, setNewDomain] = useState<NewDomain>({
    name: '',
    server: '',
    base_dn: '',
    username: '',
    password: ''
  });
  const [editingDomainId, setEditingDomainId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingDomainId) {
        await updateDomain(editingDomainId, newDomain, adminKey);
        await fetchDomains();
        toast({
          title: "Domain Updated",
          description: `Successfully updated domain "${newDomain.name}"`,
          variant: "default", // Success toast
        });
      } else {
        await addDomain(newDomain, adminKey);
        await fetchDomains();
        toast({
          title: "Domain Added",
          description: `Successfully added domain "${newDomain.name}"`,
          variant: "default", // Success toast
        });
      }
      
      setNewDomain({
        name: '',
        server: '',
        base_dn: '',
        username: '',
        password: ''
      });
      setEditingDomainId(null);
      onDomainChange();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save domain",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Make sure we're fetching domains when component mounts
  useEffect(() => {
    fetchDomains();
  }, []);

  const handleDelete = async (domain: Domain) => {
    try {
      await deleteDomain(domain.id, adminKey);
      setDomains(currentDomains => 
        currentDomains.filter(d => d.id !== domain.id)
      );
      toast({
        title: "Domain Deleted",
        description: `Successfully deleted domain "${domain.name}"`,
        variant: "default", // Success toast
      });
      setDomainToDelete(null);
      onDomainChange();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete domain",
      });
    }
  };

  const handleEdit = async (domain: Domain) => {
    try {
      // Pass the adminKey to getDomain
      const fullDomain = await getDomain(domain.id, adminKey);
      
      if (fullDomain) {
        setEditingDomainId(fullDomain.id);
        setNewDomain({
          name: fullDomain.name || '',
          server: fullDomain.server || '',
          base_dn: fullDomain.base_dn || '',
          username: fullDomain.username || '',
          password: '' // Password is not returned from API for security
        });
      }
    } catch (error) {
      console.error('Error fetching domain details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load domain details",
      });
    }
  };

  const fetchDomains = async () => {
    try {
      const fetchedDomains = await getDomains();
      setDomains(fetchedDomains);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch domains",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Existing Domains List */}
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Configured Domains</CardTitle>
          <CardDescription>Manage your existing domain connections</CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No domains configured yet
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-secondary/50 transition-colors">
                  <div>
                    <h3 className="font-medium">{domain.name}</h3>
                    <p className="text-sm text-muted-foreground">{domain.server}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(domain)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDomainToDelete(domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Domain Form */}
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {editingDomainId ? "Edit Domain" : "Add New Domain"}
          </CardTitle>
          <CardDescription>
            {editingDomainId 
              ? "Update your Active Directory domain connection" 
              : "Configure a new Active Directory domain connection"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="name">Domain Name</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A friendly name for this domain</p>
                      <p>Example: "Main Office AD"</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="name"
                placeholder="Main Office AD"
                value={newDomain.name}
                onChange={(e) => setNewDomain(prev => ({ ...prev, name: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="server">LDAP Server URL</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>LDAP server address with protocol and port</p>
                      <p>Example: "ldap://10.3.10.11:389"</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="server"
                placeholder="ldap://10.3.10.11:389"
                value={newDomain.server}
                onChange={(e) => setNewDomain(prev => ({ ...prev, server: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="base_dn">Base DN</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Base Distinguished Name for LDAP queries</p>
                      <p>Example: "dc=mtx,dc=domain"</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="base_dn"
                placeholder="dc=mtx,dc=domain"
                value={newDomain.base_dn}
                onChange={(e) => setNewDomain(prev => ({ ...prev, base_dn: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="username">Username</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Service account username in DN format</p>
                      <p>Example: "cn=domainuser,cn=users,dc=mtx,dc=domain"</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="username"
                placeholder="cn=domainuser,cn=users,dc=mtx,dc=domain"
                value={newDomain.username}
                onChange={(e) => setNewDomain(prev => ({ ...prev, username: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="password">Password</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Service account password</p>
                      <p>Will be stored encrypted in the database</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter service account password"
                value={newDomain.password}
                onChange={(e) => setNewDomain(prev => ({ ...prev, password: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-12"
              >
                {isSubmitting 
                  ? (editingDomainId ? "Updating..." : "Adding...") 
                  : (editingDomainId ? "Update Domain" : "Add Domain")}
              </Button>
              {editingDomainId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingDomainId(null);
                    setNewDomain({
                      name: '',
                      server: '',
                      base_dn: '',
                      username: '',
                      password: ''
                    });
                  }}
                  className="h-12"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={!!domainToDelete} onOpenChange={() => setDomainToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the domain "{domainToDelete?.name}" from your configuration. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => domainToDelete && handleDelete(domainToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
// src/components/admin/DomainManager.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addDomain, getDomains, deleteDomain, NewDomain, Domain } from '@/lib/api';
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Trash2, Edit } from 'lucide-react';

interface DomainManagerProps {
  adminKey: string;
}

export function DomainManager({ adminKey }: DomainManagerProps) {
  const { toast } = useToast();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState<NewDomain>({
    name: '',
    server: '',
    base_dn: '',
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDomainId, setEditingDomainId] = useState<number | null>(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingDomainId) {
        // Add update logic here when you implement it
        // await updateDomain(editingDomainId, newDomain, adminKey);
      } else {
        await addDomain(newDomain, adminKey);
      }
      
      toast({
        title: "Success",
        description: editingDomainId ? "Domain updated successfully" : "Domain added successfully",
      });
      
      // Reset form
      setNewDomain({
        name: '',
        server: '',
        base_dn: '',
        username: '',
        password: ''
      });
      setEditingDomainId(null);
      
      // Refresh the domains list
      await fetchDomains();
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

  const handleDelete = async (domainId: number) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    
    try {
      // We need to add this endpoint to the API
      await deleteDomain(domainId, adminKey);
      toast({
        title: "Success",
        description: "Domain deleted successfully",
      });
      await fetchDomains();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete domain",
      });
    }
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomainId(domain.id);
    setNewDomain({
      name: domain.name || '',
      server: domain.server || '',
      base_dn: domain.base_dn || '',
      username: domain.username || '',
      password: '' // Password is not returned from API for security
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing Domains List */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configured Domains</CardTitle>
          <CardDescription>Manage your existing domain connections</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading domains...</div>
          ) : domains.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No domains configured yet
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                      onClick={() => handleDelete(domain.id)}
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

      {/* Add New Domain Form */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Domain</CardTitle>
          <CardDescription>Configure a new Active Directory domain connection</CardDescription>
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
                      <p>Example: "cn=domainuser,dc=mtx,dc=domain"</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="username"
                placeholder="cn=domainuser,dc=mtx,dc=domain"
                value={newDomain.username}
                onChange={(e) => setNewDomain(prev => ({ ...prev, username: e.target.value }))}
                required
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
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
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
              >
                Cancel
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
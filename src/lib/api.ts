import { User } from '@/types/user';
import { Group } from '@/types/group';

const API_BASE_URL = 'http://10.3.10.100:5001';

class ApiError extends Error {
  constructor(public status?: number, message?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Add a helper to detect sAMAccountName format
function isSAMAccountName(query: string): boolean {
  // SAMAccountName typically follows domain\username or just username pattern
  // and doesn't contain spaces or special characters
  return /^[^@\s]+$/i.test(query);
}

interface SearchResponse<T> {
  data: T[];
  truncated: boolean;
}

export interface Domain {
  id: number;
  name: string;
  server: string;
  base_dn: string;
  username: string;
  is_active: boolean;
}

export interface NewDomain {
  name: string;
  server: string;
  base_dn: string;
  username: string;
  password: string;
}

export async function getDomains(): Promise<Domain[]> {
  const response = await fetch(`${API_BASE_URL}/domains`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch domains');
  }
  return response.json();
}

export async function addDomain(domain: NewDomain, adminKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/domains`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify(domain)
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError(401, 'Invalid admin key');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status, 
      errorData.error || 'Failed to add domain'
    );
  }
}

export async function searchUsers(
  query: string, 
  precise: boolean, 
  domainId?: number
): Promise<SearchResponse<User>> {
  try {
    const params = new URLSearchParams({
      query: query,
      type: 'users',
      precise: precise.toString()
    });

    if (precise && isSAMAccountName(query)) {
      params.set('searchBy', 'sAMAccountName');
    }
    
    if (domainId) {
      params.set('domain_id', domainId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch users');
    }
    return response.json();
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new ApiError(undefined, 'Connection failed');
    }
    throw err;
  }
}

export async function searchGroups(
  query: string, 
  precise: boolean,
  domainId?: number
): Promise<SearchResponse<Group>> {
  const params = new URLSearchParams({
    query: query,
    type: 'groups',
    precise: precise.toString()
  });

  if (domainId) {
    params.set('domain_id', domainId.toString());
  }

  const response = await fetch(`${API_BASE_URL}/search?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  return response.json();
}

export async function searchGroupMembers(groupDN: string): Promise<SearchResponse<User>> {
  const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(groupDN)}&type=group_members`);
  if (!response.ok) {
    throw new Error('Failed to fetch group members');
  }
  return response.json();
}

export async function getGroupDetails(groupId: string): Promise<Group> {
  console.log('Fetching group details for ID:', groupId);
  const response = await fetch(`${API_BASE_URL}/groups/${encodeURIComponent(groupId)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch group details');
  }
  const data = await response.json();
  console.log('API response:', data);
  return data;
}

export async function checkSetupStatus(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/admin/setup-status`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to check setup status');
  }
  const data = await response.json();
  return data.isSetup;
}

export async function setupAdmin(adminKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ adminKey }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new ApiError(400, 'Admin key already set');
    }
    throw new ApiError(response.status, 'Failed to set admin key');
  }
}

export async function deleteDomain(domainId: number, adminKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/domains/${domainId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Key': adminKey
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError(401, 'Invalid admin key');
    }
    throw new ApiError(response.status, 'Failed to delete domain');
  }
}

export async function updateDomain(
  domainId: number, 
  domain: NewDomain, 
  adminKey: string
): Promise<Domain> {
  const response = await fetch(`${API_BASE_URL}/admin/domains/${domainId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify(domain)
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new ApiError(401, 'Invalid admin key');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status, 
      errorData.error || 'Failed to update domain'
    );
  }
  
  const updatedDomain = await response.json();
  if (!updatedDomain.id) {
    throw new ApiError(500, 'Server returned invalid domain data');
  }
  
  return updatedDomain;
}

export async function getDomain(domainId: number, adminKey: string): Promise<Domain> {
  const response = await fetch(`${API_BASE_URL}/admin/domains/${domainId}`, {
    headers: {
      'X-Admin-Key': adminKey
    }
  });
  
  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch domain details');
  }
  return response.json();
}
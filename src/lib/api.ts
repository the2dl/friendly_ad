import { User } from '@/types/user';
import { Group } from '@/types/group';

const isDevelopment = import.meta.env.MODE === 'development';
const API_BASE_URL = isDevelopment ? 'http://localhost:5001' : '/api';
const API_KEY = import.meta.env.VITE_API_KEY;

if (isDevelopment) {
  console.log('Environment:', import.meta.env.MODE);
  console.log('API Base URL:', API_BASE_URL);
  console.log('API Key:', API_KEY);
}

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
  total_count?: number;
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
  const headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };
  
  if (isDevelopment) {
    console.log('API Key:', API_KEY);
    console.log('Request headers:', headers);
  }

  const response = await fetch(`${API_BASE_URL}/domains`, {
    method: 'GET',
    headers,
    credentials: 'include'
  });
  
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

    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
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

  const response = await fetch(`${API_BASE_URL}/search?${params}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  const data = await response.json();
  
  // Filter out invalid members before returning
  if (data.data) {
    data.data = data.data.map((group: Group) => ({
      ...group,
      members: (group.members || []).filter(member => {
        // Only count entries that look like user accounts
        // Exclude built-in security principals and system groups
        return member &&
               member !== 'N/A' &&
               !member.includes('CN=S-1-') &&
               !member.includes('CN=Domain Users,') &&
               !member.includes('CN=System,') &&
               !member.includes('CN=Administrator,');
      })
    }));
  }
  
  return data;
}

export async function searchGroupMembers(groupDN: string): Promise<SearchResponse<User>> {
  try {
    const response = await fetch(`${API_BASE_URL}/groups/${encodeURIComponent(groupDN)}/members`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch group members');
    }
    const data = await response.json();
    return {
      data: data.data,
      total_count: data.total_count,
      truncated: false // We're now handling pagination server-side
    };
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new ApiError(undefined, 'Connection failed');
    }
    throw err;
  }
}

export async function getGroupDetails(groupId: string): Promise<Group> {
  try {
    const response = await fetch(`${API_BASE_URL}/groups/${encodeURIComponent(groupId)}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch group details');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new ApiError(undefined, 'Connection failed');
    }
    throw err;
  }
}

export async function checkSetupStatus(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/admin/setup-status`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
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
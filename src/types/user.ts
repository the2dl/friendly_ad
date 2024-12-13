export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  memberOf: string[];
  city: string;
  country: string;
  state: string;
  street: string;
  status?: 'active' | 'inactive';
  lastLogon: string | null;
  manager: string | null;
  phone: string;
  enabled: boolean;
  created: string | null;
  lastModified: string | null;
  company: string;
  samAccountName: string;
  userPrincipalName: string;
  pwdLastSet: string | null;
  employeeID: string | null;
  postalCode: string;
}
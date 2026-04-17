export interface User {
  id: string;
  fullname: string;
  email: string;
  role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'AGENTE' | 'AUDITOR';
  lastSeen: string;
  status: 'Active' | 'Inactive' | 'Blocked';
}

export interface UserFormData {
  fullName: string;
  username: string;
  email: string;
  role: string;
  password?: string;
  typeDocument?: string;
  document?: string;
}

export interface RoleOption {
  id: number | string;
  name: string;
  description: string;
}

export interface CreateUserDTO {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: number | string;
  typeDocument?: string;
  document?: string;
}


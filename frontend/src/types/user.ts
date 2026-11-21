export type UserRoleCode = 'OWNER' | 'MANAGER' | 'CASHIER' | 'CHEF' | 'WAITER' | 'STAFF';

export interface UserResponseDto {
  id: string;
  employeeCode: string;
  username: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  roleCode: UserRoleCode;
  roleName: string;
  hasPin: boolean;
  pinMasked?: string;
  discountCeiling: number;
  ipBinding?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  username?: string;
  password: string;
  email?: string;
  phone: string;
  roleCode: UserRoleCode;
  pinCode?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  roleCode?: UserRoleCode;
  isActive?: boolean;
}

export interface UpdatePinRequest {
  pinCode: string;
}

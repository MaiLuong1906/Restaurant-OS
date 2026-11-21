import { fetchApi } from '../lib/api-client';
import { CreateUserRequest, UpdatePinRequest, UpdateUserRequest, UserResponseDto } from '../types/user';

export const userService = {
  /**
   * Lấy danh sách nhân sự (hỗ trợ lọc theo role, search keyword, và trạng thái isActive)
   */
  async getAllUsers(params?: {
    role?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<UserResponseDto[]> {
    const query = new URLSearchParams();
    if (params?.role && params.role !== 'ALL') {
      query.set('role', params.role);
    }
    if (params?.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params?.isActive !== undefined) {
      query.set('isActive', String(params.isActive));
    }

    const qs = query.toString();
    const endpoint = `/admin/users${qs ? `?${qs}` : ''}`;
    return fetchApi<UserResponseDto[]>(endpoint);
  },

  /**
   * Xem chi tiết nhân viên theo UUID, Mã nhân viên (e.g. TN001) hoặc Username
   */
  async getUserById(identifier: string): Promise<UserResponseDto> {
    return fetchApi<UserResponseDto>(`/admin/users/${identifier}`);
  },

  /**
   * Cấp tài khoản nhân sự mới (Backend tự động sinh mã theo vai trò)
   */
  async createUser(request: CreateUserRequest): Promise<UserResponseDto> {
    return fetchApi<UserResponseDto>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Cập nhật thông tin nhân viên hoặc thăng chức vai trò
   */
  async updateUser(identifier: string, request: UpdateUserRequest): Promise<UserResponseDto> {
    return fetchApi<UserResponseDto>(`/admin/users/${identifier}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Đổi mã PIN xác thực trạm POS/KDS
   */
  async updatePin(identifier: string, request: UpdatePinRequest): Promise<UserResponseDto> {
    return fetchApi<UserResponseDto>(`/admin/users/${identifier}/pin`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  /**
   * Khóa hoặc mở khóa trạng thái tài khoản
   */
  async toggleStatus(identifier: string): Promise<UserResponseDto> {
    return fetchApi<UserResponseDto>(`/admin/users/${identifier}/toggle-status`, {
      method: 'PATCH',
    });
  },

  /**
   * Xóa mềm tài khoản nhân sự
   */
  async deleteUser(identifier: string): Promise<UserResponseDto> {
    return fetchApi<UserResponseDto>(`/admin/users/${identifier}`, {
      method: 'DELETE',
    });
  },
};

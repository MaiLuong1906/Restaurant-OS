import { ApiResponse } from '../types';
import { generateIdempotencyKey } from './utils';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const requestId = generateIdempotencyKey();
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // SECURITY: Tự động gắn Authorization Bearer token từ useAuthStore nếu có
  const token = useAuthStore.getState().getAccessToken();

  // AUTH: Gắn X-Table-Token cho request của khách hàng nếu có trong store và không phải endpoint nội bộ nhân sự
  const isStaffEndpoint =
    endpoint.startsWith('/admin') ||
    endpoint.startsWith('/staff') ||
    endpoint.startsWith('/kds') ||
    endpoint.startsWith('/pos');

  const tableToken = !isStaffEndpoint ? useCartStore.getState().tableToken : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tableToken && !headers['X-Table-Token']) {
    headers['X-Table-Token'] = tableToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Khi gặp 401 Unauthorized, tự động xóa auth session để bảo mật
      useAuthStore.getState().clearAuth();
    }

    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.code || `HTTP_${response.status}`,
        json.error?.message || json.message || 'Yêu cầu thất bại',
        response.status,
        json.error?.details
      );
    }

    return json.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('NETWORK_ERROR', (error as Error).message, 0);
  }
}

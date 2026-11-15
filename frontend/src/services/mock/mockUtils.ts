import { ApiError } from '../../lib/api-client';

export function simulateLatency(ms: number = 200): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function deepClone<T>(data: T): T {
  return structuredClone(data);
}

export function createNotFoundError(resource: string, id: string): ApiError {
  return new ApiError('NOT_FOUND', `Không tìm thấy ${resource} với ID: ${id}`, 404);
}

export function createValidationError(message: string): ApiError {
  return new ApiError('VALIDATION_ERROR', message, 400);
}

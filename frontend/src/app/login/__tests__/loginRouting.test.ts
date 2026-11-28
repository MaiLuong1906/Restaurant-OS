import { describe, it, expect } from 'vitest';
import { homeHrefForRole } from '../login-helpers';

describe('homeHrefForRole', () => {
  it('chuyển hướng OWNER và MANAGER sang /dashboard', () => {
    expect(homeHrefForRole('OWNER')).toBe('/dashboard');
    expect(homeHrefForRole('MANAGER')).toBe('/dashboard');
  });

  it('chuyển hướng WAITER sang /wait', () => {
    expect(homeHrefForRole('WAITER')).toBe('/wait');
  });

  it('chuyển hướng CHEF sang /chef', () => {
    expect(homeHrefForRole('CHEF')).toBe('/chef');
  });

  it('chuyển hướng CASHIER sang /pos', () => {
    expect(homeHrefForRole('CASHIER')).toBe('/pos');
  });

  it('chuyển hướng STAFF hoặc undefined sang /staff mặc định', () => {
    expect(homeHrefForRole('STAFF')).toBe('/staff');
    expect(homeHrefForRole(undefined)).toBe('/staff');
  });
});

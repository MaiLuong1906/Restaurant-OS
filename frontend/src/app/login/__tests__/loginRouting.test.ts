import { describe, it, expect } from 'vitest';
import { homeHrefForRole } from '../login-helpers';

describe('homeHrefForRole', () => {
  it('chuyển hướng WAITER sang /wait', () => {
    expect(homeHrefForRole('WAITER')).toBe('/wait');
  });

  it('chuyển hướng CHEF sang /chef', () => {
    expect(homeHrefForRole('CHEF')).toBe('/chef');
  });

  it('chuyển hướng MANAGER sang /chef', () => {
    expect(homeHrefForRole('MANAGER')).toBe('/chef');
  });

  it('chuyển hướng CASHIER sang /pos', () => {
    expect(homeHrefForRole('CASHIER')).toBe('/pos');
  });

  it('chuyển hướng STAFF hoặc undefined sang /chef mặc định', () => {
    expect(homeHrefForRole('STAFF')).toBe('/chef');
    expect(homeHrefForRole(undefined)).toBe('/chef');
  });
});

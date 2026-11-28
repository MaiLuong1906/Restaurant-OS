export function homeHrefForRole(role?: string): string {
  switch (role) {
    case 'OWNER':
    case 'MANAGER':
      return '/dashboard';
    case 'CHEF':
      return '/chef';
    case 'CASHIER':
      return '/pos';
    case 'WAITER':
      return '/wait';
    case 'STAFF':
    default:
      return '/staff';
  }
}

export function homeHrefForRole(role?: string): string {
  switch (role) {
    case 'CHEF':
    case 'MANAGER':
      return '/chef';
    case 'CASHIER':
      return '/pos';
    case 'WAITER':
      return '/wait';
    case 'STAFF':
    default:
      return '/chef';
  }
}

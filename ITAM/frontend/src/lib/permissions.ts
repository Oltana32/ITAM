import { UserRole } from '@/lib/authRole';

/** Paths accessible per role */
const ROLE_PATHS: Record<UserRole, Set<string>> = {
  admin: new Set([
    '/',
    '/assets',
    '/locations',
    '/assignments',
    '/maintenance',
    '/software',
    '/audits',
    '/reports',
    '/manufacturers',
    '/notifications',
    '/users',
    '/settings',
    '/profile',
  ]),
  it_team: new Set([
    '/',
    '/assets',
    '/locations',
    '/assignments',
    '/maintenance',
    '/software',
    '/audits',
    '/reports',
    '/manufacturers',
    '/notifications',
    '/profile',
  ]),
  finance: new Set(['/reports', '/profile']),
};

export function canAccessPath(role: UserRole, path: string): boolean {
  const allowed = ROLE_PATHS[role];
  if (!allowed) return false;
  if (allowed.has(path)) return true;
  // Block finance from all other routes
  return false;
}

export function getDefaultPath(role: UserRole): string {
  if (role === 'finance') return '/reports';
  return '/';
}

export function canWrite(role: UserRole): boolean {
  return role === 'admin' || role === 'it_team';
}

export function canDelete(role: UserRole): boolean {
  return role === 'admin';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isITTeam(role: UserRole): boolean {
  return role === 'it_team';
}

export function isFinance(role: UserRole): boolean {
  return role === 'finance';
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'it_team':
      return 'IT Team';
    case 'finance':
      return 'Finance';
    default:
      return role;
  }
}

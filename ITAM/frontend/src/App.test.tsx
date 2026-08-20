import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

vi.mock('./components/CommandPalette', () => ({
  CommandPalette: () => null,
}));

vi.mock('./pages/Index', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('./pages/Assets', () => ({
  default: () => <div>Assets Page</div>,
}));

vi.mock('./pages/Users', () => ({
  default: () => <div>Users Page</div>,
}));

vi.mock('./pages/Locations', () => ({
  default: () => <div>Locations Page</div>,
}));

vi.mock('./pages/Maintenance', () => ({
  default: () => <div>Maintenance Page</div>,
}));

vi.mock('./pages/Software', () => ({
  default: () => <div>Software Page</div>,
}));

vi.mock('./pages/Reports', () => ({
  default: () => <div>Reports Page</div>,
}));

vi.mock('./pages/Audits', () => ({
  default: () => <div>Audits Page</div>,
}));

vi.mock('./pages/Manufacturers', () => ({
  default: () => <div>Manufacturers Page</div>,
}));

vi.mock('./pages/Assignments', () => ({
  default: () => <div>Assignments Page</div>,
}));

vi.mock('./pages/Notifications', () => ({
  default: () => <div>Notifications Page</div>,
}));

vi.mock('./pages/SettingsPage', () => ({
  default: () => <div>Settings Page</div>,
}));

vi.mock('./pages/Profile', () => ({
  default: () => <div>Profile Page</div>,
}));

vi.mock('./pages/NotFound', () => ({
  default: () => <div>Not Found</div>,
}));

vi.mock('./pages/Login', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./lib/auth', () => ({
  isAuthenticated: () => true,
  getStoredUser: () => ({
    id: '1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
  }),
  getAccessToken: () => 'token',
  getRefreshToken: () => 'refresh',
  setAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  authFetch: vi.fn(),
  authFetchWithRefresh: vi.fn(),
  createAxiosWithAuth: vi.fn(),
}));

vi.mock('./lib/authRole', async () => {
  const actual = await vi.importActual<typeof import('./lib/authRole')>('./lib/authRole');
  return {
    ...actual,
    getCurrentUserRole: () => 'admin',
  };
});

describe('App routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the dashboard for authenticated users at the root path', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });
});

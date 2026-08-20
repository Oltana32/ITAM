import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import Profile from './Profile';

const { mockAuthFetch, mockGetStoredUser } = vi.hoisted(() => ({
  mockAuthFetch: vi.fn(),
  mockGetStoredUser: vi.fn(),
}));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    authFetch: mockAuthFetch,
    getStoredUser: mockGetStoredUser,
  };
});

describe('Profile', () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
    mockGetStoredUser.mockReset();
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'user-1',
        email: 'ada@example.com',
        first_name: 'Ada',
        last_name: 'Lovelace',
        role: 'it_team',
        department: 'IT',
        date_joined: '2024-01-01T00:00:00Z',
      }),
    });
  });

  it('shows appearance controls for non-finance users', () => {
    mockGetStoredUser.mockReturnValue({
      id: 'user-1',
      email: 'ada@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      role: 'it_team',
      department: 'IT',
    });

    render(
      <ThemeProvider>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('hides appearance controls for finance users', () => {
    mockGetStoredUser.mockReturnValue({
      id: 'finance-1',
      email: 'finance@example.com',
      first_name: 'Finance',
      last_name: 'User',
      role: 'finance',
      department: 'Finance',
    });

    render(
      <ThemeProvider>
        <Profile />
      </ThemeProvider>
    );

    expect(screen.queryByText('Appearance')).not.toBeInTheDocument();
  });
});

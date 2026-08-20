import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { CommandPalette } from '@/components/CommandPalette';

const { mockIsAuthenticated } = vi.hoisted(() => ({
  mockIsAuthenticated: vi.fn(() => true),
}));

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    isAuthenticated: mockIsAuthenticated,
  };
});

vi.mock('@/lib/authRole', () => ({
  getCurrentUserRole: () => 'admin',
}));

vi.mock('@/lib/permissions', () => ({
  canAccessPath: () => true,
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    mockIsAuthenticated.mockReset();
    mockIsAuthenticated.mockReturnValue(true);
  });

  it('opens when the app search event is dispatched', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <CommandPalette />
        </ThemeProvider>
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new Event('asset-buddy-open-search'));
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/search everything/i)).toBeInTheDocument();
  });

  it('still opens the palette when auth state is not yet available', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(
      <MemoryRouter>
        <ThemeProvider>
          <CommandPalette />
        </ThemeProvider>
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new Event('asset-buddy-open-search'));
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

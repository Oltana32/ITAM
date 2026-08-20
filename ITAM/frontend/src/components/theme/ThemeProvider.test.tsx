import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

function ThemeProbe() {
  const { theme, themeStyle, setTheme, setThemeStyle } = useTheme();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="style">{themeStyle}</div>
      <button onClick={() => setTheme('dark')}>Set dark</button>
      <button onClick={() => setThemeStyle('ocean')}>Set ocean</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores theme preferences per logged-in user', async () => {
    localStorage.setItem('assetBuddy.auth.user', JSON.stringify({
      id: 'user-1',
      email: 'one@example.com',
      first_name: 'One',
      last_name: 'User',
      role: 'it_team',
    }));

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'Set dark' }));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(localStorage.getItem('awash-itam-theme:user-1')).toBe('dark');
  });

  it('keeps finance users on the default theme values', async () => {
    localStorage.setItem('assetBuddy.auth.user', JSON.stringify({
      id: 'finance-1',
      email: 'finance@example.com',
      first_name: 'Finance',
      last_name: 'User',
      role: 'finance',
    }));

    localStorage.setItem('awash-itam-theme:finance-1', 'dark');

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('style').textContent).toBe('classic');

    fireEvent.click(screen.getByRole('button', { name: 'Set dark' }));
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(localStorage.getItem('awash-itam-theme:finance-1')).toBeNull();
  });
});

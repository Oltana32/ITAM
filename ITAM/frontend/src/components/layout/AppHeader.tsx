import { useEffect, useState } from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getCurrentUserRole, UserRole } from '@/lib/authRole';
import { authFetch, clearAuthSession } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

interface AppHeaderProps {
  onOpenSearch: () => void;
}

export function AppHeader({ onOpenSearch }: AppHeaderProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  const [role, setRole] = useState<UserRole>(getCurrentUserRole());
  const [backendHealth, setBackendHealth] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [backendMessage, setBackendMessage] = useState('Checking backend...');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await authFetch('/api/');
        if (response.ok) {
          setBackendHealth('healthy');
          setBackendMessage('Backend healthy');
          return;
        }
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || payload.error || response.statusText || 'Backend error';
        setBackendHealth('unhealthy');
        setBackendMessage(`${message} (${response.status})`);
      } catch (error) {
        setBackendHealth('unhealthy');
        setBackendMessage(error instanceof Error ? error.message : 'Network error');
      }
    };

    checkBackend();
    const interval = window.setInterval(checkBackend, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onRoleChanged = () => setRole(getCurrentUserRole());
    window.addEventListener('asset-buddy-role-changed', onRoleChanged);
    return () => window.removeEventListener('asset-buddy-role-changed', onRoleChanged);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-6 backdrop-blur-md">
      <Button
        variant="outline"
        onClick={onOpenSearch}
        className="h-9 w-full max-w-sm justify-start gap-2 px-3 text-sm text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search assets, pages…</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          {isMac ? <><CommandIcon className="h-3 w-3" />K</> : 'Ctrl K'}
        </kbd>
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground" title={backendMessage}>
          <span
            className={`h-2.5 w-2.5 rounded-full ${backendHealth === 'healthy' ? 'bg-emerald-500' : backendHealth === 'unhealthy' ? 'bg-destructive' : 'bg-slate-500'}`}
          />
          <span>
            {backendHealth === 'healthy'
              ? 'Backend OK'
              : backendHealth === 'unhealthy'
              ? 'Backend unavailable'
              : 'Checking backend...'}
          </span>
        </div>
        <Badge variant="secondary" className="capitalize">{role.replace('_', ' ')}</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearAuthSession();
            window.location.href = "/login";
          }}
        >
          Logout
        </Button>
        <Link to="/notifications">
          <Button variant="outline" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
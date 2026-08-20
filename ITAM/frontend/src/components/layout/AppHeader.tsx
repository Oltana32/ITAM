import { useEffect, useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getCurrentUserRole, UserRole } from '@/lib/authRole';
import { authFetch, clearAuthSession } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppHeaderProps {
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
}

export function AppHeader({ onOpenSearch, onToggleSidebar }: AppHeaderProps) {
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
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b border-border/60 bg-background/80 px-3 py-2 backdrop-blur-md sm:px-6">
      {onToggleSidebar && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 md:hidden" onClick={onToggleSidebar}>
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open navigation menu</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={onOpenSearch}
            className="h-9 flex-1 justify-start gap-2 px-3 text-sm text-muted-foreground sm:max-w-sm"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search everything</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Search pages, assets, actions, and system shortcuts</TooltipContent>
      </Tooltip>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground sm:flex" title={backendMessage}>
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
        <Badge variant="secondary" className="hidden capitalize sm:inline-flex">{role.replace('_', ' ')}</Badge>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Sign out of the current session</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/notifications">
              <Button variant="outline" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open notifications</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ThemeToggle />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Switch theme</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
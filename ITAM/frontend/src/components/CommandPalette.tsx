import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Package, Users, MapPin, Wrench,
  KeySquare, BarChart3, Factory, Bell, Settings, UserCircle,
  Plus, ScanLine, Moon, Sun, ClipboardCheck,
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { getCurrentUserRole, UserRole } from '@/lib/authRole';
import { canAccessPath } from '@/lib/permissions';
import { isAuthenticated } from '@/lib/auth';

const pages = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Asset Audit', href: '/audits', icon: ClipboardCheck },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Software & Licenses', href: '/software', icon: KeySquare },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Manufacturers', href: '/manufacturers', icon: Factory },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export function CommandPalette() {
  if (!isAuthenticated()) return null;
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(getCurrentUserRole());
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const onRoleChanged = () => setRole(getCurrentUserRole());
    window.addEventListener('asset-buddy-role-changed', onRoleChanged);
    return () => window.removeEventListener('asset-buddy-role-changed', onRoleChanged);
  }, []);

  const visiblePages = pages.filter((p) => canAccessPath(role, p.href));

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search assets, navigate, or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => go('/assets')}>
            <Plus className="mr-2 h-4 w-4" /> Add new asset
          </CommandItem>
          <CommandItem onSelect={() => go('/assets')}>
            <ScanLine className="mr-2 h-4 w-4" /> Scan QR code
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {visiblePages.map((p) => (
            <CommandItem key={p.href} onSelect={() => go(p.href)}>
              <p.icon className="mr-2 h-4 w-4" />
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => { setTheme('light'); setOpen(false); }}>
            <Sun className="mr-2 h-4 w-4" /> Switch to light mode
          </CommandItem>
          <CommandItem onSelect={() => { setTheme('dark'); setOpen(false); }}>
            <Moon className="mr-2 h-4 w-4" /> Switch to dark mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useAssets } from '@/hooks/useAssets';

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<UserRole>(getCurrentUserRole());
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useTheme();
  const { assets } = useAssets();

  useEffect(() => {
    const toggleOpen = () => setOpen((o) => !o);

    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleOpen();
      }
    };

    const openSearch = () => {
      setOpen(true);
    };

    document.addEventListener('keydown', down);
    window.addEventListener('asset-buddy-open-search', openSearch);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('asset-buddy-open-search', openSearch);
    };
  }, []);

  useEffect(() => {
    const onRoleChanged = () => setRole(getCurrentUserRole());
    window.addEventListener('asset-buddy-role-changed', onRoleChanged);
    return () => window.removeEventListener('asset-buddy-role-changed', onRoleChanged);
  }, []);

  const visiblePages = pages.filter((p) => canAccessPath(role, p.href));

  const normalizedQuery = query.trim().toLowerCase();

  const currentPageResults = useMemo(() => {
    if (location.pathname !== '/assets' || !normalizedQuery) return [];

    return assets
      .filter((asset) => {
        const haystack = [asset.name, asset.assetTag, asset.serialNumber, asset.manufacturer, asset.model]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 6)
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        subtitle: `${asset.assetTag || 'No tag'} • ${asset.status}`,
        href: '/assets',
      }));
  }, [assets, location.pathname, normalizedQuery]);

  const globalResults = useMemo(() => {
    if (!normalizedQuery) return [];

    const pageMatches = visiblePages
      .filter((page) => page.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 6)
      .map((page) => ({
        id: `page-${page.href}`,
        name: page.name,
        subtitle: 'Page',
        href: page.href,
      }));

    const actionMatches = [
      { name: 'Add new asset', subtitle: 'Quick action', href: '/assets' },
      { name: 'Scan QR code', subtitle: 'Quick action', href: '/assets' },
      { name: 'Open notifications', subtitle: 'Quick action', href: '/notifications' },
      { name: 'Open settings', subtitle: 'Quick action', href: '/settings' },
    ].filter((action) => action.name.toLowerCase().includes(normalizedQuery));

    return [...pageMatches, ...actionMatches.map((action) => ({
      id: `action-${action.href}-${action.name}`,
      name: action.name,
      subtitle: action.subtitle,
      href: action.href,
    }))];
  }, [normalizedQuery, visiblePages]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    navigate(href);
  };

  const goToAssetsSearch = (term: string) => {
    const search = term.trim();
    setOpen(false);
    setQuery('');
    navigate(search ? `/assets?search=${encodeURIComponent(search)}` : '/assets');
  };

  const searchResults = [...currentPageResults, ...globalResults];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search everything in the system…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {searchResults.length > 0 && (
          <>
            <CommandGroup heading={currentPageResults.length > 0 ? 'Current Page & Global Matches' : 'Global Matches'}>
              {searchResults.map((item) => (
                <CommandItem key={item.id} onSelect={() => item.href === '/assets' && item.subtitle === 'Quick action' ? go('/assets') : item.href === '/assets' ? goToAssetsSearch(item.name) : go(item.href)}>
                  <Package className="mr-2 h-4 w-4" />
                  <span className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

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
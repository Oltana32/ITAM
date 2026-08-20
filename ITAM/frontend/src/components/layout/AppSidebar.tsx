import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  MapPin,
  Wrench,
  KeySquare,
  BarChart3,
  Factory,
  Bell,
  Settings,
  UserCircle,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import awashLogo from '@/assets/awash-wine-logo.png';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getCurrentUserRole, UserRole } from '@/lib/authRole';
import { canAccessPath } from '@/lib/permissions';

const mainNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Locations', href: '/locations', icon: MapPin },
];

const operationsNav = [
  { name: 'Asset Assignments', href: '/assignments', icon: ClipboardList },
  { name: 'Asset Audit', href: '/audits', icon: ClipboardCheck },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Software & Licenses', href: '/software', icon: KeySquare },
];

const insightsNav = [
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Manufacturers', href: '/manufacturers', icon: Factory },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

const bottomNav = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

function NavItem({ item, isActive }: { item: typeof mainNav[0]; isActive: boolean }) {
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 group relative',
        isActive
          ? 'bg-sidebar-primary/15 text-sidebar-primary shadow-sm shadow-sidebar-primary/10'
          : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary shadow-[0_0_8px_hsl(var(--sidebar-primary)/0.6)]" />
      )}
      <item.icon
        className={cn(
          'h-[17px] w-[17px] shrink-0 transition-all duration-200',
          isActive ? 'text-sidebar-primary' : 'group-hover:text-sidebar-primary/70'
        )}
      />
      <span className="flex-1 truncate">{item.name}</span>
      {isActive && (
        <ChevronRight className="h-3 w-3 text-sidebar-primary/50" />
      )}
    </Link>
  );
}

function NavSection({ label, items }: { label: string; items: typeof mainNav }) {
  const location = useLocation();

  return (
    <div className="mb-1">
      <p className="px-4 mb-2 text-[10px] font-bold tracking-[0.15em] uppercase text-sidebar-foreground/30">
        {label}
      </p>
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          return <NavItem key={item.name} item={item} isActive={isActive} />;
        })}
      </div>
    </div>
  );
}

export function AppSidebar({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation();
  const [role, setRole] = useState<UserRole>(getCurrentUserRole());

  useEffect(() => {
    const onRoleChanged = () => setRole(getCurrentUserRole());
    window.addEventListener('asset-buddy-role-changed', onRoleChanged);
    return () => window.removeEventListener('asset-buddy-role-changed', onRoleChanged);
  }, []);

  const filteredMainNav = useMemo(() => mainNav.filter((item) => canAccessPath(role, item.href)), [role]);
  const filteredOperationsNav = useMemo(() => operationsNav.filter((item) => canAccessPath(role, item.href)), [role]);
  const filteredInsightsNav = useMemo(() => insightsNav.filter((item) => canAccessPath(role, item.href)), [role]);
  const filteredBottomNav = useMemo(() => bottomNav.filter((item) => canAccessPath(role, item.href)), [role]);

  return (
    <aside className={cn(
      'flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
      mobile ? 'w-full' : 'fixed left-0 top-0 z-40 h-screen w-60'
    )}>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4 shrink-0">
        <img src={awashLogo} alt="Awash Wine S.C. Logo" className="h-9 w-9 rounded-lg object-contain" />
        <div>
          <span className="text-[15px] font-bold tracking-tight">Awash Wine</span>
          <p className="text-[9px] text-sidebar-foreground/35 font-semibold tracking-[0.12em] uppercase -mt-0.5">
            IT Asset Mgmt
          </p>
        </div>
      </div>

      {/* Scrollable nav */}
      <ScrollArea className="flex-1 py-3">
        <NavSection label="Overview" items={filteredMainNav} />
        <Separator className="my-2.5 mx-4 bg-sidebar-border/50" />
        <NavSection label="Operations" items={filteredOperationsNav} />
        <Separator className="my-2.5 mx-4 bg-sidebar-border/50" />
        <NavSection label="Insights" items={filteredInsightsNav} />
      </ScrollArea>

      {/* Bottom nav */}
      <div className="border-t border-sidebar-border p-2 shrink-0 space-y-0.5">
        {filteredBottomNav.map((item) => {
          const isActive = location.pathname === item.href;
          return <NavItem key={item.name} item={item} isActive={isActive} />;
        })}
      </div>
    </aside>
  );
}

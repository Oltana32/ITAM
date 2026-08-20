import { ReactNode, useState } from 'react';
import { Menu } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [, setTick] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openSearch = () => {
    window.dispatchEvent(new Event('asset-buddy-open-search'));
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <main className="min-h-screen md:pl-60">
        <AppHeader onOpenSearch={openSearch} onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[280px] p-0">
          <AppSidebar mobile />
        </SheetContent>
      </Sheet>
    </div>
  );
}

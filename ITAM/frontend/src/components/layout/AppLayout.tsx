import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Search state mirrors the global Cmd+K shortcut by dispatching a key event.
  const [, setTick] = useState(0);
  const openSearch = () => {
    const evt = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true });
    document.dispatchEvent(evt);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-60">
        <AppHeader onOpenSearch={openSearch} />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

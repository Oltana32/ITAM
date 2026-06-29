import { AssetCategory } from '@/types/asset';
import {
  Laptop,
  Monitor,
  Server,
  Smartphone,
  Tablet,
  Network,
  MonitorSmartphone,
  Package,
  Printer,
} from 'lucide-react';

const categoryIcons: Record<AssetCategory, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  desktop: MonitorSmartphone,
  monitor: Monitor,
  server: Server,
  phone: Smartphone,
  tablet: Tablet,
  network: Network,
  equipment: Printer,
  other: Package,
};

interface CategoryIconProps {
  category: AssetCategory;
  className?: string;
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = categoryIcons[category];
  return <Icon className={className} />;
}

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Asset } from '@/types/asset';
import { StatusBadge } from '@/components/assets/StatusBadge';
import { CategoryIcon } from '@/components/assets/CategoryIcon';

interface RecentAssetsProps {
  assets: Asset[];
}

export function RecentAssets({ assets }: RecentAssetsProps) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Assets</CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary gap-1">
          <Link to="/assets">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assets.slice(0, 5).map((asset, index) => (
            <div
              key={asset.id}
              className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/20 p-3 transition-all duration-200 hover:bg-muted/50 hover:border-border/60 hover:shadow-sm group"
              style={{ animationDelay: `${0.5 + index * 0.05}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border/50 group-hover:ring-primary/20 transition-all">
                <CategoryIcon category={asset.category} className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate group-hover:text-primary transition-colors">{asset.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{asset.assetTag}</p>
              </div>
              <StatusBadge status={asset.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

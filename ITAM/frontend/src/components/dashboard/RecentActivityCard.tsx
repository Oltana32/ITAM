import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { useActivityLog } from '@/hooks/useActivityLog';
import { AssetActivityTimeline } from '@/components/assets/AssetActivityTimeline';

export function RecentActivityCard() {
  const { entries } = useActivityLog();
  return (
    <Card className="card-hover animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AssetActivityTimeline entries={entries.slice(0, 8)} />
      </CardContent>
    </Card>
  );
}
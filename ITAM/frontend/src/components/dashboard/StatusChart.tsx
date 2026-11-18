import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetStatus, statusLabels } from '@/types/asset';

interface StatusChartProps {
  data: { status: AssetStatus; count: number }[];
}

const STATUS_COLORS: Record<AssetStatus, string> = {
  procured: 'hsl(210, 30%, 55%)',
  received: 'hsl(200, 60%, 45%)',
  in_stock: 'hsl(220, 80%, 60%)',
  available: 'hsl(217, 91%, 50%)',
  ready: 'hsl(165, 70%, 45%)',
  assigned: 'hsl(142, 76%, 36%)',
  'in-use': 'hsl(142, 76%, 28%)',
  maintenance: 'hsl(38, 92%, 50%)',
  overdue: 'hsl(24, 85%, 55%)',
  returned: 'hsl(182, 78%, 45%)',
  found: 'hsl(255, 70%, 65%)',
  retired: 'hsl(215, 16%, 47%)',
  disposed: 'hsl(0, 72%, 46%)',
  lost: 'hsl(0, 65%, 55%)',
  damaged: 'hsl(30, 90%, 48%)',
};

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((item) => ({
    name: statusLabels[item.status],
    value: item.count,
    status: item.status,
  }));

  return (
    <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Assets by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px -10px rgba(0,0,0,0.15)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

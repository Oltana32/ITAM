import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetStatus, statusLabels } from '@/types/asset';

interface StatusChartProps {
  data: { status: AssetStatus; count: number }[];
}

const STATUS_COLORS: Record<AssetStatus, string> = {
  'in-use': 'hsl(142, 76%, 36%)',
  available: 'hsl(217, 91%, 50%)',
  maintenance: 'hsl(38, 92%, 50%)',
  retired: 'hsl(215, 16%, 47%)',
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

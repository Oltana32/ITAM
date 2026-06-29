import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetCategory, categoryLabels } from '@/types/asset';

interface CategoryChartProps {
  data: { category: AssetCategory; count: number }[];
}

const COLORS = [
  'hsl(217, 91%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
  'hsl(215, 16%, 47%)',
  'hsl(180, 70%, 45%)',
  'hsl(330, 80%, 50%)',
];

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map((item) => ({
    name: categoryLabels[item.category],
    value: item.count,
  }));

  return (
    <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Assets by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px -10px rgba(0,0,0,0.15)',
                  fontSize: '13px',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

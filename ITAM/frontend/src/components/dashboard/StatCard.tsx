import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  index?: number;
}

export function StatCard({ title, value, icon, trend, className, index = 0 }: StatCardProps) {
  return (
    <Card 
      className={cn(
        'relative overflow-hidden card-hover group animate-fade-in-up border-border/50',
        className
      )}
      style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'backwards' }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground pt-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    trend.value >= 0 
                      ? 'bg-[hsl(var(--status-active-bg))] text-[hsl(var(--status-active))]' 
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {trend.value >= 0 ? '↑' : '↓'}
                  {Math.abs(trend.value)}%
                </span>{' '}
                <span className="text-muted-foreground/70">{trend.label}</span>
              </p>
            )}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 p-3 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
            {icon}
          </div>
        </div>
      </CardContent>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Card>
  );
}

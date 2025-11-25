import { DailyMetrics, Granularity } from "@/types/metrics";
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatDateByGranularity } from "@/utils/dataAggregation";

interface RevenueChartProps {
  data: DailyMetrics[];
  granularity: Granularity;
}

export const RevenueChart = ({ data, granularity }: RevenueChartProps) => {
  const chartData = data.map((d) => ({
    date: formatDateByGranularity(d.date, granularity),
    revenue: d.revenue,
    adSpend: d.adSpend,
    roas: d.roas,
  }));
  
  const showLabels = data.length <= 14;

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Receita vs Gastos com Anúncios & ROAS</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="hsl(217, 91%, 60%)" name="Receita ($)">
            {showLabels && (
              <LabelList dataKey="revenue" position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} />
            )}
          </Bar>
          <Bar yAxisId="left" dataKey="adSpend" fill="hsl(220, 13%, 70%)" name="Gasto com Anúncios ($)">
            {showLabels && (
              <LabelList dataKey="adSpend" position="top" style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }} />
            )}
          </Bar>
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="roas" 
            stroke="hsl(142, 76%, 36%)" 
            strokeWidth={2}
            name="ROAS"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};

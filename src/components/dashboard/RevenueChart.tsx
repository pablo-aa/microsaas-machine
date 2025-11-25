import { DailyMetrics } from "@/types/metrics";
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
} from "recharts";
import { Card } from "@/components/ui/card";

interface RevenueChartProps {
  data: DailyMetrics[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: d.revenue,
    adSpend: d.adSpend,
    roas: d.roas,
  }));

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Daily Revenue vs Ad Spend & ROAS</h3>
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
          <Bar yAxisId="left" dataKey="revenue" fill="hsl(217, 91%, 60%)" name="Revenue ($)" />
          <Bar yAxisId="left" dataKey="adSpend" fill="hsl(220, 13%, 70%)" name="Ad Spend ($)" />
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

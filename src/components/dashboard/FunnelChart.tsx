import { DailyMetrics } from "@/types/metrics";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface FunnelChartProps {
  data: DailyMetrics[];
}

export const FunnelChart = ({ data }: FunnelChartProps) => {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    formsSubmitted: d.formsSubmitted,
    paymentStarted: d.paymentStarted,
    paymentApproved: d.paymentApproved,
  }));

  // Calculate average conversions for the displayed period
  const totalForms = data.reduce((sum, d) => sum + d.formsSubmitted, 0);
  const totalStarted = data.reduce((sum, d) => sum + d.paymentStarted, 0);
  const totalApproved = data.reduce((sum, d) => sum + d.paymentApproved, 0);

  const convFormToStart = ((totalStarted / totalForms) * 100).toFixed(2);
  const convStartToApproved = ((totalApproved / totalStarted) * 100).toFixed(2);
  const convFormToApproved = ((totalApproved / totalForms) * 100).toFixed(2);

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Daily Funnel</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
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
          <Bar dataKey="formsSubmitted" fill="hsl(217, 91%, 60%)" name="Forms Submitted" />
          <Bar dataKey="paymentStarted" fill="hsl(45, 93%, 47%)" name="Payment Started" />
          <Bar dataKey="paymentApproved" fill="hsl(142, 76%, 36%)" name="Payment Approved" />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-accent rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Forms → Started</p>
          <p className="text-2xl font-semibold text-foreground">{convFormToStart}%</p>
        </div>
        <div className="p-4 bg-accent rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Started → Approved</p>
          <p className="text-2xl font-semibold text-foreground">{convStartToApproved}%</p>
        </div>
        <div className="p-4 bg-accent rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Forms → Approved</p>
          <p className="text-2xl font-semibold text-foreground">{convFormToApproved}%</p>
        </div>
      </div>
    </Card>
  );
};

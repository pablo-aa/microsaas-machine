import { useState, useMemo } from "react";
import { DailyMetrics, Granularity } from "@/types/metrics";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aggregateData, formatDateByGranularity } from "@/utils/dataAggregation";

interface FunnelChartProps {
  data: DailyMetrics[];
}

export const FunnelChart = ({ data }: FunnelChartProps) => {
  const [granularity, setGranularity] = useState<Granularity>("day");
  
  const aggregatedData = useMemo(() => {
    return aggregateData(data, granularity);
  }, [data, granularity]);
  
  const chartData = aggregatedData.map((d) => ({
    date: formatDateByGranularity(d.date, granularity),
    formsSubmitted: d.formsSubmitted,
    paymentStarted: d.paymentStarted,
    paymentApproved: d.paymentApproved,
  }));
  
  const showLabels = aggregatedData.length <= 14;
  const showGranularitySelector = data.length > 14;

  // Calculate average conversions for the displayed period
  const totalForms = aggregatedData.reduce((sum, d) => sum + d.formsSubmitted, 0);
  const totalStarted = aggregatedData.reduce((sum, d) => sum + d.paymentStarted, 0);
  const totalApproved = aggregatedData.reduce((sum, d) => sum + d.paymentApproved, 0);

  const convFormToStart = ((totalStarted / totalForms) * 100).toFixed(2);
  const convStartToApproved = ((totalApproved / totalStarted) * 100).toFixed(2);
  const convFormToApproved = ((totalApproved / totalForms) * 100).toFixed(2);

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Funil Diário</h3>
        {showGranularitySelector && (
          <Select value={granularity} onValueChange={(value) => setGranularity(value as Granularity)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por dia</SelectItem>
              <SelectItem value="week">Por semana</SelectItem>
              <SelectItem value="month">Por mês</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: number) => Math.round(value)}
          />
          <Legend />
          <Bar dataKey="formsSubmitted" fill="hsl(217, 91%, 60%)" name="Formulários Enviados">
            {showLabels && (
              <LabelList 
                dataKey="formsSubmitted" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => Math.round(value)}
              />
            )}
          </Bar>
          <Bar dataKey="paymentStarted" fill="hsl(45, 93%, 47%)" name="Pagamento Iniciado">
            {showLabels && (
              <LabelList 
                dataKey="paymentStarted" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => Math.round(value)}
              />
            )}
          </Bar>
          <Bar dataKey="paymentApproved" fill="hsl(142, 76%, 36%)" name="Pagamento Aprovado">
            {showLabels && (
              <LabelList 
                dataKey="paymentApproved" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => Math.round(value)}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-accent rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Formulários → Iniciados</p>
          <p className="text-2xl font-semibold text-foreground">{convFormToStart}%</p>
        </div>
        <div className="p-4 bg-accent rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Iniciados → Aprovados</p>
          <p className="text-2xl font-semibold text-foreground">{convStartToApproved}%</p>
        </div>
        <div className="p-4 bg-accent rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Formulários → Aprovados</p>
          <p className="text-2xl font-semibold text-foreground">{convFormToApproved}%</p>
        </div>
      </div>
    </Card>
  );
};

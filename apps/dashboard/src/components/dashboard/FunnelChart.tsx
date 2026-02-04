import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { aggregateData, formatDateByGranularity } from "@/utils/dataAggregation";

interface FunnelChartProps {
  data: DailyMetrics[];
}

export const FunnelChart = ({ data }: FunnelChartProps) => {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [showConvFormToStart, setShowConvFormToStart] = useState<boolean>(true);
  const [showConvStartToApproved, setShowConvStartToApproved] = useState<boolean>(false);
  const [showConvFormToApproved, setShowConvFormToApproved] = useState<boolean>(false);
  
  const aggregatedData = useMemo(() => {
    return aggregateData(data, granularity);
  }, [data, granularity]);
  
  const chartData = aggregatedData.map((d) => ({
    date: formatDateByGranularity(d.date, granularity),
    formsSubmitted: d.formsSubmitted,
    paymentStarted: d.paymentStarted,
    paymentApproved: d.paymentApproved,
    convFormToStart: d.conversionFormToStart,
    convStartToApproved: d.conversionStartToApproved,
    convFormToApproved: d.conversionFormToApproved,
  }));
  
  const showLabels = aggregatedData.length <= 14;
  const showGranularitySelector = data.length >= 7;

  // Calculate average conversions for the displayed period
  const totalForms = aggregatedData.reduce((sum, d) => sum + d.formsSubmitted, 0);
  const totalStarted = aggregatedData.reduce((sum, d) => sum + d.paymentStarted, 0);
  const totalApproved = aggregatedData.reduce((sum, d) => sum + d.paymentApproved, 0);

  const convFormToStart = ((totalStarted / totalForms) * 100).toFixed(2);
  const convStartToApproved = ((totalApproved / totalStarted) * 100).toFixed(2);
  const convFormToApproved = ((totalApproved / totalForms) * 100).toFixed(2);

  return (
    <Card className="p-6 border border-border rounded-lg bg-card">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-foreground">Funil diário</h3>
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
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium mr-1">Linhas de conversão:</span>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <Checkbox
                checked={showConvFormToStart}
                onCheckedChange={(v) => setShowConvFormToStart(Boolean(v))}
              />
              <span>F→I (%)</span>
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <Checkbox
                checked={showConvStartToApproved}
                onCheckedChange={(v) => setShowConvStartToApproved(Boolean(v))}
              />
              <span>I→A (%)</span>
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <Checkbox
                checked={showConvFormToApproved}
                onCheckedChange={(v) => setShowConvFormToApproved(Boolean(v))}
              />
              <span>F→A (%)</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <span>F→I: pessoas que enviaram formulário e iniciaram pagamento</span>
            <span>· I→A: iniciaram pagamento e viraram pagantes</span>
            <span>· F→A: pessoas que enviaram o formulário e pagaram</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            tickFormatter={(value) => `${value}%`}
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
          <Bar yAxisId="left" dataKey="formsSubmitted" fill="hsl(217, 91%, 60%)" name="Formulários Enviados">
            {showLabels && (
              <LabelList 
                dataKey="formsSubmitted" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => Math.round(value)}
              />
            )}
          </Bar>
          <Bar yAxisId="left" dataKey="paymentStarted" fill="hsl(45, 93%, 47%)" name="Pagamento Iniciado">
            {showLabels && (
              <LabelList 
                dataKey="paymentStarted" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => Math.round(value)}
              />
            )}
          </Bar>
          <Bar yAxisId="left" dataKey="paymentApproved" fill="hsl(142, 76%, 36%)" name="Pagamento Aprovado">
            {showLabels && (
              <LabelList 
                dataKey="paymentApproved" 
                position="top" 
                style={{ fontSize: '10px', fill: 'hsl(var(--foreground))' }}
                formatter={(value: number) => Math.round(value)}
              />
            )}
          </Bar>
          {showConvFormToStart && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="convFormToStart"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              name="F→I (%)"
              dot={false}
            />
          )}
          {showConvStartToApproved && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="convStartToApproved"
              stroke="hsl(45, 93%, 47%)"
              strokeWidth={2}
              name="I→A (%)"
              dot={false}
            />
          )}
          {showConvFormToApproved && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="convFormToApproved"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              name="F→A (%)"
              dot={false}
            />
          )}
        </ComposedChart>
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

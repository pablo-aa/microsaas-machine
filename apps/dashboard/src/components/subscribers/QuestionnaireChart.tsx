import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getQuestionnaireLabel } from "@/utils/questionnaireLabels";

interface QuestionnaireStat {
  option: string;
  count: number;
  percentage: number;
}

interface QuestionnaireChartProps {
  data: {
    question: string;
    totalResponses: number;
    stats: QuestionnaireStat[];
  } | null;
}

export const QuestionnaireChart = ({ data }: QuestionnaireChartProps) => {
  if (!data || data.stats.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma resposta encontrada para esta pergunta
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = data.stats.map((stat) => ({
    option: stat.option,
    label: getQuestionnaireLabel(data.question, stat.option),
    count: stat.count,
    percentage: stat.percentage,
  }));

  // Cores para as barras (gradiente)
  const colors = [
    "hsl(217, 91%, 60%)",
    "hsl(217, 91%, 55%)",
    "hsl(217, 91%, 50%)",
    "hsl(217, 91%, 45%)",
    "hsl(217, 91%, 40%)",
    "hsl(217, 91%, 35%)",
    "hsl(217, 91%, 30%)",
  ];

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-1">{data.label}</p>
          <p className="text-xs text-muted-foreground">
            {data.count} resposta{data.count !== 1 ? "s" : ""} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Total de respostas: <span className="font-semibold text-foreground">{data.totalResponses}</span>
        </p>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300, data.stats.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            type="number"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            type="category"
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            width={180}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

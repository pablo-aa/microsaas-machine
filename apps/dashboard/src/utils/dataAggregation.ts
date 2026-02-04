import { DailyMetrics, Granularity } from "@/types/metrics";
import { startOfWeek, startOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const aggregateData = (
  data: DailyMetrics[],
  granularity: Granularity
): DailyMetrics[] => {
  if (granularity === "day") {
    return data;
  }

  const grouped = new Map<string, DailyMetrics[]>();

  data.forEach((metric) => {
    const date = parseISO(metric.date);
    let key: string;

    if (granularity === "week") {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      key = format(weekStart, "yyyy-MM-dd");
    } else {
      const monthStart = startOfMonth(date);
      key = format(monthStart, "yyyy-MM-dd");
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(metric);
  });

  return Array.from(grouped.entries()).map(([dateKey, metrics]) => {
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalAdSpend = metrics.reduce((sum, m) => sum + m.adSpend, 0);
    const totalFormsSubmitted = metrics.reduce((sum, m) => sum + m.formsSubmitted, 0);
    const totalPaymentStarted = metrics.reduce((sum, m) => sum + m.paymentStarted, 0);
    const totalPaymentApproved = metrics.reduce((sum, m) => sum + m.paymentApproved, 0);

    const avgRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
    const conversionFormToStart =
      totalFormsSubmitted > 0 ? (totalPaymentStarted / totalFormsSubmitted) * 100 : 0;
    const conversionStartToApproved =
      totalPaymentStarted > 0 ? (totalPaymentApproved / totalPaymentStarted) * 100 : 0;
    const conversionFormToApproved =
      totalFormsSubmitted > 0 ? (totalPaymentApproved / totalFormsSubmitted) * 100 : 0;

    return {
      date: dateKey,
      revenue: totalRevenue,
      adSpend: totalAdSpend,
      roas: avgRoas,
      formsSubmitted: totalFormsSubmitted,
      paymentStarted: totalPaymentStarted,
      paymentApproved: totalPaymentApproved,
      conversionFormToStart,
      conversionStartToApproved,
      conversionFormToApproved,
    };
  });
};

export const formatDateByGranularity = (dateStr: string, granularity: Granularity): string => {
  const date = parseISO(dateStr);
  
  if (granularity === "day") {
    return format(date, "dd/MM", { locale: ptBR });
  } else if (granularity === "week") {
    return `Semana ${format(date, "dd/MM", { locale: ptBR })}`;
  } else {
    return format(date, "MMM/yy", { locale: ptBR });
  }
};

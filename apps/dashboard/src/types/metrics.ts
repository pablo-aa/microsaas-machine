export type DailyMetrics = {
  date: string; // ISO date like "2025-01-01"
  revenue: number;
  adSpend: number;
  roas: number;
  formsSubmitted: number;
  paymentStarted: number;
  paymentApproved: number;
  conversionFormToStart: number;
  conversionStartToApproved: number;
  conversionFormToApproved: number;
};

export type DateRange = "today" | "yesterday" | "7" | "14" | "30" | "all" | "custom";

export type CustomDateRange = {
  from: Date;
  to: Date;
};

export type Granularity = "day" | "week" | "month";

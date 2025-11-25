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

export type DateRange = "7" | "14" | "30";

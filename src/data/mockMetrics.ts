import { DailyMetrics } from "@/types/metrics";

// Generate 30 days of mock data
const generateMockData = (): DailyMetrics[] => {
  const data: DailyMetrics[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const formsSubmitted = Math.floor(Math.random() * 50) + 30;
    const paymentStarted = Math.floor(formsSubmitted * (0.4 + Math.random() * 0.3));
    const paymentApproved = Math.floor(paymentStarted * (0.6 + Math.random() * 0.3));
    
    const revenue = paymentApproved * (50 + Math.random() * 100);
    const adSpend = 100 + Math.random() * 200;
    const roas = revenue / adSpend;
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(revenue * 100) / 100,
      adSpend: Math.round(adSpend * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      formsSubmitted,
      paymentStarted,
      paymentApproved,
      conversionFormToStart: Math.round((paymentStarted / formsSubmitted) * 100 * 100) / 100,
      conversionStartToApproved: Math.round((paymentApproved / paymentStarted) * 100 * 100) / 100,
      conversionFormToApproved: Math.round((paymentApproved / formsSubmitted) * 100 * 100) / 100,
    });
  }
  
  return data;
};

export const mockMetrics = generateMockData();

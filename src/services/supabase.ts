// Supabase API Service
// Handles communication with Supabase Edge Functions

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

export interface DayMetricResponse {
  date: string;
  forms_submitted: number;
  payments_initiated: number;
  payments_approved: number;
  revenue: number;
  cost: number;
  profit: number;
  roas: number | null;
}

export interface MetricsApiResponse {
  period: {
    start: string;
    end: string;
  };
  days: DayMetricResponse[];
  totals: {
    forms_submitted: number;
    payments_initiated: number;
    payments_approved: number;
    revenue: number;
    cost: number;
    profit: number;
    roas: number | null;
  };
}

/**
 * Fetch daily metrics from Supabase Edge Function
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise with metrics data
 */
export async function fetchDailyMetrics(
  startDate: string,
  endDate: string
): Promise<MetricsApiResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  const url = `${SUPABASE_URL}/functions/v1/get-daily-metrics`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to fetch metrics: ${response.statusText}`
      );
    }

    const data: MetricsApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    throw error;
  }
}

/**
 * Test connection to Supabase Edge Functions
 * @returns Promise<boolean> - true if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    await fetchDailyMetrics(today, today);
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}



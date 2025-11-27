// Supabase Edge Function: get-daily-metrics
// Purpose: Main orchestrator - combines get-analytics + Google Ads costs
// Author: Migrated from Python script generate-daily-metrics.py

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface DailyMetricsRequest {
  start_date: string; // Format: YYYY-MM-DD
  end_date: string;   // Format: YYYY-MM-DD
}

interface DayMetric {
  date: string;
  forms_submitted: number;
  payments_initiated: number;
  payments_approved: number;
  revenue: number;
  cost: number;
  profit: number;
  roas: number | null;
}

interface MetricsResponse {
  period: {
    start: string;
    end: string;
  };
  days: DayMetric[];
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

// Convert YYYY-MM-DD to DD/MM/YYYY HH:MM format for get-analytics
function formatDateForAnalytics(dateStr: string, isStart: boolean): string {
  const [year, month, day] = dateStr.split('-');
  const time = isStart ? '00:00' : '23:59';
  return `${day}/${month}/${year} ${time}`;
}

// Parse YYYY-MM-DD and generate array of dates
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Check if date is completed (yesterday or earlier) - Brazil timezone GMT-3
// Only cache dates that are fully completed (after 23:59 of that day)
function isDateCompleted(dateStr: string): boolean {
  const now = new Date();
  const brazilOffset = -3 * 60; // GMT-3 in minutes
  const brazilTime = new Date(now.getTime() + (now.getTimezoneOffset() + brazilOffset) * 60000);
  const today = brazilTime.toISOString().split('T')[0];
  
  // Date is completed if it's before today
  return dateStr < today;
}

// Fetch metrics from get-analytics edge function (with cache)
async function fetchDayMetrics(date: string, supabase: any): Promise<any> {
  const cacheKey = `get-analytics_${date}`;
  
  // Check cache (skip if date is not completed)
  if (isDateCompleted(date)) {
    const { data: cached, error } = await supabase
      .from("metrics_cache")
      .select("data")
      .eq("cache_key", cacheKey)
      .single();

    if (!error && cached) {
      console.log(`Metrics cache hit for ${date}`);
      return cached.data;
    }
  }

  // Fetch from get-analytics
  console.log(`Fetching metrics from get-analytics for ${date}`);
  
  const startDateTime = formatDateForAnalytics(date, true);
  const endDateTime = formatDateForAnalytics(date, false);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_date: startDateTime,
      end_date: endDateTime,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`get-analytics failed for ${date}:`, errorText);
    throw new Error(`Failed to fetch metrics for ${date}: ${response.statusText}`);
  }

  const data = await response.json();

  // Cache the response (only if date is completed)
  if (isDateCompleted(date)) {
    await supabase
      .from("metrics_cache")
      .upsert({
        cache_key: cacheKey,
        data,
      }, { onConflict: "cache_key" });
    
    console.log(`Cached metrics for ${date}`);
  }

  return data;
}

// Fetch costs for a date range from get-google-ads-cost edge function (range mode)
async function fetchCostsForRange(
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  console.log(`Fetching costs for range ${startDate} to ${endDate}`);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-google-ads-cost`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ start_date: startDate, end_date: endDate }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch costs for range ${startDate} to ${endDate}, using 0.0 for all days. Error:`,
      errorText,
    );
    return {};
  }

  const data = await response.json() as {
    costs?: { [date: string]: { cost_reais: number; cost_micros: number } };
  };

  const costsByDate: Record<string, number> = {};

  if (data.costs) {
    for (const [date, entry] of Object.entries(data.costs)) {
      costsByDate[date] = entry.cost_reais ?? 0.0;
    }
  }

  return costsByDate;
}

// Process and combine data for a single day
function processDayData(date: string, metricsData: any, cost: number): DayMetric {
  const metrics = metricsData.metrics || {};
  
  const formsSubmitted = metrics.forms_submitted || 0;
  const paymentsInitiated = metrics.payments_initiated || 0;
  const paymentsApproved = metrics.payments_approved || 0;
  const revenue = parseFloat(metrics.total_revenue || 0);
  
  const profit = revenue - cost;
  const roas = cost > 0 ? revenue / cost : null;

  return {
    date,
    forms_submitted: formsSubmitted,
    payments_initiated: paymentsInitiated,
    payments_approved: paymentsApproved,
    revenue: parseFloat(revenue.toFixed(2)),
    cost: parseFloat(cost.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    roas: roas ? parseFloat(roas.toFixed(2)) : null,
  };
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request
    const { start_date, end_date }: DailyMetricsRequest = await req.json();

    // Validate dates
    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "Missing start_date or end_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);

    if (endDateObj < startDateObj) {
      return new Response(
        JSON.stringify({ error: "end_date cannot be before start_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role (for cache access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate date range
    const dates = generateDateRange(start_date, end_date);
    console.log(`Processing ${dates.length} days from ${start_date} to ${end_date}`);

    // Pre-fetch all costs for the full range in chunks of up to 90 days (Google Ads safety)
    const costsByDate: Record<string, number> = {};
    const MAX_ADS_RANGE = 90;

    for (let i = 0; i < dates.length; i += MAX_ADS_RANGE) {
      const chunk = dates.slice(i, i + MAX_ADS_RANGE);
      const chunkStart = chunk[0];
      const chunkEnd = chunk[chunk.length - 1];

      console.log(`Fetching Google Ads costs for chunk ${chunkStart} to ${chunkEnd}`);
      const chunkCosts = await fetchCostsForRange(chunkStart, chunkEnd);

      for (const [date, cost] of Object.entries(chunkCosts)) {
        costsByDate[date] = cost;
      }
    }

    // Process days in batches (parallel processing with concurrency limit)
    const BATCH_SIZE = 5; // Process 5 days at a time to avoid overwhelming APIs
    const daysData: DayMetric[] = [];
    
    for (let i = 0; i < dates.length; i += BATCH_SIZE) {
      const batch = dates.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dates.length / BATCH_SIZE)} (${batch.length} days)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (date) => {
        try {
          // Fetch metrics (per day) and read cost from pre-fetched map
          const metricsData = await fetchDayMetrics(date, supabase);
          const cost = costsByDate[date] ?? 0.0;

          // Process and combine data
          const dayMetric = processDayData(date, metricsData, cost);
          console.log(`✓ Processed ${date}: revenue=${dayMetric.revenue}, cost=${dayMetric.cost}, profit=${dayMetric.profit}`);
          return dayMetric;
        } catch (error) {
          console.error(`Error processing ${date}:`, error);
          // Return day with zeros on error
          return {
            date,
            forms_submitted: 0,
            payments_initiated: 0,
            payments_approved: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            roas: null,
          } as DayMetric;
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      daysData.push(...batchResults);
    }

    // Calculate totals
    const totals = daysData.reduce((acc, day) => ({
      forms_submitted: acc.forms_submitted + day.forms_submitted,
      payments_initiated: acc.payments_initiated + day.payments_initiated,
      payments_approved: acc.payments_approved + day.payments_approved,
      revenue: acc.revenue + day.revenue,
      cost: acc.cost + day.cost,
      profit: acc.profit + day.profit,
      roas: null, // Will calculate after
    }), {
      forms_submitted: 0,
      payments_initiated: 0,
      payments_approved: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      roas: null,
    });

    // Calculate overall ROAS
    totals.roas = totals.cost > 0 ? parseFloat((totals.revenue / totals.cost).toFixed(2)) : null;
    totals.revenue = parseFloat(totals.revenue.toFixed(2));
    totals.cost = parseFloat(totals.cost.toFixed(2));
    totals.profit = parseFloat(totals.profit.toFixed(2));

    // Build response
    const response: MetricsResponse = {
      period: {
        start: start_date,
        end: end_date,
      },
      days: daysData,
      totals,
    };

    console.log(`✓ Successfully processed ${daysData.length} days`);
    console.log(`Totals: revenue=${totals.revenue}, cost=${totals.cost}, profit=${totals.profit}, roas=${totals.roas}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-daily-metrics:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


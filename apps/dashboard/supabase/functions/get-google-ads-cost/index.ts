// Supabase Edge Function: get-google-ads-cost
// Purpose:
// - Fetch Google Ads costs using google-ads-api library (non-official but works in Deno)
// - Supports:
//   - Single day:  { date }
//   - Range:       { start_date, end_date } -> returns map date -> cost
// Uses the same GAQL logic as the Python script

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleAdsApi, Customer } from "npm:google-ads-api";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface SingleDayCostRequest {
  date: string; // Format: YYYY-MM-DD
  force_refresh?: boolean; // Kept for backward compatibility (no effect now)
}

interface RangeCostRequest {
  start_date: string; // Format: YYYY-MM-DD
  end_date: string;   // Format: YYYY-MM-DD
}

type CostRequest = SingleDayCostRequest | RangeCostRequest;

interface SingleDayCostResponse {
  date: string;
  cost_reais: number;
  cost_micros: number;
  source: string;
  cached: boolean;
}

interface RangeCostResponse {
  start_date: string;
  end_date: string;
  costs: {
    [date: string]: {
      cost_reais: number;
      cost_micros: number;
    };
  };
  source: string;
}

// Get credentials from environment
function getCredentials() {
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
  const customerId = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
  const clientCustomerId = Deno.env.get("GOOGLE_ADS_CLIENT_CUSTOMER_ID");

  if (!developerToken || !clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Ads credentials not configured. Check Supabase secrets.");
  }

  const finalCustomerId = clientCustomerId || customerId;
  if (!finalCustomerId) {
    throw new Error("GOOGLE_ADS_CUSTOMER_ID not configured");
  }

  return {
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    customerId: finalCustomerId.replace(/-/g, ""), // Remove dashes
  };
}

// Create Google Ads client
function createGoogleAdsClient(credentials: any): GoogleAdsApi {
  return new GoogleAdsApi({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    developer_token: credentials.developerToken,
  });
}

// Get Customer object
function getCustomer(client: GoogleAdsApi, credentials: any): Customer {
  return client.Customer({
    customer_id: credentials.customerId,
    refresh_token: credentials.refreshToken,
  });
}

// Fetch cost for a single day from Google Ads API using GAQL (same query as Python script)
async function fetchCostForSingleDate(
  customer: Customer,
  date: string,
): Promise<{ cost_micros: number; cost_reais: number }> {
  const query = `
    SELECT
      segments.date,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date = '${date}'
  `;

  console.log(`Querying Google Ads for single date ${date}...`);
  console.log(`Query: ${query.trim()}`);

  try {
    const results = await customer.query(query);

    let totalCostMicros = 0;
    let foundData = false;

    for (const row of results) {
      foundData = true;
      const costMicros = row.metrics?.cost_micros || 0;
      totalCostMicros += Number(costMicros);
    }

    if (!foundData) {
      console.warn(`No cost data found for ${date}`);
      return { cost_micros: 0, cost_reais: 0.0 };
    }

    const costReais = totalCostMicros / 1000000.0;

    console.log(`Cost for ${date}: R$ ${costReais.toFixed(2)} (${totalCostMicros} micros)`);

    return {
      cost_micros: totalCostMicros,
      cost_reais: parseFloat(costReais.toFixed(2)),
    };
  } catch (error) {
    console.error(`Error fetching cost for ${date}:`, error);
    throw error;
  }
}

// Fetch costs for a date range in a single GAQL query
async function fetchCostsForRange(
  customer: Customer,
  startDate: string,
  endDate: string,
): Promise<RangeCostResponse> {
  const query = `
    SELECT
      segments.date,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `;

  console.log(`Querying Google Ads for range ${startDate} to ${endDate}...`);
  console.log(`Query: ${query.trim()}`);

  try {
    const results = await customer.query(query);

    const costs: RangeCostResponse["costs"] = {};

    for (const row of results) {
      const date = row.segments?.date;
      const costMicros = row.metrics?.cost_micros || 0;

      if (!date) continue;

      if (!costs[date]) {
        costs[date] = {
          cost_micros: 0,
          cost_reais: 0,
        };
      }

      costs[date].cost_micros += Number(costMicros);
    }

    // Convert micros to reais
    for (const date of Object.keys(costs)) {
      const entry = costs[date];
      const costReais = entry.cost_micros / 1000000.0;
      entry.cost_reais = parseFloat(costReais.toFixed(2));
    }

    console.log(
      `Costs for range ${startDate} to ${endDate}: ${JSON.stringify(costs, null, 2)}`,
    );

    return {
      start_date: startDate,
      end_date: endDate,
      costs,
      source: "google_ads",
    };
  } catch (error) {
    console.error(`Error fetching costs for range ${startDate} to ${endDate}:`, error);
    throw error;
  }
}

// Utility: validate YYYY-MM-DD
function isValidDate(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Utility: compare dates (YYYY-MM-DD)
function isEndBeforeStart(startDate: string, endDate: string): boolean {
  return new Date(endDate) < new Date(startDate);
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
    // Parse request as generic body
    const body = await req.json() as any;

    // Range mode: { start_date, end_date }
    if (body.start_date && body.end_date) {
      const start_date = body.start_date as string;
      const end_date = body.end_date as string;

      if (!isValidDate(start_date) || !isValidDate(end_date)) {
        return new Response(
          JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (isEndBeforeStart(start_date, end_date)) {
        return new Response(
          JSON.stringify({ error: "end_date cannot be before start_date" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Get credentials and create Google Ads client
      const credentials = getCredentials();
      const client = createGoogleAdsClient(credentials);
      const customer = getCustomer(client, credentials);

      const rangeResult = await fetchCostsForRange(customer, start_date, end_date);

      return new Response(
        JSON.stringify(rangeResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Single-day mode: { date }
    if (!body.date || !isValidDate(body.date)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const date = body.date as string;

    // Get credentials and create Google Ads client
    const credentials = getCredentials();
    const client = createGoogleAdsClient(credentials);
    const customer = getCustomer(client, credentials);

    console.log(`Fetching cost from Google Ads for single date ${date}`);
    const { cost_micros, cost_reais } = await fetchCostForSingleDate(customer, date);

    return new Response(
      JSON.stringify({
        date,
        cost_reais,
        cost_micros,
        source: "google_ads",
        cached: false,
      } as SingleDayCostResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("Error in get-google-ads-cost:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: stack || String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

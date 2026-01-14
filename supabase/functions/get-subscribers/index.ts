// Supabase Edge Function: get-subscribers
// Purpose: Fetch subscribers data with test info, payments and coupon usage
// Author: QC Admin Panel

import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse query parameters for pagination and search
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const searchTerm = url.searchParams.get("search") || "";

    console.log("[get-subscribers] Request:", { page, limit, offset, searchTerm });

    // Build query for payments
    let paymentsQuery = supabase
      .from("payments")
      .select(`
        id,
        test_id,
        payment_id,
        amount,
        original_amount,
        coupon_code,
        status,
        payment_method,
        email_campaign_id,
        user_email,
        created_at
      `, { count: 'exact' })
      .eq("status", "approved");

    // If search term provided, we need to search in all data first, then paginate
    let allPayments: any[] = [];
    let totalCount = 0;

    if (searchTerm) {
      // Get ALL approved payments for search
      const { data: allPaymentsData, error: allPaymentsError, count: allCount } = await paymentsQuery
        .order("created_at", { ascending: false });

      if (allPaymentsError) {
        console.error("[get-subscribers] Error fetching all payments:", allPaymentsError);
        throw new Error("Erro ao buscar assinantes");
      }

      allPayments = allPaymentsData || [];
      totalCount = allCount || 0;

      // Get all test_ids for search
      const allTestIds = [...new Set(allPayments.map((p: any) => p.test_id).filter(Boolean))];
      
      // Fetch all test_results
      const { data: allTestResults } = await supabase
        .from("test_results")
        .select(`
          id,
          session_id,
          name,
          email,
          age,
          created_at
        `)
        .in("id", allTestIds);

      // Create map
      const allTestResultsMap = new Map();
      (allTestResults || []).forEach((tr: any) => {
        allTestResultsMap.set(tr.id, tr);
      });

      // Transform and filter
      const searchLower = searchTerm.toLowerCase();
      allPayments = allPayments
        .map((payment: any) => {
          const testResult = payment.test_id ? allTestResultsMap.get(payment.test_id) : null;
          const emailCampaign = payment.email_campaign_id || null;
          
          return {
            payment,
            testResult,
            emailCampaign,
            transformed: {
              id: testResult?.id || payment.test_id,
              session_id: testResult?.session_id || null,
              name: testResult?.name || "N/A",
              email: testResult?.email || payment.user_email || "N/A",
              age: testResult?.age || null,
              test_link: (testResult?.id || payment.test_id) 
                ? `https://www.qualcarreira.com/resultado/${testResult?.id || payment.test_id}` 
                : null,
              coupon_code: payment.coupon_code || null,
              email_campaign: emailCampaign,
              payment_amount: payment.amount || 0,
              original_amount: payment.original_amount || 0,
              payment_date: payment.created_at,
              test_created_at: testResult?.created_at || null,
            },
          };
        })
        .filter((item: any) => {
          return (
            item.transformed.name.toLowerCase().includes(searchLower) ||
            item.transformed.email.toLowerCase().includes(searchLower) ||
            (item.transformed.coupon_code && item.transformed.coupon_code.toLowerCase().includes(searchLower)) ||
            (item.transformed.email_campaign && item.transformed.email_campaign.toLowerCase().includes(searchLower))
          );
        })
        .map((item: any) => item.transformed);

      totalCount = allPayments.length;
      
      // Apply pagination to filtered results
      allPayments = allPayments.slice(offset, offset + limit);
    } else {
      // No search - use normal pagination
      const { data: paymentsData, error: paymentsError, count: paymentsCount } = await paymentsQuery
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (paymentsError) {
        console.error("[get-subscribers] Error fetching payments:", paymentsError);
        throw new Error("Erro ao buscar assinantes");
      }

      allPayments = paymentsData || [];
      totalCount = paymentsCount || 0;
    }

    if (allPayments.length === 0) {
      // Still calculate average age even if no results
      const { data: allApprovedForAge } = await supabase
        .from("payments")
        .select("test_id")
        .eq("status", "approved");

      let averageAge = null;
      if (allApprovedForAge && allApprovedForAge.length > 0) {
        const allTestIdsForAge = [...new Set(allApprovedForAge.map((p: any) => p.test_id).filter(Boolean))];
        const { data: allTestResultsForAge } = await supabase
          .from("test_results")
          .select("age")
          .in("id", allTestIdsForAge)
          .not("age", "is", null);

        if (allTestResultsForAge && allTestResultsForAge.length > 0) {
          const ages = allTestResultsForAge.map((tr: any) => tr.age).filter((age: number) => age !== null);
          if (ages.length > 0) {
            const sum = ages.reduce((acc: number, age: number) => acc + age, 0);
            averageAge = Math.round((sum / ages.length) * 10) / 10;
          }
        }
      }

      return new Response(
        JSON.stringify({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          averageAge,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get unique test_ids from payments
    const testIds = [...new Set(allPayments.map((p: any) => p.test_id || p.id).filter(Boolean))];

    // Fetch test_results for these test_ids (if not already fetched)
    let testResults: any[] = [];
    let testResultsMap = new Map();
    
    if (!searchTerm) {
      // Only fetch if we didn't already fetch in search
      const { data: testResultsData, error: testResultsError } = await supabase
        .from("test_results")
        .select(`
          id,
          session_id,
          name,
          email,
          age,
          created_at
        `)
        .in("id", testIds);

      if (testResultsError) {
        console.error("[get-subscribers] Error fetching test_results:", testResultsError);
      } else {
        testResults = testResultsData || [];
        testResults.forEach((tr: any) => {
          testResultsMap.set(tr.id, tr);
        });
      }
    } else {
      // Already have transformed data from search
      testResultsMap = new Map();
    }

    // Transform data to flatten structure (if not already transformed)
    let transformedData = searchTerm 
      ? allPayments 
      : allPayments.map((payment: any) => {
          const testResult = payment.test_id ? testResultsMap.get(payment.test_id) : null;
          const emailCampaign = payment.email_campaign_id || null;
          
          return {
            id: testResult?.id || payment.test_id,
            session_id: testResult?.session_id || null,
            name: testResult?.name || "N/A",
            email: testResult?.email || payment.user_email || "N/A",
            age: testResult?.age || null,
            test_link: (testResult?.id || payment.test_id) 
              ? `https://www.qualcarreira.com/resultado/${testResult?.id || payment.test_id}` 
              : null,
            coupon_code: payment.coupon_code || null,
            email_campaign: emailCampaign,
            payment_amount: payment.amount || 0,
            original_amount: payment.original_amount || 0,
            payment_date: payment.created_at,
            test_created_at: testResult?.created_at || null,
          };
        });

    // Calculate average age from ALL approved payments (not just current page)
    // We need to fetch all test_results for approved payments to calculate average
    const { data: allApprovedPayments } = await supabase
      .from("payments")
      .select("test_id")
      .eq("status", "approved");

    let averageAge = null;
    if (allApprovedPayments && allApprovedPayments.length > 0) {
      const allTestIds = [...new Set(allApprovedPayments.map((p: any) => p.test_id).filter(Boolean))];
      
      const { data: allTestResults } = await supabase
        .from("test_results")
        .select("age")
        .in("id", allTestIds)
        .not("age", "is", null);

      if (allTestResults && allTestResults.length > 0) {
        const ages = allTestResults.map((tr: any) => tr.age).filter((age: number) => age !== null);
        if (ages.length > 0) {
          const sum = ages.reduce((acc: number, age: number) => acc + age, 0);
          averageAge = Math.round((sum / ages.length) * 10) / 10; // Round to 1 decimal place
        }
      }
    }

    // Return paginated response with average age
    return new Response(
      JSON.stringify({
        data: transformedData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        averageAge,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[get-subscribers] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


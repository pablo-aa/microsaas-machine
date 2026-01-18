// Supabase Edge Function: get-all-users
// Purpose: Fetch all users who took the test with payment and coupon information
// Author: QC Admin Panel

import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função de formatação de data para Excel (DD/MM/YYYY)
const formatDateForExcel = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error(`[get-all-users] Invalid date: ${dateString}`);
      return null;
    }
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error(`[get-all-users] Error formatting date ${dateString}:`, error);
    return null;
  }
};

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

    // Parse query parameters for cursor pagination and date filtering
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor"); // ISO timestamp ou null
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "1000"), 1000);
    const startDate = url.searchParams.get("startDate"); // YYYY-MM-DD ou null
    const endDate = url.searchParams.get("endDate"); // YYYY-MM-DD ou null
    const dateField = url.searchParams.get("dateField") || "test_created_at"; // "test_created_at" ou "purchase_date"

    console.log("[get-all-users] Request:", { cursor, limit, startDate, endDate, dateField });

    // Query 1: Buscar test_results com paginação por cursor e filtros de data
    let query = supabase
      .from("test_results")
      .select(`
        id,
        name,
        email,
        age,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Se dateField é "test_created_at" e temos filtros de data, aplicar PRIMEIRO no test_results
    if (dateField === "test_created_at") {
      if (startDate) {
        // Usar startDate com hora 00:00:00 para incluir o dia inteiro
        const startDateWithTime = `${startDate}T00:00:00.000Z`;
        query = query.gte("created_at", startDateWithTime);
        console.log(`[get-all-users] Filtering by startDate: ${startDateWithTime}`);
      }
      if (endDate) {
        // Adicionar 23:59:59 ao endDate para incluir o dia inteiro
        const endDateWithTime = `${endDate}T23:59:59.999Z`;
        query = query.lte("created_at", endDateWithTime);
        console.log(`[get-all-users] Filtering by endDate: ${endDateWithTime}`);
      }
    }

    // Se tem cursor, filtrar por created_at < cursor (DEPOIS dos filtros de data)
    // IMPORTANTE: O cursor deve respeitar os limites de data também
    if (cursor) {
      // Garantir que o cursor não ultrapasse os limites de data
      let cursorToUse = cursor;
      if (dateField === "test_created_at" && endDate) {
        const endDateWithTime = `${endDate}T23:59:59.999Z`;
        // Se cursor é maior que endDate, usar endDate como limite
        if (cursor > endDateWithTime) {
          cursorToUse = endDateWithTime;
          console.log(`[get-all-users] Cursor ${cursor} exceeds endDate, using ${cursorToUse}`);
        }
      }
      if (dateField === "test_created_at" && startDate) {
        const startDateWithTime = `${startDate}T00:00:00.000Z`;
        // Se cursor é menor que startDate, não há mais dados
        if (cursor < startDateWithTime) {
          console.log(`[get-all-users] Cursor ${cursor} is before startDate, no more data`);
          return new Response(
            JSON.stringify({ 
              data: [],
              pagination: {
                limit,
                hasMore: false,
                nextCursor: null,
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      }
      query = query.lt("created_at", cursorToUse);
      console.log(`[get-all-users] Using cursor: ${cursorToUse}`);
    }

    const { data: testResults, error: testResultsError } = await query;

    if (testResultsError) {
      console.error("[get-all-users] Error fetching test_results:", testResultsError);
      throw new Error("Erro ao buscar resultados de testes");
    }

    // Log para debug
    if (testResults && testResults.length > 0) {
      const sampleDates = testResults.slice(0, 3).map((tr: any) => tr.created_at);
      console.log(`[get-all-users] Found ${testResults.length} test_results. Sample dates:`, sampleDates);
    } else {
      console.log(`[get-all-users] No test_results found with current filters`);
    }

    if (!testResults || testResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          pagination: {
            limit,
            hasMore: false,
            nextCursor: null,
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Query 2: Buscar payments approved
    // Se dateField é "purchase_date", precisamos filtrar payments primeiro e depois buscar apenas test_results correspondentes
    let allApprovedPayments: any[] = [];
    let testIdsToFetch: string[] = [];

    if (dateField === "purchase_date" && (startDate || endDate)) {
      // Filtrar payments por data primeiro
      let paymentsQuery = supabase
        .from("payments")
        .select(`
          id,
          test_id,
          amount,
          original_amount,
          status,
          coupon_code,
          created_at
        `)
        .eq("status", "approved");

      if (startDate) {
        paymentsQuery = paymentsQuery.gte("created_at", startDate);
      }
      if (endDate) {
        // Adicionar 23:59:59 ao endDate para incluir o dia inteiro
        const endDateWithTime = `${endDate}T23:59:59.999Z`;
        paymentsQuery = paymentsQuery.lte("created_at", endDateWithTime);
      }

      const { data: filteredPayments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) {
        console.error("[get-all-users] Error fetching payments:", paymentsError);
      } else {
        allApprovedPayments = filteredPayments || [];
        // Extrair test_ids únicos dos payments filtrados
        testIdsToFetch = [...new Set((allApprovedPayments || []).map((p: any) => String(p.test_id)).filter(Boolean))];
        console.log(`[get-all-users] Found ${allApprovedPayments.length} approved payments in date range, ${testIdsToFetch.length} unique test_ids`);
      }

      // Se temos test_ids, buscar apenas esses test_results
      if (testIdsToFetch.length > 0) {
        // Aplicar filtro de test_ids na query
        query = query.in("id", testIdsToFetch);
      } else {
        // Se não há payments no período, retornar vazio
        return new Response(
          JSON.stringify({ 
            data: [],
            pagination: {
              limit,
              hasMore: false,
              nextCursor: null,
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } else {
      // Se dateField é "test_created_at" ou não há filtros, buscar todos os payments normalmente
      const { data: allPayments, error: paymentsError } = await supabase
        .from("payments")
        .select(`
          id,
          test_id,
          amount,
          original_amount,
          status,
          coupon_code,
          created_at
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (paymentsError) {
        console.error("[get-all-users] Error fetching payments:", paymentsError);
      } else {
        allApprovedPayments = allPayments || [];
        console.log(`[get-all-users] Found ${allApprovedPayments.length} approved payments`);
      }
    }

    // Criar Map de test_id -> payment mais recente (apenas approved)
    const paymentsMap = new Map();
    (allApprovedPayments || []).forEach((payment: any) => {
      const testId = String(payment.test_id);
      // Se já existe, manter apenas o mais recente (já vem ordenado)
      if (!paymentsMap.has(testId)) {
        paymentsMap.set(testId, payment);
      }
    });
    
    console.log(`[get-all-users] Payments map has ${paymentsMap.size} unique test_ids with approved payments`);

    // Transformar dados
    const transformedData = testResults.map((testResult: any) => {
      // Buscar payment approved para este test_id
      const testId = String(testResult.id);
      const approvedPayment = paymentsMap.get(testId) || null;
      
      // Calcular amountPaid - simples: pegar amount ou original_amount
      let amountPaid: number | null = null;
      if (approvedPayment) {
        const amount = approvedPayment.amount ?? approvedPayment.original_amount;
        if (amount != null) {
          const parsed = parseFloat(String(amount));
          amountPaid = isNaN(parsed) ? null : parsed;
        }
      }
      
      // Formatar data da compra
      const purchaseDate = approvedPayment 
        ? formatDateForExcel(approvedPayment.created_at)
        : null;

      return {
        name: testResult.name || "N/A",
        email: testResult.email || "N/A",
        age: testResult.age || null,
        hasPaid: !!approvedPayment,
        purchaseDate: purchaseDate,
        amountPaid: amountPaid,
        usedCoupon: !!approvedPayment?.coupon_code || false,
        couponCode: approvedPayment?.coupon_code || null,
      };
    });

    // Próximo cursor: created_at do último registro (se retornou exatamente o limite)
    // Mas só se o último registro ainda está dentro dos limites de data
    let nextCursor: string | null = null;
    if (testResults.length === limit) {
      const lastRecordDate = testResults[testResults.length - 1].created_at;
      
      // Verificar se o último registro ainda está dentro dos limites de data
      if (dateField === "test_created_at") {
        let isWithinRange = true;
        
        if (startDate) {
          const startDateWithTime = `${startDate}T00:00:00.000Z`;
          if (lastRecordDate < startDateWithTime) {
            isWithinRange = false;
          }
        }
        if (endDate) {
          const endDateWithTime = `${endDate}T23:59:59.999Z`;
          if (lastRecordDate > endDateWithTime) {
            isWithinRange = false;
          }
        }
        
        if (isWithinRange) {
          nextCursor = lastRecordDate;
        } else {
          console.log(`[get-all-users] Last record date ${lastRecordDate} is outside date range, no more pages`);
        }
      } else {
        // Para purchase_date, usar o cursor normalmente (já foi filtrado antes)
        nextCursor = lastRecordDate;
      }
    }

    // Retornar dados com paginação
    return new Response(
      JSON.stringify({ 
        data: transformedData,
        pagination: {
          limit,
          hasMore: testResults.length === limit,
          nextCursor: nextCursor,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[get-all-users] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

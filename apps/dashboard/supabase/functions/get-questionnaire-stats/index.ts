// Supabase Edge Function: get-questionnaire-stats
// Purpose: Fetch and process questionnaire statistics for subscribers
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

    // Parse query parameters
    const url = new URL(req.url);
    const question = url.searchParams.get("question") || "q1";
    const getAll = url.searchParams.get("getAll") === "true";

    console.log("[get-questionnaire-stats] Request:", { question, getAll });

    // Buscar TODOS os test_results que têm contextual_questionnaire não nulo
    // Usar paginação para buscar todos os registros (Supabase limita a 1000 por padrão)
    let allTestResults: any[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: pageResults, error: testResultsError } = await supabase
        .from("test_results")
        .select("id, contextual_questionnaire")
        .range(from, from + limit - 1);

      if (testResultsError) {
        console.error("[get-questionnaire-stats] Error fetching test_results:", testResultsError);
        throw new Error("Erro ao buscar resultados de testes");
      }

      if (!pageResults || pageResults.length === 0) {
        hasMore = false;
        break;
      }

      allTestResults.push(...pageResults);
      from += limit;

      if (pageResults.length < limit) {
        hasMore = false;
      }
    }

    console.log(`[get-questionnaire-stats] Fetched ${allTestResults.length} total test_results from database`);

    // Filtrar apenas os que têm contextual_questionnaire não nulo e não vazio
    const testResults = (allTestResults || []).filter((tr: any) => {
      const q = tr.contextual_questionnaire;
      // Verificar se não é null, undefined, e se não é um objeto vazio
      if (q === null || q === undefined) {
        return false;
      }
      // Se for objeto, verificar se não está vazio
      if (typeof q === 'object' && Object.keys(q).length === 0) {
        return false;
      }
      return true;
    });

    console.log(`[get-questionnaire-stats] Found ${testResults.length} test_results with contextual_questionnaire`);
    if (testResults.length > 0) {
      console.log(`[get-questionnaire-stats] Sample questionnaire:`, JSON.stringify(testResults[0].contextual_questionnaire).substring(0, 200));
    }

    if (!testResults || testResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          question,
          totalResponses: 0,
          stats: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Processar respostas
    const responseCounts = new Map<string, number>();
    let processedCount = 0;
    let skippedCount = 0;

    testResults.forEach((testResult: any) => {
      try {
        const questionnaire = typeof testResult.contextual_questionnaire === 'string'
          ? JSON.parse(testResult.contextual_questionnaire)
          : testResult.contextual_questionnaire;

        if (!questionnaire || typeof questionnaire !== 'object') {
          skippedCount++;
          return;
        }

        const answer = questionnaire[question];

        if (answer === null || answer === undefined) {
          skippedCount++;
          return;
        }

        // Q4 é um array (multiple select)
        if (question === "q4" && Array.isArray(answer)) {
          answer.forEach((option: string) => {
            if (option) {
              responseCounts.set(option, (responseCounts.get(option) || 0) + 1);
              processedCount++;
            }
          });
        } else if (typeof answer === 'string' || typeof answer === 'number') {
          // Single select
          const option = String(answer);
          responseCounts.set(option, (responseCounts.get(option) || 0) + 1);
          processedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`[get-questionnaire-stats] Error processing test_result ${testResult.id}:`, error);
        skippedCount++;
      }
    });

    console.log(`[get-questionnaire-stats] Processed ${processedCount} answers, skipped ${skippedCount}`);

    // Calcular total de respostas
    const totalResponses = Array.from(responseCounts.values()).reduce((sum, count) => sum + count, 0);

    // Converter para array de estatísticas
    const stats = Array.from(responseCounts.entries())
      .map(([option, count]) => ({
        option,
        count,
        percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count); // Ordenar por contagem (maior primeiro)

    console.log(`[get-questionnaire-stats] Processed ${testResults.length} test_results, ${totalResponses} total responses for ${question}`);

    // Se getAll=true, processar todas as questões
    if (getAll) {
      const allQuestions = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"];
      const allStats: Record<string, any> = {};

      allQuestions.forEach((q) => {
        const qResponseCounts = new Map<string, number>();
        let qProcessedCount = 0;

        testResults.forEach((testResult: any) => {
          try {
            const questionnaire = typeof testResult.contextual_questionnaire === 'string'
              ? JSON.parse(testResult.contextual_questionnaire)
              : testResult.contextual_questionnaire;

            if (!questionnaire || typeof questionnaire !== 'object') {
              return;
            }

            const answer = questionnaire[q];

            if (answer === null || answer === undefined) {
              return;
            }

            // Q4 é um array (multiple select)
            if (q === "q4" && Array.isArray(answer)) {
              answer.forEach((option: string) => {
                if (option) {
                  qResponseCounts.set(option, (qResponseCounts.get(option) || 0) + 1);
                  qProcessedCount++;
                }
              });
            } else if (typeof answer === 'string' || typeof answer === 'number') {
              // Single select
              const option = String(answer);
              qResponseCounts.set(option, (qResponseCounts.get(option) || 0) + 1);
              qProcessedCount++;
            }
          } catch (error) {
            // Silently skip errors
          }
        });

        const qTotalResponses = Array.from(qResponseCounts.values()).reduce((sum, count) => sum + count, 0);
        const qStats = Array.from(qResponseCounts.entries())
          .map(([option, count]) => ({
            option,
            count,
            percentage: qTotalResponses > 0 ? Math.round((count / qTotalResponses) * 100 * 10) / 10 : 0,
          }))
          .sort((a, b) => b.count - a.count);

        allStats[q] = {
          question: q,
          totalResponses: qTotalResponses,
          stats: qStats
        };
      });

      return new Response(
        JSON.stringify({ 
          all: true,
          data: allStats
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Retornar dados de uma questão específica
    return new Response(
      JSON.stringify({ 
        question,
        totalResponses,
        stats
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[get-questionnaire-stats] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

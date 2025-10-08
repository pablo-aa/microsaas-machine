import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converte data brasileira "dd/MM/yyyy HH:mm" (GMT-3) para ISO UTC
function parseBrazilianDateToUTC(dateStr: string): string {
  // Parse "05/10/2025 00:00" -> [05, 10, 2025, 00, 00]
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Cria a data em GMT-3 (horário de Brasília)
  const brazilDate = new Date(Date.UTC(year, month - 1, day, hour + 3, minute));
  
  return brazilDate.toISOString();
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional date filters
    const { start_date, end_date } = await req.json().catch(() => ({}));

    // Converte datas brasileiras para UTC se fornecidas
    const startDateUTC = start_date ? parseBrazilianDateToUTC(start_date) : null;
    const endDateUTC = end_date ? parseBrazilianDateToUTC(end_date) : null;

    console.log('Date conversion:', { start_date, startDateUTC, end_date, endDateUTC });

    // 1. Formulários submetidos (count distinct emails)
    let emailQuery = supabase
      .from('test_results')
      .select('email', { count: 'exact', head: true });
    
    if (startDateUTC) emailQuery = emailQuery.gte('created_at', startDateUTC);
    if (endDateUTC) emailQuery = emailQuery.lte('created_at', endDateUTC);
    
    const { count: uniqueEmails, error: emailError } = await emailQuery;

    // 2. Total de resultados acessados
    let resultsQuery = supabase
      .from('test_results')
      .select('*', { count: 'exact', head: true });
    
    if (startDateUTC) resultsQuery = resultsQuery.gte('created_at', startDateUTC);
    if (endDateUTC) resultsQuery = resultsQuery.lte('created_at', endDateUTC);
    
    const { count: resultsAccessed, error: resultsError } = await resultsQuery;

    // 3. Pagamentos iniciados
    let paymentsQuery = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    if (startDateUTC) paymentsQuery = paymentsQuery.gte('created_at', startDateUTC);
    if (endDateUTC) paymentsQuery = paymentsQuery.lte('created_at', endDateUTC);
    
    const { count: paymentsInitiated, error: paymentsError } = await paymentsQuery;

    // 4. Pagamentos aprovados
    let approvedQuery = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    if (startDateUTC) approvedQuery = approvedQuery.gte('created_at', startDateUTC);
    if (endDateUTC) approvedQuery = approvedQuery.lte('created_at', endDateUTC);
    
    const { count: paymentsApproved, error: approvedError } = await approvedQuery;

    // 5. Receita total
    let revenueQuery = supabase
      .from('payments')
      .select('amount')
      .eq('status', 'approved');
    
    if (startDateUTC) revenueQuery = revenueQuery.gte('created_at', startDateUTC);
    if (endDateUTC) revenueQuery = revenueQuery.lte('created_at', endDateUTC);
    
    const { data: revenueData, error: revenueError } = await revenueQuery;

    if (emailError || resultsError || paymentsError || approvedError || revenueError) {
      console.error('Database query error:', { emailError, resultsError, paymentsError, approvedError, revenueError });
      throw new Error('Database query failed');
    }

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const conversionRate = resultsAccessed && resultsAccessed > 0 
      ? ((paymentsApproved || 0) / resultsAccessed * 100).toFixed(2)
      : '0.00';

    const response = {
      period: {
        start: start_date || 'all-time',
        end: end_date || 'now',
      },
      metrics: {
        forms_submitted: resultsAccessed || 0,
        unique_emails: uniqueEmails || 0,
        results_accessed: resultsAccessed || 0,
        payments_initiated: paymentsInitiated || 0,
        payments_approved: paymentsApproved || 0,
        conversion_rate: parseFloat(conversionRate),
        total_revenue: totalRevenue,
      },
    };

    console.log('Analytics response:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

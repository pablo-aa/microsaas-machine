import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 1. Formulários submetidos (count distinct emails)
    let emailQuery = supabase
      .from('test_results')
      .select('email', { count: 'exact', head: true });
    
    if (start_date) emailQuery = emailQuery.gte('created_at', start_date);
    if (end_date) emailQuery = emailQuery.lte('created_at', end_date);
    
    const { count: uniqueEmails, error: emailError } = await emailQuery;

    // 2. Total de resultados acessados
    let resultsQuery = supabase
      .from('test_results')
      .select('*', { count: 'exact', head: true });
    
    if (start_date) resultsQuery = resultsQuery.gte('created_at', start_date);
    if (end_date) resultsQuery = resultsQuery.lte('created_at', end_date);
    
    const { count: resultsAccessed, error: resultsError } = await resultsQuery;

    // 3. Pagamentos iniciados
    let paymentsQuery = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    if (start_date) paymentsQuery = paymentsQuery.gte('created_at', start_date);
    if (end_date) paymentsQuery = paymentsQuery.lte('created_at', end_date);
    
    const { count: paymentsInitiated, error: paymentsError } = await paymentsQuery;

    // 4. Pagamentos aprovados
    let approvedQuery = supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    if (start_date) approvedQuery = approvedQuery.gte('created_at', start_date);
    if (end_date) approvedQuery = approvedQuery.lte('created_at', end_date);
    
    const { count: paymentsApproved, error: approvedError } = await approvedQuery;

    // 5. Receita total
    let revenueQuery = supabase
      .from('payments')
      .select('amount')
      .eq('status', 'approved');
    
    if (start_date) revenueQuery = revenueQuery.gte('created_at', start_date);
    if (end_date) revenueQuery = revenueQuery.lte('created_at', end_date);
    
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

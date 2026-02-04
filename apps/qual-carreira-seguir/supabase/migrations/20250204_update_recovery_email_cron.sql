-- Atualizar cronjob do send-recovery-email para rodar a cada 10 minutos
-- Mudanças:
-- - Schedule: de "00 * * * *" (a cada hora) para "*/10 * * * *" (a cada 10 minutos)
-- - Limite interno da função: de 80/dia para 30/dia
-- - Lookback: de 30 min para 5 min

-- Deletar job existente
SELECT cron.unschedule('send-recovery-email-hourly');

-- Criar novo job com schedule a cada 10 minutos
SELECT cron.schedule(
  'send-recovery-email-every-10min',
  '*/10 * * * *', -- A cada 10 minutos
  $$
  insert into public.cron_job_logs (job_name, status, message, request_id, updated_at)
  select
    'send-recovery-email',
    'queued',
    'Requisição enfileirada via pg_net',
    net.http_post(
      url := 'https://iwovfvrmjaonzqlaavmi.supabase.co/functions/v1/send-recovery-email',
      headers := '{
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3ZmdnJtamFvbnpxbGFhdm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTk0OTUsImV4cCI6MjA3NTE3NTQ5NX0.4EhcKmybFm3VVpMuR1hahaJbZxmVm9zbcwgB96Xm04I"
      }'::jsonb,
      body := '{"dryRun": false}'::jsonb,
      timeout_milliseconds := 50000
    ),
    now();
  $$
);

-- Comentário para documentação
COMMENT ON EXTENSION pg_cron IS 'Job send-recovery-email-every-10min: Envia emails de recuperação com desconto REMARKETING990 a cada 10 minutos para pagamentos pendentes há 5+ minutos. Limite: 30 emails/dia.';

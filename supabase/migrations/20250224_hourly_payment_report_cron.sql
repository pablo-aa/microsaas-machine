-- Migration: Criar cronjob para relatório horário de pagamentos
-- Created: 2025-02-24
-- Descrição: Configura cronjob que executa a cada hora para enviar relatório de pagamentos via WhatsApp

-- Criar schema util se não existir (DEVE SER CRIADO ANTES DA FUNÇÃO)
CREATE SCHEMA IF NOT EXISTS util;

-- Criar função PL/pgSQL para chamar a Edge Function
CREATE OR REPLACE FUNCTION util.send_hourly_payment_report_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  anon_key text;
  supabase_url text := 'https://iwovfvrmjaonzqlaavmi.supabase.co';
BEGIN
  -- Obter ANON KEY do Vault
  SELECT decrypted_secret INTO anon_key
  FROM vault.decrypted_secrets
  WHERE name = 'anon_key';
  
  IF anon_key IS NULL THEN
    RAISE LOG 'Cronjob: ANON KEY não configurado no Vault. Configure usando: SELECT vault.create_secret(''sua_anon_key'', ''anon_key'');';
    RETURN;
  END IF;
  
  -- Chamar a Edge Function via pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/hourly-payment-report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || anon_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  
  RAISE LOG 'Cronjob: Requisição enviada para hourly-payment-report. Data/Hora: %', now();
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Cronjob: Erro ao chamar Edge Function hourly-payment-report. Erro: %', SQLERRM;
END;
$$;

-- Criar cronjob para executar a cada hora (no minuto 0 de cada hora)
SELECT cron.schedule(
  'hourly-payment-report',  -- Nome do job
  '0 * * * *',              -- Cron expression: todo minuto 0 de cada hora (a cada hora)
  $$SELECT util.send_hourly_payment_report_cron();$$
);

-- Comentário para documentação
COMMENT ON FUNCTION util.send_hourly_payment_report_cron() IS 'Função que chama a Edge Function hourly-payment-report para enviar relatório de pagamentos via WhatsApp. Executada a cada hora via cronjob.';


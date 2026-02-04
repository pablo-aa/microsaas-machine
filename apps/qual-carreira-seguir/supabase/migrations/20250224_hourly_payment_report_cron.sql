-- Migration: Criar cronjob para relatório de pagamentos em blocos de 2 horas
-- Created: 2025-02-24
-- Updated: 2025-02-24
-- Descrição: Configura cronjob que executa a cada 2 horas entre 8h e 00h (meia-noite) para enviar relatório de pagamentos via WhatsApp
-- Horários: 00h (meia-noite), 8h, 10h, 12h, 14h, 16h, 18h, 20h, 22h (todos em GMT-3)

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

-- Remover cronjob antigo se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hourly-payment-report') THEN
    PERFORM cron.unschedule('hourly-payment-report');
  END IF;
END $$;

-- Criar novo cronjob para executar nos horários especificados
-- Horários desejados em GMT-3: 00h, 8h, 10h, 12h, 14h, 16h, 18h, 20h, 22h
-- Conversão para UTC (GMT-3 + 3h = UTC):
--   00h GMT-3 = 03h UTC
--   8h GMT-3 = 11h UTC
--   10h GMT-3 = 13h UTC
--   12h GMT-3 = 15h UTC
--   14h GMT-3 = 17h UTC
--   16h GMT-3 = 19h UTC
--   18h GMT-3 = 21h UTC
--   20h GMT-3 = 23h UTC
--   22h GMT-3 = 01h UTC (dia seguinte)
-- Expressão cron em UTC: '0 3,11,13,15,17,19,21,23,1 * * *'
SELECT cron.schedule(
  'hourly-payment-report',  -- Nome do job
  '0 3,11,13,15,17,19,21,23,1 * * *',  -- Cron expression em UTC (equivale aos horários GMT-3 acima)
  $$SELECT util.send_hourly_payment_report_cron();$$
);

-- Comentário para documentação
COMMENT ON FUNCTION util.send_hourly_payment_report_cron() IS 'Função que chama a Edge Function hourly-payment-report para enviar relatório de pagamentos via WhatsApp. Executada em blocos de 2 horas: 00h (últimas 2h do dia anterior), 8h (madrugada 00h-07h59), e depois 10h, 12h, 14h, 16h, 18h, 20h, 22h (dia completo + últimas 2h).';

-- ⚠️ IMPORTANTE: Configure o anon_key no Vault antes de usar o cronjob
-- Execute esta query para criar o secret no Vault (substitua 'SUA_ANON_KEY_AQUI' pela sua anon_key):
-- 
-- SELECT vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3ZmdnJtamFvbnpxbGFhdm1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTk0OTUsImV4cCI6MjA3NTE3NTQ5NX0.4EhcKmybFm3VVpMuR1hahaJbZxmVm9zbcwgB96Xm04I', 'anon_key');
--
-- Para verificar se foi criado:
-- SELECT name, created_at FROM vault.secrets WHERE name = 'anon_key';



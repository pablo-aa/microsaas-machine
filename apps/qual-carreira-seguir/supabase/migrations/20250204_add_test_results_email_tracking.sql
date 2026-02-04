-- Adicionar campos de tracking de email de recuperação em test_results
-- Para rastrear emails enviados para usuários que completaram o teste mas não iniciaram pagamento

-- Adicionar colunas apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'test_results' AND column_name = 'recovery_email_sent') THEN
    ALTER TABLE test_results ADD COLUMN recovery_email_sent boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'test_results' AND column_name = 'recovery_email_sent_at') THEN
    ALTER TABLE test_results ADD COLUMN recovery_email_sent_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'test_results' AND column_name = 'email_campaign_id') THEN
    ALTER TABLE test_results ADD COLUMN email_campaign_id text;
  END IF;
END $$;

-- Criar índice para otimizar busca de elegíveis (apenas se não existir)
CREATE INDEX IF NOT EXISTS idx_test_results_recovery_email 
  ON test_results(recovery_email_sent, created_at, is_unlocked)
  WHERE recovery_email_sent = false AND is_unlocked = false;

-- Comentários
COMMENT ON COLUMN test_results.recovery_email_sent IS 'Indica se email de recuperação foi enviado para este resultado';
COMMENT ON COLUMN test_results.recovery_email_sent_at IS 'Data/hora do envio do email de recuperação';
COMMENT ON COLUMN test_results.email_campaign_id IS 'ID da campanha de email para tracking';


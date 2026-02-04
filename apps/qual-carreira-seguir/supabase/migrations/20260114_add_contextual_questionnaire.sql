-- Adicionar coluna contextual_questionnaire na tabela test_results
-- Armazena respostas do questionário contextual pré-formulário
-- Coluna nullable para compatibilidade retroativa com registros existentes

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'test_results' AND column_name = 'contextual_questionnaire') THEN
    ALTER TABLE test_results 
    ADD COLUMN contextual_questionnaire JSONB;
  END IF;
END $$;

-- Adicionar comentário para documentação
COMMENT ON COLUMN test_results.contextual_questionnaire IS 'Respostas do questionário contextual pré-formulário. Estrutura: { q1: string, q2: string, q3: string, q4: string[], q5: string, q6: string, q7?: string, q8?: string, q9?: string }';


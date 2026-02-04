-- Migration: Sistema de Cupons de Desconto
-- Created: 2025-02-04

-- Criar tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  discount_percentage int NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  description text,
  is_active boolean DEFAULT true NOT NULL,
  expires_at timestamptz,
  max_uses int CHECK (max_uses > 0),
  current_uses int DEFAULT 0 NOT NULL CHECK (current_uses >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Index para busca case-insensitive
CREATE INDEX idx_discount_coupons_code_upper ON discount_coupons(UPPER(code));

-- Index para busca de cupons ativos
CREATE INDEX idx_discount_coupons_active ON discount_coupons(is_active) WHERE is_active = true;

-- Index para busca de cupons não expirados
CREATE INDEX idx_discount_coupons_expires_at ON discount_coupons(expires_at) WHERE expires_at IS NOT NULL;

-- Adicionar colunas na tabela payments
ALTER TABLE payments 
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS original_amount numeric(10,2);

-- Index para tracking de uso de cupons
CREATE INDEX IF NOT EXISTS idx_payments_coupon_code ON payments(coupon_code) WHERE coupon_code IS NOT NULL;

-- Habilitar Row Level Security
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública apenas de cupons ativos
CREATE POLICY "Public can read active coupons"
  ON discount_coupons
  FOR SELECT
  USING (is_active = true);

-- Policy: Service role tem acesso completo
CREATE POLICY "Service role full access on discount_coupons"
  ON discount_coupons
  FOR ALL
  USING (
    auth.role() = 'service_role'
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_discount_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_discount_coupons_updated_at_trigger
  BEFORE UPDATE ON discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_coupons_updated_at();

-- Comentários para documentação
COMMENT ON TABLE discount_coupons IS 'Tabela de cupons de desconto para o sistema';
COMMENT ON COLUMN discount_coupons.code IS 'Código do cupom (case-insensitive)';
COMMENT ON COLUMN discount_coupons.discount_percentage IS 'Percentual de desconto (0-100)';
COMMENT ON COLUMN discount_coupons.description IS 'Descrição do cupom para tracking interno';
COMMENT ON COLUMN discount_coupons.max_uses IS 'Número máximo de usos (null = ilimitado)';
COMMENT ON COLUMN discount_coupons.current_uses IS 'Contador de usos atuais';
COMMENT ON COLUMN payments.coupon_code IS 'Código do cupom usado no pagamento';
COMMENT ON COLUMN payments.original_amount IS 'Valor original antes do desconto';


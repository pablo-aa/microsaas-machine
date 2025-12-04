import { supabase } from './supabase';

const STORAGE_KEY = 'qc_coupon';

export interface ValidatedCoupon {
  valid: boolean;
  code?: string;
  discount_percentage?: number;
  description?: string | null;
  original_price?: number;
  final_price?: number;
  reason?: 'invalid_code' | 'expired' | 'max_uses_reached' | 'inactive' | 'error';
}

/**
 * Salva um código de cupom no localStorage
 */
export function saveCoupon(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code.toUpperCase().trim());
  } catch (error) {
    console.error('[couponStorage] Error saving coupon:', error);
  }
}

/**
 * Recupera o código de cupom salvo no localStorage
 */
export function getCoupon(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('[couponStorage] Error getting coupon:', error);
    return null;
  }
}

/**
 * Remove o cupom do localStorage
 */
export function clearCoupon(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[couponStorage] Error clearing coupon:', error);
  }
}

/**
 * Valida um cupom com o backend e salva se válido
 */
export async function validateAndSaveCoupon(code: string): Promise<ValidatedCoupon> {
  try {
    console.log('[couponStorage] Validating coupon:', code);
    
    const { data, error } = await supabase.functions.invoke('validate-coupon', {
      body: { code: code.trim() }
    });

    if (error) {
      console.error('[couponStorage] Error validating coupon:', error);
      return {
        valid: false,
        reason: 'error'
      };
    }

    console.log('[couponStorage] Validation result:', data);

    if (data.valid) {
      saveCoupon(code);
    }

    return data;
  } catch (error) {
    console.error('[couponStorage] Unexpected error:', error);
    return {
      valid: false,
      reason: 'error'
    };
  }
}


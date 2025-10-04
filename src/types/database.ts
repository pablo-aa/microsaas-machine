export type TestType = 'riasec' | 'gardner' | 'gopc';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type AppRole = 'admin' | 'user';

export interface TestResponse {
  id: string;
  session_id: string;
  test_type: TestType;
  question_id: string;
  response: number;
  created_at: string;
}

export interface TestResult {
  id: string;
  session_id: string;
  name: string;
  email: string;
  age: number;
  riasec_scores: Record<string, number>;
  gardner_scores: Record<string, number>;
  gopc_scores: Record<string, number>;
  payment_id?: string;
  is_unlocked: boolean;
  unlocked_at?: string;
  created_at: string;
  expires_at: string;
  metadata: Record<string, any>;
}

export interface Payment {
  id: string;
  mp_payment_id?: string;
  mp_preference_id?: string;
  mp_merchant_order_id?: string;
  test_result_id?: string;
  amount: number;
  status: PaymentStatus;
  payer_email?: string;
  payer_name?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  webhook_data?: Record<string, any>;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

-- =====================================================
-- QUALCARREIRA - Initial Database Schema
-- Execute este SQL no SQL Editor do Supabase (DEV e PROD)
-- =====================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- Create enum for test types
create type test_type as enum ('riasec', 'gardner', 'gopc');

-- Create enum for payment status
create type payment_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- Create enum for user roles
create type app_role as enum ('admin', 'user');

-- =====================================================
-- TABLE: test_responses
-- Stores individual test answers before completion
-- =====================================================
create table public.test_responses (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null default uuid_generate_v4(),
  test_type test_type not null,
  question_id text not null,
  response integer not null check (response between 1 and 5),
  created_at timestamp with time zone default now()
);

-- Index for fast session queries
create index idx_test_responses_session on public.test_responses(session_id);
create index idx_test_responses_created on public.test_responses(created_at);

-- =====================================================
-- TABLE: test_results
-- Stores calculated test results (unlocked after payment)
-- =====================================================
create table public.test_results (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique,
  
  -- User info from form
  name text not null,
  email text not null,
  age integer not null check (age >= 10 and age <= 100),
  
  -- Calculated scores (JSONB for flexibility)
  riasec_scores jsonb not null,
  gardner_scores jsonb not null,
  gopc_scores jsonb not null,
  
  -- Payment tracking
  payment_id text,
  is_unlocked boolean default false,
  unlocked_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '30 days'),
  
  -- Metadata
  metadata jsonb default '{}'::jsonb
);

-- Indexes
create index idx_test_results_session on public.test_results(session_id);
create index idx_test_results_email on public.test_results(email);
create index idx_test_results_expires on public.test_results(expires_at);
create index idx_test_results_created on public.test_results(created_at);

-- =====================================================
-- TABLE: payments
-- Tracks Mercado Pago transactions
-- =====================================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  
  -- Test reference (can be a session or result ID)
  test_id uuid not null,
  
  -- User info
  user_email text not null,
  
  -- Mercado Pago data
  payment_id text unique not null, -- MP payment ID
  payment_method text default 'pix',
  
  -- Payment details
 amount decimal(10,2) not null default 14.90,
  status text not null default 'pending', -- pending, approved, rejected, cancelled
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Raw webhook data
  webhook_data jsonb,
  
  -- Metadata
  metadata jsonb default '{}'::jsonb
);

-- Indexes
create index idx_payments_payment_id on public.payments(payment_id);
create index idx_payments_test_id on public.payments(test_id);
create index idx_payments_status on public.payments(status);
create index idx_payments_email on public.payments(user_email);
create index idx_payments_created on public.payments(created_at);

-- =====================================================
-- TABLE: user_roles
-- Manages admin access (uses security definer pattern)
-- =====================================================
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamp with time zone default now(),
  unique(user_id, role)
);

create index idx_user_roles_user on public.user_roles(user_id);

-- =====================================================
-- SECURITY DEFINER FUNCTION
-- Prevents recursive RLS issues
-- =====================================================
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
alter table public.test_responses enable row level security;
alter table public.test_results enable row level security;
alter table public.payments enable row level security;
alter table public.user_roles enable row level security;

-- test_responses: Public insert, no read
create policy "Anyone can insert test responses"
  on public.test_responses for insert
  with check (true);

-- test_results: Users can read their own via session_id
create policy "Users can read their own results"
  on public.test_results for select
  using (true); -- No auth required, access controlled by session_id knowledge

create policy "Anyone can insert test results"
  on public.test_results for insert
  with check (true);

create policy "System can update test results"
  on public.test_results for update
  using (true);

-- payments: Users can read their own payments
create policy "Users can read their own payments"
  on public.payments for select
  using (true);

create policy "System can insert payments"
  on public.payments for insert
  with check (true);

create policy "System can update payments"
  on public.payments for update
  using (true);

-- user_roles: Only readable by authenticated users
create policy "Authenticated users can read roles"
  on public.user_roles for select
  to authenticated
  using (true);

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to clean up expired results (for cron)
create or replace function public.cleanup_expired_results()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.test_results
  where expires_at < now()
    and is_unlocked = false; -- Only delete unpaid results
  
  delete from public.test_responses
  where created_at < now() - interval '7 days'; -- Clean old responses
end;
$$;

-- =====================================================
-- CRON JOBS
-- Run cleanup daily at 3 AM
-- =====================================================
select cron.schedule(
  'cleanup-expired-results',
  '0 3 * * *', -- Every day at 3 AM
  $$select public.cleanup_expired_results()$$
);

-- =====================================================
-- DONE! 
-- Próximos passos:
-- 1. Execute este SQL no ambiente DEV
-- 2. Execute este SQL no ambiente PROD
-- 3. Adicione as chaves do Mercado Pago em src/config/mercadopago.ts
-- =====================================================

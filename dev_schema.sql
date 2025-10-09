


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."test_type" AS ENUM (
    'riasec',
    'gardner',
    'gopc'
);


ALTER TYPE "public"."test_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_results"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from public.test_results
  where expires_at < now()
    and is_unlocked = false; -- Only delete unpaid results
  
  delete from public.test_responses
  where created_at < now() - interval '7 days'; -- Clean old responses
end;
$$;


ALTER FUNCTION "public"."cleanup_expired_results"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "test_id" "uuid" NOT NULL,
    "user_email" "text" NOT NULL,
    "payment_id" "text" NOT NULL,
    "payment_method" "text" DEFAULT 'pix'::"text",
 "amount" numeric(10,2) DEFAULT 14.90 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "webhook_data" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_responses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "test_type" "public"."test_type" NOT NULL,
    "question_id" "text" NOT NULL,
    "response" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "test_responses_response_check" CHECK ((("response" >= 1) AND ("response" <= 5)))
);


ALTER TABLE "public"."test_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "age" integer NOT NULL,
    "riasec_scores" "jsonb" NOT NULL,
    "gardner_scores" "jsonb" NOT NULL,
    "gopc_scores" "jsonb" NOT NULL,
    "payment_id" "text",
    "is_unlocked" boolean DEFAULT false,
    "unlocked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "test_results_age_check" CHECK ((("age" >= 10) AND ("age" <= 100)))
);


ALTER TABLE "public"."test_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'user'::"public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_id_key" UNIQUE ("payment_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_responses"
    ADD CONSTRAINT "test_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_results"
    ADD CONSTRAINT "test_results_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE INDEX "idx_payments_created" ON "public"."payments" USING "btree" ("created_at");



CREATE INDEX "idx_payments_email" ON "public"."payments" USING "btree" ("user_email");



CREATE INDEX "idx_payments_payment_id" ON "public"."payments" USING "btree" ("payment_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payments_test_id" ON "public"."payments" USING "btree" ("test_id");



CREATE INDEX "idx_test_responses_created" ON "public"."test_responses" USING "btree" ("created_at");



CREATE INDEX "idx_test_responses_session" ON "public"."test_responses" USING "btree" ("session_id");



CREATE INDEX "idx_test_results_created" ON "public"."test_results" USING "btree" ("created_at");



CREATE INDEX "idx_test_results_email" ON "public"."test_results" USING "btree" ("email");



CREATE INDEX "idx_test_results_expires" ON "public"."test_results" USING "btree" ("expires_at");



CREATE INDEX "idx_test_results_session" ON "public"."test_results" USING "btree" ("session_id");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Anyone can insert test responses" ON "public"."test_responses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert test results" ON "public"."test_results" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can read roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "System can insert payments" ON "public"."payments" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can update payments" ON "public"."payments" FOR UPDATE USING (true);



CREATE POLICY "System can update test results" ON "public"."test_results" FOR UPDATE USING (true);



CREATE POLICY "Users can read their own payments" ON "public"."payments" FOR SELECT USING (true);



CREATE POLICY "Users can read their own results" ON "public"."test_results" FOR SELECT USING (true);



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_results"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_results"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_results"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."test_responses" TO "anon";
GRANT ALL ON TABLE "public"."test_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."test_responses" TO "service_role";



GRANT ALL ON TABLE "public"."test_results" TO "anon";
GRANT ALL ON TABLE "public"."test_results" TO "authenticated";
GRANT ALL ON TABLE "public"."test_results" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;

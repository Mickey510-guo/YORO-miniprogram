-- ============================================================
-- SECTION: SCHEMA
-- ============================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mainline_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" DEFAULT 'subject'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "repeat_rule" "text" DEFAULT 'daily'::"text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "last_record_at" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: diaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."diaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "diary_date" "date" NOT NULL,
    "content" "text" NOT NULL,
    "images" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "mood" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: footprints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."footprints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "footprint_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: mainlines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."mainlines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" DEFAULT '考研'::"text" NOT NULL,
    "exam_date" "date" NOT NULL,
    "goal_desc" "text" DEFAULT ''::"text" NOT NULL,
    "archived" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."nodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "branch_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "weight" "text" DEFAULT 'main'::"text" NOT NULL,
    "kind" "text" DEFAULT 'normal'::"text" NOT NULL,
    "is_crossing" boolean DEFAULT false NOT NULL,
    "plan_date" "date",
    "plan_start" time without time zone,
    "plan_end" time without time zone,
    "done_date" "date",
    "done_content" "text",
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "mood" "text",
    "mood_note" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: substeps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."substeps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "node_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "checked" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL
);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'branches_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'diaries_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."diaries"
    ADD CONSTRAINT "diaries_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'footprints_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."footprints"
    ADD CONSTRAINT "footprints_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'mainlines_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."mainlines"
    ADD CONSTRAINT "mainlines_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'nodes_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."nodes"
    ADD CONSTRAINT "nodes_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'substeps_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."substeps"
    ADD CONSTRAINT "substeps_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: idx_branches_mainline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_branches_mainline" ON "public"."branches" USING "btree" ("mainline_id");


--
-- Name: idx_footprints_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_footprints_branch" ON "public"."footprints" USING "btree" ("branch_id");


--
-- Name: idx_nodes_branch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_nodes_branch" ON "public"."nodes" USING "btree" ("branch_id");


--
-- Name: idx_substeps_node; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_substeps_node" ON "public"."substeps" USING "btree" ("node_id");


--
-- Name: branches branches_mainline_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'branches_mainline_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_mainline_id_fkey" FOREIGN KEY ("mainline_id") REFERENCES "public"."mainlines"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'footprints_branch_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."footprints"
    ADD CONSTRAINT "footprints_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'nodes_branch_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."nodes"
    ADD CONSTRAINT "nodes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'substeps_node_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."substeps"
    ADD CONSTRAINT "substeps_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;

--
-- Name: branches branches_anon_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_anon_delete'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_anon_delete" ON "public"."branches" FOR DELETE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_anon_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_anon_insert'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_anon_insert" ON "public"."branches" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_anon_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_anon_select'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_anon_select" ON "public"."branches" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_anon_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_anon_update'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_anon_update" ON "public"."branches" FOR UPDATE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_auth_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_auth_delete'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_auth_delete" ON "public"."branches" FOR DELETE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_auth_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_auth_insert'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_auth_insert" ON "public"."branches" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_auth_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_auth_select'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_auth_select" ON "public"."branches" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: branches branches_auth_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'branches_auth_update'
      AND n.nspname = 'public'
      AND c.relname = 'branches'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "branches_auth_update" ON "public"."branches" FOR UPDATE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."diaries" ENABLE ROW LEVEL SECURITY;

--
-- Name: diaries diaries_anon_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_anon_delete'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_anon_delete" ON "public"."diaries" FOR DELETE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_anon_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_anon_insert'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_anon_insert" ON "public"."diaries" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_anon_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_anon_select'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_anon_select" ON "public"."diaries" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_anon_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_anon_update'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_anon_update" ON "public"."diaries" FOR UPDATE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_auth_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_auth_delete'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_auth_delete" ON "public"."diaries" FOR DELETE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_auth_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_auth_insert'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_auth_insert" ON "public"."diaries" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_auth_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_auth_select'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_auth_select" ON "public"."diaries" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: diaries diaries_auth_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'diaries_auth_update'
      AND n.nspname = 'public'
      AND c.relname = 'diaries'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "diaries_auth_update" ON "public"."diaries" FOR UPDATE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."footprints" ENABLE ROW LEVEL SECURITY;

--
-- Name: footprints footprints_anon_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_anon_delete'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_anon_delete" ON "public"."footprints" FOR DELETE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_anon_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_anon_insert'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_anon_insert" ON "public"."footprints" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_anon_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_anon_select'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_anon_select" ON "public"."footprints" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_anon_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_anon_update'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_anon_update" ON "public"."footprints" FOR UPDATE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_auth_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_auth_delete'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_auth_delete" ON "public"."footprints" FOR DELETE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_auth_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_auth_insert'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_auth_insert" ON "public"."footprints" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_auth_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_auth_select'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_auth_select" ON "public"."footprints" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: footprints footprints_auth_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'footprints_auth_update'
      AND n.nspname = 'public'
      AND c.relname = 'footprints'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "footprints_auth_update" ON "public"."footprints" FOR UPDATE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."mainlines" ENABLE ROW LEVEL SECURITY;

--
-- Name: mainlines mainlines_anon_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_anon_delete'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_anon_delete" ON "public"."mainlines" FOR DELETE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_anon_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_anon_insert'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_anon_insert" ON "public"."mainlines" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_anon_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_anon_select'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_anon_select" ON "public"."mainlines" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_anon_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_anon_update'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_anon_update" ON "public"."mainlines" FOR UPDATE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_auth_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_auth_delete'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_auth_delete" ON "public"."mainlines" FOR DELETE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_auth_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_auth_insert'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_auth_insert" ON "public"."mainlines" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_auth_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_auth_select'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_auth_select" ON "public"."mainlines" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mainlines mainlines_auth_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'mainlines_auth_update'
      AND n.nspname = 'public'
      AND c.relname = 'mainlines'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "mainlines_auth_update" ON "public"."mainlines" FOR UPDATE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."nodes" ENABLE ROW LEVEL SECURITY;

--
-- Name: nodes nodes_anon_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_anon_delete'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_anon_delete" ON "public"."nodes" FOR DELETE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_anon_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_anon_insert'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_anon_insert" ON "public"."nodes" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_anon_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_anon_select'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_anon_select" ON "public"."nodes" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_anon_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_anon_update'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_anon_update" ON "public"."nodes" FOR UPDATE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_auth_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_auth_delete'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_auth_delete" ON "public"."nodes" FOR DELETE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_auth_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_auth_insert'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_auth_insert" ON "public"."nodes" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_auth_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_auth_select'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_auth_select" ON "public"."nodes" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: nodes nodes_auth_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'nodes_auth_update'
      AND n.nspname = 'public'
      AND c.relname = 'nodes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "nodes_auth_update" ON "public"."nodes" FOR UPDATE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."substeps" ENABLE ROW LEVEL SECURITY;

--
-- Name: substeps substeps_anon_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_anon_delete'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_anon_delete" ON "public"."substeps" FOR DELETE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_anon_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_anon_insert'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_anon_insert" ON "public"."substeps" FOR INSERT TO "anon" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_anon_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_anon_select'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_anon_select" ON "public"."substeps" FOR SELECT TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_anon_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_anon_update'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_anon_update" ON "public"."substeps" FOR UPDATE TO "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_auth_delete; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_auth_delete'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_auth_delete" ON "public"."substeps" FOR DELETE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_auth_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_auth_insert'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_auth_insert" ON "public"."substeps" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_auth_select; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_auth_select'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_auth_select" ON "public"."substeps" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: substeps substeps_auth_update; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'substeps_auth_update'
      AND n.nspname = 'public'
      AND c.relname = 'substeps'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "substeps_auth_update" ON "public"."substeps" FOR UPDATE TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- PostgreSQL database dump complete
--




-- ============================================================
-- SECTION: DIFF FILTER OBJECTS
-- ============================================================
-- Objects that match diff-filter.json but cannot be represented
-- precisely by pg_dump --filter.

-- policy: yoro_images_anon_delete on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_anon_delete'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_anon_delete ON storage.objects AS PERMISSIVE FOR DELETE TO anon USING ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: yoro_images_anon_insert on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_anon_insert'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_anon_insert ON storage.objects AS PERMISSIVE FOR INSERT TO anon WITH CHECK ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: yoro_images_anon_update on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_anon_update'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_anon_update ON storage.objects AS PERMISSIVE FOR UPDATE TO anon WITH CHECK ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: yoro_images_auth_delete on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_auth_delete'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_auth_delete ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: yoro_images_auth_insert on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_auth_insert'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_auth_insert ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: yoro_images_auth_update on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_auth_update'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_auth_update ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated WITH CHECK ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: yoro_images_public_read on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'yoro_images_public_read'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY yoro_images_public_read ON storage.objects AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = ''yoro_images''::text));';
  END IF;
END
$pg_schema_restore$;

-- ============================================================
-- SECTION: STORAGE BUCKETS DATA
-- ============================================================

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('yoro_images', 'yoro_images', NULL, '2026-10-28 07:43:08.435346+00', '2026-10-28 07:43:08.435346+00', 'true', 'false', '1048576', NULL, NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";

-- ============================================================
-- SECTION: CRON JOBS
-- ============================================================
-- 用户自定义 pg_cron 任务。


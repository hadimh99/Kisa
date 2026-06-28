-- ============================================================================
-- Al-Kisa — Row Level Security (RLS) Policies
-- ============================================================================
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Idempotent and existence-guarded: tables that don't exist are skipped, and
-- it is safe to re-run any time (e.g. after creating a new table).
--
-- MODEL:
--   * Public content (kisa_hadiths, kisa_transcripts, kisa_series_config,
--     ontology_concepts)         -> anyone READS, only admins WRITE/DELETE.
--   * CMS-internal (ontology_synonyms, ontology_relations, cms_goals,
--     cms_activity_logs, cms_messages, kisa_transcript_backups) -> admins only.
--   * vault_items                -> each user only their OWN rows.
--   * admins                     -> locked to the API; manage it here.
-- ============================================================================


-- 0. ADMIN REGISTRY + HELPER ------------------------------------------------
create table if not exists public.admins (
    user_id  uuid primary key references auth.users(id) on delete cascade,
    added_at timestamptz not null default now()
);
alter table public.admins enable row level security;  -- RLS on, no policies = locked to API

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- Seed your admin account (verify this UID under Authentication -> Users)
insert into public.admins (user_id)
values ('54ac00e5-b3d3-4ce8-bd8b-a8e2d502e9bb')
on conflict (user_id) do nothing;


-- 1. APPLY POLICIES (existence-guarded) -------------------------------------
do $$
declare
    t text;
    pol record;
    a_tables text[] := array[                         -- public read, admin write
        'kisa_hadiths','kisa_transcripts','kisa_series_config','ontology_concepts'];
    b_tables text[] := array[                         -- admin only
        'ontology_synonyms','ontology_relations','cms_goals',
        'cms_activity_logs','cms_messages','kisa_transcript_backups'];
    all_tables text[];
begin
    all_tables := a_tables || b_tables || array['vault_items'];

    -- Wipe EVERY existing policy on managed tables first (clears any old
    -- "always true" policy that would otherwise keep a table writable).
    foreach t in array all_tables loop
        if exists (select 1 from information_schema.tables
                   where table_schema='public' and table_name=t) then
            for pol in select policyname from pg_policies
                       where schemaname='public' and tablename=t loop
                execute format('drop policy if exists %I on public.%I', pol.policyname, t);
            end loop;
        end if;
    end loop;

    -- Pattern A: public read, admin write
    foreach t in array a_tables loop
        if exists (select 1 from information_schema.tables
                   where table_schema='public' and table_name=t) then
            execute format('alter table public.%I enable row level security', t);
            execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t||'_public_read', t);
            execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t||'_admin_insert', t);
            execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t||'_admin_update', t);
            execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t||'_admin_delete', t);
        end if;
    end loop;

    -- Pattern B: admin only (all operations)
    foreach t in array b_tables loop
        if exists (select 1 from information_schema.tables
                   where table_schema='public' and table_name=t) then
            execute format('alter table public.%I enable row level security', t);
            execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t||'_admin_all', t);
        end if;
    end loop;

    -- vault_items: per-user
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name='vault_items') then
        execute 'alter table public.vault_items enable row level security';
        execute 'create policy "vault_items_select_own" on public.vault_items for select to authenticated using (auth.uid() = user_id)';
        execute 'create policy "vault_items_insert_own" on public.vault_items for insert to authenticated with check (auth.uid() = user_id)';
        execute 'create policy "vault_items_update_own" on public.vault_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)';
        execute 'create policy "vault_items_delete_own" on public.vault_items for delete to authenticated using (auth.uid() = user_id)';
    end if;
end $$;


-- 2. VERIFY (run after) -----------------------------------------------------
-- select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename;
-- select * from public.admins;
-- select tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename;

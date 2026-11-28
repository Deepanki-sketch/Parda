-- ==============================================================================
-- Parda Health Vault & Cross-Portal Sync - Supabase Schema Migration
-- ==============================================================================
-- Stores ONLY:
--   1. AES-256-GCM encrypted health record ciphertexts (zero plaintext medical info)
--   2. Ephemeral ECDH P-256 + HKDF-SHA256 wrapped Data Encryption Keys (DEKs)
--   3. Non-clinical ZKP claim metadata & settlement proofs
--   4. Shared emergency break-glass / audit telemetry for multi-device portals
-- ==============================================================================

-- 1. Encrypted health records table (Ciphertext + IV + SHA-256 commitment)
create table if not exists public.encrypted_health_records (
    id uuid default gen_random_uuid() primary key,
    patient_address text not null,
    record_hash text not null unique,
    ciphertext text not null,
    iv text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_encrypted_records_patient on public.encrypted_health_records(patient_address);
create index if not exists idx_encrypted_records_hash on public.encrypted_health_records(record_hash);

alter table public.encrypted_health_records enable row level security;

drop policy if exists "Allow insert of encrypted records" on public.encrypted_health_records;
create policy "Allow insert of encrypted records"
    on public.encrypted_health_records for insert with check (true);

drop policy if exists "Allow select of encrypted records" on public.encrypted_health_records;
create policy "Allow select of encrypted records"
    on public.encrypted_health_records for select using (true);

drop policy if exists "Allow update of encrypted records" on public.encrypted_health_records;
create policy "Allow update of encrypted records"
    on public.encrypted_health_records for update using (true);

-- 2. Access grants table (ECDH-wrapped DEKs only; never plaintext keys or diagnoses)
create table if not exists public.access_grants (
    id text primary key,
    room_id text not null default 'parda-demo-main',
    patient_address text not null,
    patient_name text,
    hospital_id integer not null,
    hospital_name text not null,
    hospital_address text not null,
    record_hash text not null,
    wrapped_dek jsonb not null,
    duration text not null,
    expires_at timestamp with time zone,
    is_revoked boolean not null default false,
    tx_hash text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_access_grants_room on public.access_grants(room_id, is_revoked);

alter table public.access_grants enable row level security;

drop policy if exists "Allow read access grants" on public.access_grants;
create policy "Allow read access grants"
    on public.access_grants for select using (true);

drop policy if exists "Allow insert access grants" on public.access_grants;
create policy "Allow insert access grants"
    on public.access_grants for insert with check (true);

drop policy if exists "Allow update access grants" on public.access_grants;
create policy "Allow update access grants"
    on public.access_grants for update using (true);

-- 3. Insurance claims table (ZKP public signals & settlement tx hashes only)
create table if not exists public.insurance_claims (
    id text primary key,
    room_id text not null default 'parda-demo-main',
    patient_address text,
    hospital_name text not null,
    hospital_license text,
    hospital_address text not null,
    payee text,
    amount_eth numeric not null,
    amount_inr integer,
    nullifier text not null,
    procedure_code text,
    procedure_name text,
    merkle_root text,
    status text not null default 'PENDING_INSURER_SETTLEMENT',
    tx_hash text,
    settled_by text,
    submitted_at text,
    settled_timestamp text,
    is_replay_blocked boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_insurance_claims_room on public.insurance_claims(room_id, status);

alter table public.insurance_claims enable row level security;

drop policy if exists "Allow read insurance claims" on public.insurance_claims;
create policy "Allow read insurance claims"
    on public.insurance_claims for select using (true);

drop policy if exists "Allow insert insurance claims" on public.insurance_claims;
create policy "Allow insert insurance claims"
    on public.insurance_claims for insert with check (true);

drop policy if exists "Allow update insurance claims" on public.insurance_claims;
create policy "Allow update insurance claims"
    on public.insurance_claims for update using (true);

-- 4. Shared portal sync state (balances, break-glass alerts, non-clinical patient pointer, audit log)
create table if not exists public.portal_sync_state (
    room_id text primary key,
    hospital_balance_eth numeric not null default 14.20,
    pool_balance_eth numeric not null default 10.00,
    claim_settled boolean not null default false,
    is_break_glass_active boolean not null default false,
    break_glass_reason text,
    active_patient_meta jsonb default '{}'::jsonb,
    audit_logs jsonb default '[]'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.portal_sync_state enable row level security;

drop policy if exists "Allow read portal sync state" on public.portal_sync_state;
create policy "Allow read portal sync state"
    on public.portal_sync_state for select using (true);

drop policy if exists "Allow insert portal sync state" on public.portal_sync_state;
create policy "Allow insert portal sync state"
    on public.portal_sync_state for insert with check (true);

drop policy if exists "Allow update portal sync state" on public.portal_sync_state;
create policy "Allow update portal sync state"
    on public.portal_sync_state for update using (true);

-- 5. Enable Supabase Realtime publication for multi-laptop live sync
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'encrypted_health_records'
    ) then
        alter publication supabase_realtime add table public.encrypted_health_records;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'access_grants'
    ) then
        alter publication supabase_realtime add table public.access_grants;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'insurance_claims'
    ) then
        alter publication supabase_realtime add table public.insurance_claims;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'portal_sync_state'
    ) then
        alter publication supabase_realtime add table public.portal_sync_state;
    end if;
exception
    when undefined_object then null;
end $$;

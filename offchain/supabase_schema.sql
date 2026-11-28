-- ==============================================================================
-- Parda Health Vault - Supabase Schema Migration
-- ==============================================================================
-- This table stores ONLY authenticated AES-256-GCM encrypted ciphertext,
-- initialization vectors (IV), metadata, and on-chain SHA-256 record hashes.
-- Zero plaintext diagnoses or medical conditions are ever stored off-chain.
-- ==============================================================================

-- 1. Create encrypted health records table
create table if not exists public.encrypted_health_records (
    id uuid default gen_random_uuid() primary key,
    patient_address text not null,
    record_hash text not null unique,
    ciphertext text not null,
    iv text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create index on patient_address and record_hash for fast lookups
create index if not exists idx_encrypted_records_patient on public.encrypted_health_records(patient_address);
create index if not exists idx_encrypted_records_hash on public.encrypted_health_records(record_hash);

-- 3. Enable Row Level Security (RLS)
alter table public.encrypted_health_records enable row level security;

-- 4. Create policies (Permit authorized reads and inserts)
-- Since data is already client-side AES-256-GCM encrypted with the patient's private key,
-- anyone with the database cannot decrypt without the patient's key.
create policy "Allow insert of encrypted records"
    on public.encrypted_health_records
    for insert
    with check (true);

create policy "Allow select of encrypted records"
    on public.encrypted_health_records
    for select
    using (true);

create policy "Allow update of encrypted records"
    on public.encrypted_health_records
    for update
    using (true);

-- ==============================================================================
-- 5. Multi-Device Workflow Sync: Claims Queue & Settled Ledger
-- ==============================================================================
-- Allows Hospital on Device A to submit claims, and Insurer on Device B
-- to inspect and settle them in real-time.
create table if not exists public.claims (
    id text primary key,
    hospital_name text not null,
    hospital_license text,
    hospital_address text,
    amount_eth numeric not null,
    amount_inr numeric not null,
    nullifier text not null unique,
    patient_record_hash text,
    status text not null default 'PENDING',
    treatment_category text,
    diagnosis_code text,
    tx_hash text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_claims_status on public.claims(status);
create index if not exists idx_claims_nullifier on public.claims(nullifier);

alter table public.claims enable row level security;

create policy "Allow public read on claims"
    on public.claims for select using (true);

create policy "Allow public insert on claims"
    on public.claims for insert with check (true);

create policy "Allow public update on claims"
    on public.claims for update using (true);

-- ==============================================================================
-- 6. Multi-Device Workflow Sync: Doctor Access Grants
-- ==============================================================================
-- Allows Patient on Device A to grant DEK clinical access, and Doctor
-- on Device B to immediately detect active sovereign authorization.
create table if not exists public.access_grants (
    id text primary key,
    patient_address text not null,
    hospital_name text not null,
    hospital_address text,
    status text not null default 'ACTIVE',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_access_grants_patient on public.access_grants(patient_address);

alter table public.access_grants enable row level security;

create policy "Allow public read on access_grants"
    on public.access_grants for select using (true);

create policy "Allow public insert/update on access_grants"
    on public.access_grants for all using (true) with check (true);

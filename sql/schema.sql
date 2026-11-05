-- ============================================================
-- DIGITAL LOYALTY PLATFORM FOR BARBERSHOPS - SUPABASE SCHEMA
-- ============================================================

-- 1. businesses – each barbershop is a tenant
create table if not exists public.businesses (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    logo_url text,
    primary_color text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. user_profiles – extends Supabase auth users
create table if not exists public.user_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    business_id uuid not null references public.businesses (id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('owner','staff')),
    created_at timestamptz not null default now()
);

-- 3. customers – a person that receives haircut stamps
create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses (id) on delete cascade,
    full_name text not null,
    phone text,
    email text,
    qr_token text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. loyalty_programs – configurable rules per business
create table if not exists public.loyalty_programs (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses (id) on delete cascade,
    name text not null,
    stamps_required int not null check (stamps_required > 0),
    reward_title text not null,
    reward_description text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 5. loyalty_cards – one per customer per program
create table if not exists public.loyalty_cards (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers (id) on delete cascade,
    business_id uuid not null references public.businesses (id) on delete cascade,
    program_id uuid not null references public.loyalty_programs (id) on delete cascade,
    current_stamps int not null default 0 check (current_stamps >= 0),
    total_stamps_earned int not null default 0 check (total_stamps_earned >= 0),
    status text not null check (status in ('active','reward_available','inactive')) default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (customer_id, program_id)
);

-- 6. loyalty_transactions – immutable audit trail of every haircut stamp/redemption
create table if not exists public.loyalty_transactions (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers (id) on delete cascade,
    loyalty_card_id uuid not null references public.loyalty_cards (id) on delete cascade,
    business_id uuid not null references public.businesses (id) on delete cascade,
    action text not null check (action in ('stamp_added','reward_unlocked','reward_redeemed','adjustment')),
    stamps_change int not null default 0,
    performed_by uuid references auth.users (id),
    idempotency_key uuid,
    notes text,
    created_at timestamptz not null default now(),
    unique (idempotency_key)
);

-- 7. rewards – concrete reward instances linked to a loyalty card
create table if not exists public.rewards (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers (id) on delete cascade,
    loyalty_card_id uuid not null references public.loyalty_cards (id) on delete cascade,
    business_id uuid not null references public.businesses (id) on delete cascade,
    status text not null check (status in ('available','redeemed','expired')) default 'available',
    unlocked_at timestamptz not null default now(),
    redeemed_at timestamptz,
    redeemed_by uuid references auth.users (id),
    created_at timestamptz not null default now()
);

-- 8. wallet_cards – tracks external wallet provider state per customer
create table if not exists public.wallet_cards (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers (id) on delete cascade,
    loyalty_card_id uuid not null references public.loyalty_cards (id) on delete cascade,
    provider text not null check (provider in ('apple','google')),
    external_card_id text,
    wallet_url text,
    status text not null check (status in ('active','revoked','failed')) default 'active',
    last_updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (customer_id, provider)
);

-- Indexes for performance
create index if not exists idx_customers_business on public.customers (business_id);
create index if not exists idx_loyalty_cards_customer on public.loyalty_cards (customer_id);
create index if not exists idx_loyalty_cards_program on public.loyalty_cards (program_id);
create index if not exists idx_loyalty_transactions_card on public.loyalty_transactions (loyalty_card_id);
create index if not exists idx_rewards_customer on public.rewards (customer_id);
create index if not exists idx_wallet_cards_customer on public.wallet_cards (customer_id);

-- Enable Row-Level Security
alter table public.businesses enable row level security;
alter table public.user_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.wallet_cards enable row level security;

-- Helper function: current user's business
create or replace function public.current_user_business() returns uuid
    language sql stable security definer as $$
        select business_id from public.user_profiles where id = auth.uid();
$$;

-- Businesses policies
create policy "businesses_select" on public.businesses for select using (true);
create policy "businesses_insert" on public.businesses for insert with check (true);
create policy "businesses_update" on public.businesses for update using (id = public.current_user_business());

-- User Profiles policies
create policy "user_profile_select" on public.user_profiles for select using (id = auth.uid());
create policy "user_profile_insert" on public.user_profiles for insert with check (id = auth.uid());
create policy "user_profile_update" on public.user_profiles for update using (id = auth.uid());

-- Customers policies
create policy "customers_select" on public.customers for select using (business_id = public.current_user_business());
create policy "customers_insert" on public.customers for insert with check (business_id = public.current_user_business());
create policy "customers_update" on public.customers for update using (business_id = public.current_user_business()) with check (business_id = public.current_user_business());
create policy "customers_delete" on public.customers for delete using (business_id = public.current_user_business());

-- Loyalty Programs policies
create policy "programs_select" on public.loyalty_programs for select using (business_id = public.current_user_business());
create policy "programs_insert" on public.loyalty_programs for insert with check (business_id = public.current_user_business());
create policy "programs_update" on public.loyalty_programs for update using (business_id = public.current_user_business()) with check (business_id = public.current_user_business());
create policy "programs_delete" on public.loyalty_programs for delete using (business_id = public.current_user_business());

-- Loyalty Cards policies
create policy "cards_select" on public.loyalty_cards for select using (business_id = public.current_user_business());
create policy "cards_insert" on public.loyalty_cards for insert with check (business_id = public.current_user_business());
create policy "cards_update" on public.loyalty_cards for update using (business_id = public.current_user_business()) with check (business_id = public.current_user_business());
create policy "cards_delete" on public.loyalty_cards for delete using (business_id = public.current_user_business());

-- Loyalty Transactions policies (immutable, no update, no delete)
create policy "tx_select" on public.loyalty_transactions for select using (business_id = public.current_user_business());
create policy "tx_insert" on public.loyalty_transactions for insert with check (business_id = public.current_user_business());
create policy "tx_no_update" on public.loyalty_transactions for update using (false);
create policy "tx_no_delete" on public.loyalty_transactions for delete using (false);

-- Rewards policies
create policy "rewards_select" on public.rewards for select using (business_id = public.current_user_business());
create policy "rewards_insert" on public.rewards for insert with check (business_id = public.current_user_business());
create policy "rewards_update" on public.rewards for update using (business_id = public.current_user_business()) with check (business_id = public.current_user_business());
create policy "rewards_delete" on public.rewards for delete using (business_id = public.current_user_business());

-- Wallet Cards policies
create policy "wallet_select" on public.wallet_cards for select using (business_id = public.current_user_business());
create policy "wallet_insert" on public.wallet_cards for insert with check (business_id = public.current_user_business());
create policy "wallet_update" on public.wallet_cards for update using (business_id = public.current_user_business()) with check (business_id = public.current_user_business());
create policy "wallet_delete" on public.wallet_cards for delete using (business_id = public.current_user_business());

-- ------------------------------------------------------------
-- RPC Functions – atomic loyalty operations
-- ------------------------------------------------------------
create or replace function public.add_stamp(
    p_customer_id uuid,
    p_performed_by uuid,
    p_idempotency_key uuid
) returns uuid language plpgsql security definer as $$
declare
    v_card loyalty_cards%rowtype;
    v_program loyalty_programs%rowtype;
    v_new_tx_id uuid;
    v_reward_id uuid;
begin
    -- Verify customer belongs to caller's business
    perform 1 from public.customers where id = p_customer_id and business_id = public.current_user_business();
    if not found then
        raise exception 'Customer not found or not in your business';
    end if;

    -- Get active loyalty card
    select * into v_card
    from public.loyalty_cards
    where customer_id = p_customer_id and status in ('active','reward_available')
    order by created_at desc limit 1;
    if v_card.id is null then
        raise exception 'No active loyalty card for customer';
    end if;

    -- Idempotency guard – return existing transaction if key already used
    select id into v_new_tx_id from public.loyalty_transactions where idempotency_key = p_idempotency_key;
    if v_new_tx_id is not null then
        return v_new_tx_id;
    end if;

    -- Load program
    select * into v_program from public.loyalty_programs where id = v_card.program_id;

    -- Update card stamps
    update public.loyalty_cards set
        current_stamps = current_stamps + 1,
        total_stamps_earned = total_stamps_earned + 1,
        updated_at = now()
    where id = v_card.id;

    -- Record stamp transaction
    insert into public.loyalty_transactions (
        id, customer_id, loyalty_card_id, business_id, action, stamps_change, performed_by, idempotency_key, notes
    ) values (
        gen_random_uuid(), p_customer_id, v_card.id, v_card.business_id,
        'stamp_added', 1, p_performed_by, p_idempotency_key,
        'Stamp added via add_stamp RPC'
    ) returning id into v_new_tx_id;

    -- Check reward eligibility
    if (v_card.current_stamps + 1) >= v_program.stamps_required then
        -- Create reward row
        insert into public.rewards (
            id, customer_id, loyalty_card_id, business_id, status, unlocked_at, created_at
        ) values (
            gen_random_uuid(), p_customer_id, v_card.id, v_card.business_id,
            'available', now(), now()
        ) returning id into v_reward_id;

        -- Update card status
        update public.loyalty_cards set status = 'reward_available', updated_at = now() where id = v_card.id;

        -- Record reward_unlocked transaction
        insert into public.loyalty_transactions (
            id, customer_id, loyalty_card_id, business_id, action, stamps_change, performed_by, notes
        ) values (
            gen_random_uuid(), p_customer_id, v_card.id, v_card.business_id,
            'reward_unlocked', 0, p_performed_by,
            'Reward unlocked (reward id ' || v_reward_id || ')'
        );
    end if;

    return v_new_tx_id;
end;
$$;

create or replace function public.redeem_reward(
    p_reward_id uuid,
    p_performed_by uuid,
    p_idempotency_key uuid
) returns void language plpgsql security definer as $$
declare
    v_reward rewards%rowtype;
    v_card loyalty_cards%rowtype;
    v_tx_exists uuid;
begin
    -- Idempotency guard
    select id into v_tx_exists from public.loyalty_transactions where idempotency_key = p_idempotency_key;
    if v_tx_exists is not null then
        return;
    end if;

    select * into v_reward from public.rewards where id = p_reward_id;
    if v_reward.id is null then
        raise exception 'Reward not found';
    end if;
    if v_reward.status <> 'available' then
        raise exception 'Reward not available for redemption';
    end if;

    select * into v_card from public.loyalty_cards where id = v_reward.loyalty_card_id;
    if v_card.id is null then
        raise exception 'Related loyalty card not found';
    end if;

    -- Update reward
    update public.rewards set
        status = 'redeemed',
        redeemed_at = now(),
        redeemed_by = p_performed_by,
        updated_at = now()
    where id = p_reward_id;

    -- Reset card stamps and status
    update public.loyalty_cards set
        current_stamps = 0,
        status = 'active',
        updated_at = now()
    where id = v_card.id;

    -- Record redemption transaction
    insert into public.loyalty_transactions (
        id, customer_id, loyalty_card_id, business_id, action, stamps_change, performed_by, idempotency_key, notes
    ) values (
        gen_random_uuid(), v_reward.customer_id, v_card.id, v_card.business_id,
        'reward_redeemed', 0, p_performed_by, p_idempotency_key,
        'Reward redeemed (reward id ' || p_reward_id || ')'
    );
end;
$$;

grant execute on function public.add_stamp(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.redeem_reward(uuid, uuid, uuid) to anon, authenticated;

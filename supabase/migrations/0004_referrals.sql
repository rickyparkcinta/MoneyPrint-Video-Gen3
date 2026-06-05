create table if not exists public.referral_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  constraint referral_codes_code_format check (code ~ '^MP[0-9A-F]{10}$')
);

create table if not exists public.referrals (
  referred_user_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text not null,
  created_at timestamptz not null default now(),
  constraint referrals_no_self_referral check (referred_user_id <> referrer_user_id)
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  payer_user_id uuid not null references public.profiles(id) on delete cascade,
  earner_user_id uuid not null references public.profiles(id) on delete cascade,
  level int not null check (level >= 1),
  basis_credits int not null check (basis_credits > 0),
  reward_percent numeric(8, 4) not null check (reward_percent > 0),
  granted_credits int not null check (granted_credits > 0),
  source text not null,
  credit_transaction_id uuid references public.credit_transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint referral_rewards_event_earner_key unique (stripe_event_id, earner_user_id)
);

create index if not exists referrals_referrer_user_id_idx on public.referrals(referrer_user_id);
create index if not exists referrals_created_at_idx on public.referrals(created_at desc);
create index if not exists referral_rewards_payer_created_idx on public.referral_rewards(payer_user_id, created_at desc);
create index if not exists referral_rewards_earner_created_idx on public.referral_rewards(earner_user_id, created_at desc);
create index if not exists referral_rewards_level_idx on public.referral_rewards(level);

create or replace function public.ensure_referral_code(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_code text;
  v_code text;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  select code into v_existing_code
  from public.referral_codes
  where user_id = p_user_id;

  if v_existing_code is not null then
    return v_existing_code;
  end if;

  loop
    v_code := 'MP' || upper(encode(gen_random_bytes(5), 'hex'));

    begin
      insert into public.referral_codes (user_id, code)
      values (p_user_id, v_code)
      returning code into v_existing_code;

      return v_existing_code;
    exception
      when unique_violation then
        null;
    end;
  end loop;
end;
$$;

create or replace function public.claim_referral(
  p_referred_user_id uuid,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_referrer_user_id uuid;
  v_inserted int;
  v_has_cycle boolean;
begin
  if p_referred_user_id is null or p_code is null then
    return false;
  end if;

  v_code := upper(trim(p_code));
  if v_code = '' then
    return false;
  end if;

  select user_id into v_referrer_user_id
  from public.referral_codes
  where code = v_code;

  if v_referrer_user_id is null or v_referrer_user_id = p_referred_user_id then
    return false;
  end if;

  with recursive ancestors(user_id, path) as (
    select v_referrer_user_id, array[v_referrer_user_id]::uuid[]
    union all
    select r.referrer_user_id, ancestors.path || r.referrer_user_id
    from public.referrals r
    join ancestors on r.referred_user_id = ancestors.user_id
    where not r.referrer_user_id = any(ancestors.path)
  )
  select exists (
    select 1 from ancestors where user_id = p_referred_user_id
  ) into v_has_cycle;

  if v_has_cycle then
    return false;
  end if;

  insert into public.referrals (referred_user_id, referrer_user_id, referral_code)
  values (p_referred_user_id, v_referrer_user_id, v_code)
  on conflict (referred_user_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

create or replace function public.process_referral_payment(
  p_payer_user_id uuid,
  p_basis_credits int,
  p_source text,
  p_stripe_event_id text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward record;
  v_granted_count int := 0;
  v_transaction_id uuid;
  v_credit_event_id text;
begin
  if p_payer_user_id is null
     or p_basis_credits is null
     or p_basis_credits <= 0
     or p_stripe_event_id is null
     or trim(p_stripe_event_id) = '' then
    return 0;
  end if;

  for v_reward in
    with recursive ancestors(earner_user_id, level, path) as (
      select r.referrer_user_id, 1, array[p_payer_user_id, r.referrer_user_id]::uuid[]
      from public.referrals r
      where r.referred_user_id = p_payer_user_id
      union all
      select r.referrer_user_id, ancestors.level + 1, ancestors.path || r.referrer_user_id
      from public.referrals r
      join ancestors on r.referred_user_id = ancestors.earner_user_id
      where not r.referrer_user_id = any(ancestors.path)
    )
    select
      earner_user_id,
      level,
      case
        when level = 1 then 0.20::numeric
        when level = 2 then 0.10::numeric
        else 0.01::numeric
      end as reward_percent,
      floor(
        p_basis_credits::numeric *
        case
          when level = 1 then 0.20::numeric
          when level = 2 then 0.10::numeric
          else 0.01::numeric
        end
      )::int as granted_credits
    from ancestors
  loop
    if v_reward.granted_credits > 0 then
      v_credit_event_id := p_stripe_event_id || ':referral:' || v_reward.earner_user_id::text;

      if not exists (
        select 1
        from public.referral_rewards
        where stripe_event_id = p_stripe_event_id
          and earner_user_id = v_reward.earner_user_id
      ) then
        perform public.grant_user_credits(
          v_reward.earner_user_id,
          v_reward.granted_credits,
          'referral_reward',
          v_credit_event_id
        );

        select id into v_transaction_id
        from public.credit_transactions
        where stripe_event_id = v_credit_event_id
        limit 1;

        insert into public.referral_rewards (
          stripe_event_id,
          payer_user_id,
          earner_user_id,
          level,
          basis_credits,
          reward_percent,
          granted_credits,
          source,
          credit_transaction_id
        )
        values (
          p_stripe_event_id,
          p_payer_user_id,
          v_reward.earner_user_id,
          v_reward.level,
          p_basis_credits,
          v_reward.reward_percent,
          v_reward.granted_credits,
          coalesce(nullif(trim(p_source), ''), 'stripe_payment'),
          v_transaction_id
        )
        on conflict (stripe_event_id, earner_user_id) do nothing;

        if found then
          v_granted_count := v_granted_count + 1;
        end if;
      end if;
    end if;
  end loop;

  return v_granted_count;
end;
$$;

create or replace function public.get_referral_tree(p_root_user_id uuid)
returns table (
  user_id uuid,
  referrer_user_id uuid,
  level int,
  created_at timestamptz,
  email text,
  full_name text
)
language sql
security definer
set search_path = public
as $$
  with recursive tree(user_id, referrer_user_id, level, created_at, path) as (
    select
      r.referred_user_id,
      r.referrer_user_id,
      1,
      r.created_at,
      array[p_root_user_id, r.referred_user_id]::uuid[]
    from public.referrals r
    where r.referrer_user_id = p_root_user_id
    union all
    select
      r.referred_user_id,
      r.referrer_user_id,
      tree.level + 1,
      r.created_at,
      tree.path || r.referred_user_id
    from public.referrals r
    join tree on r.referrer_user_id = tree.user_id
    where not r.referred_user_id = any(tree.path)
  )
  select
    tree.user_id,
    tree.referrer_user_id,
    tree.level,
    tree.created_at,
    p.email,
    p.full_name
  from tree
  left join public.profiles p on p.id = tree.user_id
  order by tree.level asc, tree.created_at desc;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referral_code text;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  perform public.ensure_referral_code(new.id);

  v_referral_code := new.raw_user_meta_data ->> 'referral_code';
  if v_referral_code is not null then
    perform public.claim_referral(new.id, v_referral_code);
  end if;

  insert into public.credit_balances (user_id, balance)
  values (new.id, 5)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, source)
  values (new.id, 5, 'grant', 'free_trial');

  return new;
end;
$$;

select public.ensure_referral_code(id)
from public.profiles;

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists "referral codes own select" on public.referral_codes;
create policy "referral codes own select" on public.referral_codes
for select using (auth.uid() = user_id);

drop policy if exists "referrals own select" on public.referrals;
create policy "referrals own select" on public.referrals
for select using (auth.uid() = referred_user_id or auth.uid() = referrer_user_id);

drop policy if exists "referral rewards own select" on public.referral_rewards;
create policy "referral rewards own select" on public.referral_rewards
for select using (auth.uid() = payer_user_id or auth.uid() = earner_user_id);

create extension if not exists "pgcrypto";

do $$ begin
  create type public.video_job_status as enum (
    'queued',
    'dispatching',
    'claimed',
    'generating_script',
    'generating_voice',
    'fetching_assets',
    'generating_subtitles',
    'rendering_video',
    'uploading',
    'completed',
    'failed',
    'cancelled',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text not null,
  monthly_credits int not null check (monthly_credits >= 0),
  stripe_price_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan_id text references public.plans(id),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.video_job_status not null default 'queued',
  progress int not null default 0 check (progress >= 0 and progress <= 100),
  topic text not null,
  prompt text,
  language text not null default 'en',
  aspect_ratio text not null default '9:16',
  duration_seconds int not null default 30,
  voice_id text,
  subtitle_style text,
  music_style text,
  variants int not null default 1,
  credit_cost int not null default 1,
  credit_transaction_id uuid,
  output_path text,
  output_url text,
  thumbnail_path text,
  script_path text,
  subtitles_path text,
  worker_metadata jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  attempt_count int not null default 0,
  max_attempts int not null default 3,
  locked_by text,
  locked_until timestamptz,
  qstash_message_id text,
  cloud_run_execution_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_job_id uuid references public.video_jobs(id) on delete set null,
  amount int not null,
  type text not null,
  source text,
  stripe_event_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_transactions_stripe_event_id_key
  on public.credit_transactions(stripe_event_id)
  where stripe_event_id is not null;

alter table public.video_jobs
  drop constraint if exists video_jobs_credit_transaction_id_fkey;

alter table public.video_jobs
  add constraint video_jobs_credit_transaction_id_fkey
  foreign key (credit_transaction_id) references public.credit_transactions(id) on delete set null;

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.video_jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  message text,
  progress int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_job_id uuid references public.video_jobs(id) on delete set null,
  provider text not null,
  model text,
  input_units numeric,
  output_units numeric,
  estimated_cost_usd numeric,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists video_jobs_user_created_idx on public.video_jobs(user_id, created_at desc);
create index if not exists video_jobs_status_locked_idx on public.video_jobs(status, locked_until);
create index if not exists job_events_job_created_idx on public.job_events(job_id, created_at desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);

insert into public.plans (id, name, monthly_credits)
values
  ('free', 'Free Trial', 5),
  ('starter', 'Starter', 50),
  ('pro', 'Pro', 180),
  ('agency', 'Agency', 700)
on conflict (id) do update
set name = excluded.name,
    monthly_credits = excluded.monthly_credits;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

drop trigger if exists video_jobs_touch_updated_at on public.video_jobs;
create trigger video_jobs_touch_updated_at
before update on public.video_jobs
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.credit_balances (user_id, balance)
  values (new.id, 5)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, source)
  values (new.id, 5, 'grant', 'free_trial');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.grant_user_credits(
  p_user_id uuid,
  p_amount int,
  p_source text,
  p_stripe_event_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'credit grant must be positive';
  end if;

  if p_stripe_event_id is not null and exists (
    select 1 from public.credit_transactions where stripe_event_id = p_stripe_event_id
  ) then
    return;
  end if;

  insert into public.credit_balances (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
  set balance = public.credit_balances.balance + excluded.balance,
      updated_at = now();

  insert into public.credit_transactions (user_id, amount, type, source, stripe_event_id)
  values (p_user_id, p_amount, 'grant', p_source, p_stripe_event_id);
end;
$$;

create or replace function public.create_video_job_with_credit(
  p_user_id uuid,
  p_topic text,
  p_prompt text,
  p_language text,
  p_aspect_ratio text,
  p_duration_seconds int,
  p_voice_id text,
  p_subtitle_style text,
  p_music_style text,
  p_variants int,
  p_credit_cost int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_transaction_id uuid;
  v_job_id uuid;
begin
  if p_credit_cost <= 0 then
    raise exception 'credit cost must be positive';
  end if;

  insert into public.credit_balances (user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select balance into v_balance
  from public.credit_balances
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) < p_credit_cost then
    raise exception 'insufficient credits';
  end if;

  update public.credit_balances
  set balance = balance - p_credit_cost,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, type, source)
  values (p_user_id, -p_credit_cost, 'deduct', 'video_job')
  returning id into v_transaction_id;

  insert into public.video_jobs (
    user_id,
    topic,
    prompt,
    language,
    aspect_ratio,
    duration_seconds,
    voice_id,
    subtitle_style,
    music_style,
    variants,
    credit_cost,
    credit_transaction_id
  )
  values (
    p_user_id,
    p_topic,
    p_prompt,
    p_language,
    p_aspect_ratio,
    p_duration_seconds,
    p_voice_id,
    p_subtitle_style,
    p_music_style,
    p_variants,
    p_credit_cost,
    v_transaction_id
  )
  returning id into v_job_id;

  update public.credit_transactions
  set video_job_id = v_job_id
  where id = v_transaction_id;

  insert into public.job_events (job_id, user_id, event_type, message, progress)
  values (v_job_id, p_user_id, 'queued', 'Job queued and credits deducted.', 0);

  return jsonb_build_object('job_id', v_job_id, 'credit_transaction_id', v_transaction_id);
end;
$$;

create or replace function public.fail_video_job_and_refund(
  p_job_id uuid,
  p_error_code text,
  p_error_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.video_jobs%rowtype;
begin
  select * into v_job
  from public.video_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'job not found';
  end if;

  if v_job.status not in ('completed', 'failed', 'cancelled', 'expired')
     and not exists (
       select 1 from public.credit_transactions
       where video_job_id = p_job_id and type = 'refund'
     ) then
    update public.credit_balances
    set balance = balance + v_job.credit_cost,
        updated_at = now()
    where user_id = v_job.user_id;

    insert into public.credit_transactions (user_id, video_job_id, amount, type, source)
    values (v_job.user_id, p_job_id, v_job.credit_cost, 'refund', 'video_job_failed');
  end if;

  update public.video_jobs
  set status = 'failed',
      error_code = p_error_code,
      error_message = p_error_message,
      locked_by = null,
      locked_until = null,
      updated_at = now()
  where id = p_job_id;

  insert into public.job_events (job_id, user_id, event_type, message, progress)
  values (p_job_id, v_job.user_id, 'failed', p_error_message, null);
end;
$$;

create or replace function public.refund_video_job_credit(
  p_job_id uuid,
  p_source text default 'admin_refund'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.video_jobs%rowtype;
begin
  select * into v_job
  from public.video_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'job not found';
  end if;

  if exists (
    select 1 from public.credit_transactions
    where video_job_id = p_job_id and type = 'refund'
  ) then
    return;
  end if;

  update public.credit_balances
  set balance = balance + v_job.credit_cost,
      updated_at = now()
  where user_id = v_job.user_id;

  insert into public.credit_transactions (user_id, video_job_id, amount, type, source)
  values (v_job.user_id, p_job_id, v_job.credit_cost, 'refund', p_source);

  insert into public.job_events (job_id, user_id, event_type, message, progress)
  values (p_job_id, v_job.user_id, 'refunded', 'Credits refunded.', v_job.progress);
end;
$$;

create or replace function public.cancel_video_job_and_refund(
  p_job_id uuid,
  p_message text default 'Cancelled by admin.'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.video_jobs%rowtype;
begin
  select * into v_job
  from public.video_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'job not found';
  end if;

  if v_job.status = 'completed' then
    raise exception 'completed jobs cannot be cancelled';
  end if;

  perform public.refund_video_job_credit(p_job_id, 'admin_cancel');

  update public.video_jobs
  set status = 'cancelled',
      locked_by = null,
      locked_until = null,
      error_code = 'admin_cancelled',
      error_message = p_message,
      updated_at = now()
  where id = p_job_id;

  insert into public.job_events (job_id, user_id, event_type, message, progress)
  values (p_job_id, v_job.user_id, 'cancelled', p_message, v_job.progress);
end;
$$;

create or replace function public.claim_video_job(
  p_job_id uuid,
  p_worker_id text,
  p_lock_minutes int default 45
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.video_jobs%rowtype;
begin
  select * into v_job
  from public.video_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'job not found';
  end if;

  if v_job.status in ('completed', 'failed', 'cancelled', 'expired') then
    return to_jsonb(v_job);
  end if;

  if v_job.locked_until is not null and v_job.locked_until > now() and v_job.locked_by <> p_worker_id then
    raise exception 'job is already locked';
  end if;

  update public.video_jobs
  set status = 'claimed',
      progress = greatest(progress, 2),
      locked_by = p_worker_id,
      locked_until = now() + make_interval(mins => p_lock_minutes),
      attempt_count = attempt_count + 1,
      started_at = coalesce(started_at, now()),
      updated_at = now()
  where id = p_job_id
  returning * into v_job;

  insert into public.job_events (job_id, user_id, event_type, message, progress)
  values (p_job_id, v_job.user_id, 'claimed', 'Worker claimed the job.', v_job.progress);

  return to_jsonb(v_job);
end;
$$;

create or replace function public.update_video_job_progress(
  p_job_id uuid,
  p_status public.video_job_status,
  p_progress int,
  p_message text default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  update public.video_jobs
  set status = p_status,
      progress = least(100, greatest(0, p_progress)),
      worker_metadata = coalesce(worker_metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
      locked_until = now() + interval '45 minutes',
      updated_at = now()
  where id = p_job_id
  returning user_id into v_user_id;

  if v_user_id is not null then
    insert into public.job_events (job_id, user_id, event_type, message, progress, metadata)
    values (p_job_id, v_user_id, p_status::text, p_message, p_progress, p_metadata);
  end if;
end;
$$;

create or replace function public.complete_video_job(
  p_job_id uuid,
  p_output_path text,
  p_thumbnail_path text default null,
  p_script_path text default null,
  p_subtitles_path text default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  update public.video_jobs
  set status = 'completed',
      progress = 100,
      output_path = p_output_path,
      thumbnail_path = p_thumbnail_path,
      script_path = p_script_path,
      subtitles_path = p_subtitles_path,
      worker_metadata = coalesce(worker_metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
      locked_by = null,
      locked_until = null,
      completed_at = now(),
      updated_at = now()
  where id = p_job_id
  returning user_id into v_user_id;

  if v_user_id is not null then
    insert into public.job_events (job_id, user_id, event_type, message, progress, metadata)
    values (p_job_id, v_user_id, 'completed', 'Video completed and uploaded.', 100, p_metadata);
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.credit_balances enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.video_jobs enable row level security;
alter table public.job_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.provider_usage_logs enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "credit balances own select" on public.credit_balances;
create policy "credit balances own select" on public.credit_balances
for select using (auth.uid() = user_id);

drop policy if exists "credit transactions own select" on public.credit_transactions;
create policy "credit transactions own select" on public.credit_transactions
for select using (auth.uid() = user_id);

drop policy if exists "video jobs own select" on public.video_jobs;
create policy "video jobs own select" on public.video_jobs
for select using (auth.uid() = user_id);

drop policy if exists "job events own select" on public.job_events;
create policy "job events own select" on public.job_events
for select using (auth.uid() = user_id);

drop policy if exists "subscriptions own select" on public.subscriptions;
create policy "subscriptions own select" on public.subscriptions
for select using (auth.uid() = user_id);

drop policy if exists "provider usage own select" on public.provider_usage_logs;
create policy "provider usage own select" on public.provider_usage_logs
for select using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do update set public = false;

drop policy if exists "users read own videos" on storage.objects;
create policy "users read own videos" on storage.objects
for select using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
);

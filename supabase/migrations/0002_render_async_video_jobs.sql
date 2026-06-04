alter type public.video_job_status add value if not exists 'processing';

alter table public.video_jobs
  add column if not exists input jsonb not null default '{}'::jsonb,
  add column if not exists output_bucket text,
  add column if not exists attempts int not null default 0,
  add column if not exists locked_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists render_dispatch_id text,
  add column if not exists render_worker_url text;

update public.video_jobs
set input = jsonb_strip_nulls(jsonb_build_object(
      'topic', topic,
      'prompt', prompt,
      'language', language,
      'aspectRatio', aspect_ratio,
      'durationSeconds', duration_seconds,
      'voiceId', voice_id,
      'subtitleStyle', subtitle_style,
      'musicStyle', music_style,
      'variants', variants
    ))
where input = '{}'::jsonb;

update public.video_jobs
set attempts = attempt_count
where attempts = 0 and attempt_count > 0;

update public.video_jobs
set locked_at = started_at
where locked_at is null and locked_by is not null;

update public.video_jobs
set finished_at = completed_at
where finished_at is null and completed_at is not null;

create index if not exists video_jobs_user_id_idx on public.video_jobs(user_id);
create index if not exists video_jobs_status_idx on public.video_jobs(status);
create index if not exists video_jobs_created_at_desc_idx on public.video_jobs(created_at desc);
create index if not exists video_jobs_locked_at_idx on public.video_jobs(locked_at);

drop policy if exists "video jobs own insert" on public.video_jobs;
create policy "video jobs own insert" on public.video_jobs
for insert with check (auth.uid() = user_id);

drop function if exists public.create_video_job_with_credit(
  uuid,
  text,
  text,
  text,
  text,
  int,
  text,
  text,
  text,
  int,
  int
);

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
  p_credit_cost int,
  p_input jsonb default '{}'::jsonb
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
    credit_transaction_id,
    input
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
    v_transaction_id,
    coalesce(nullif(p_input, '{}'::jsonb), jsonb_strip_nulls(jsonb_build_object(
      'topic', p_topic,
      'prompt', p_prompt,
      'language', p_language,
      'aspectRatio', p_aspect_ratio,
      'durationSeconds', p_duration_seconds,
      'voiceId', p_voice_id,
      'subtitleStyle', p_subtitle_style,
      'musicStyle', p_music_style,
      'variants', p_variants
    )))
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
  update public.video_jobs
  set status = 'processing',
      progress = greatest(progress, 2),
      locked_by = p_worker_id,
      locked_at = now(),
      locked_until = now() + make_interval(mins => p_lock_minutes),
      attempts = attempts + 1,
      attempt_count = attempt_count + 1,
      started_at = coalesce(started_at, now()),
      updated_at = now()
  where id = p_job_id
    and status in ('queued', 'dispatching', 'claimed', 'processing', 'generating_script', 'generating_voice', 'fetching_assets', 'generating_subtitles', 'rendering_video', 'uploading')
    and (
      locked_until is null
      or locked_until <= now()
      or locked_by = p_worker_id
    )
  returning * into v_job;

  if found then
    insert into public.job_events (job_id, user_id, event_type, message, progress)
    values (p_job_id, v_job.user_id, 'processing', 'Render worker claimed the job.', v_job.progress);

    return to_jsonb(v_job);
  end if;

  select * into v_job
  from public.video_jobs
  where id = p_job_id;

  if not found then
    raise exception 'job not found';
  end if;

  return to_jsonb(v_job);
end;
$$;

create or replace function public.complete_video_job(
  p_job_id uuid,
  p_output_bucket text,
  p_output_path text,
  p_output_url text default null
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
      output_bucket = p_output_bucket,
      output_path = p_output_path,
      output_url = p_output_url,
      locked_by = null,
      locked_until = null,
      locked_at = null,
      completed_at = coalesce(completed_at, now()),
      finished_at = now(),
      updated_at = now()
  where id = p_job_id
  returning user_id into v_user_id;

  if v_user_id is not null then
    insert into public.job_events (job_id, user_id, event_type, message, progress, metadata)
    values (
      p_job_id,
      v_user_id,
      'completed',
      'Video completed and uploaded.',
      100,
      jsonb_build_object('output_bucket', p_output_bucket, 'output_path', p_output_path, 'output_url', p_output_url)
    );
  end if;
end;
$$;

create or replace function public.complete_video_job_with_artifacts(
  p_job_id uuid,
  p_output_bucket text,
  p_output_path text,
  p_output_url text default null,
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
      output_bucket = p_output_bucket,
      output_path = p_output_path,
      output_url = p_output_url,
      thumbnail_path = p_thumbnail_path,
      script_path = p_script_path,
      subtitles_path = p_subtitles_path,
      worker_metadata = coalesce(worker_metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
      locked_by = null,
      locked_until = null,
      locked_at = null,
      completed_at = coalesce(completed_at, now()),
      finished_at = now(),
      updated_at = now()
  where id = p_job_id
  returning user_id into v_user_id;

  if v_user_id is not null then
    insert into public.job_events (job_id, user_id, event_type, message, progress, metadata)
    values (p_job_id, v_user_id, 'completed', 'Video completed and uploaded.', 100, p_metadata);
  end if;
end;
$$;

create or replace function public.fail_video_job(
  p_job_id uuid,
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
      error_code = 'worker_failed',
      error_message = p_error_message,
      locked_by = null,
      locked_until = null,
      locked_at = null,
      finished_at = now(),
      updated_at = now()
  where id = p_job_id;

  insert into public.job_events (job_id, user_id, event_type, message, progress)
  values (p_job_id, v_job.user_id, 'failed', p_error_message, null);
end;
$$;

create or replace function public.find_video_jobs_for_worker(
  p_limit int default 1,
  p_stale_minutes int default 60
)
returns setof public.video_jobs
language sql
security definer
set search_path = public
as $$
  select *
  from public.video_jobs
  where status in ('queued', 'dispatching', 'processing')
    and (
      locked_until is null
      or locked_until <= now()
      or locked_at <= now() - make_interval(mins => p_stale_minutes)
    )
  order by created_at asc
  limit greatest(1, least(p_limit, 10));
$$;

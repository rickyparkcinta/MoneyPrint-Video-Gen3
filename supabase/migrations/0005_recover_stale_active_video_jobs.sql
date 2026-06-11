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
  where status in (
      'queued',
      'dispatching',
      'claimed',
      'processing',
      'generating_script',
      'generating_voice',
      'fetching_assets',
      'generating_subtitles',
      'rendering_video',
      'uploading'
    )
    and (
      locked_until is null
      or locked_until <= now()
      or locked_at <= now() - make_interval(mins => p_stale_minutes)
    )
  order by created_at asc
  limit greatest(1, least(p_limit, 10));
$$;

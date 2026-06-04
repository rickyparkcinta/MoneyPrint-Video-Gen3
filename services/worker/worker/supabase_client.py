from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import create_client

from worker.config import WorkerConfig


@lru_cache(maxsize=1)
def get_supabase():
    config = WorkerConfig.from_env()
    return create_client(config.supabase_url, config.supabase_service_role_key)


def rpc_or_raise(function_name: str, params: dict[str, Any]) -> Any:
    response = get_supabase().rpc(function_name, params).execute()
    return response.data


def get_job(job_id: str) -> dict[str, Any] | None:
    response = (
        get_supabase()
        .from_("video_jobs")
        .select("*")
        .eq("id", job_id)
        .maybe_single()
        .execute()
    )
    return response.data


def list_claimable_jobs(limit: int, stale_minutes: int) -> list[dict[str, Any]]:
    data = rpc_or_raise(
        "find_video_jobs_for_worker",
        {"p_limit": limit, "p_stale_minutes": stale_minutes},
    )
    return data or []


def insert_job_event(job_id: str, user_id: str, event_type: str, message: str, progress: int | None = None) -> None:
    get_supabase().from_("job_events").insert(
        {
            "job_id": job_id,
            "user_id": user_id,
            "event_type": event_type,
            "message": message,
            "progress": progress,
        }
    ).execute()

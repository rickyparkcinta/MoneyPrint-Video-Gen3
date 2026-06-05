from __future__ import annotations

import mimetypes
import os
import shutil
import sys
import tempfile
import traceback
from pathlib import Path
from typing import Any

import toml

from worker.config import WorkerConfig
from worker.supabase_client import get_job, get_supabase, rpc_or_raise

TERMINAL_STATUSES = {"completed", "failed", "cancelled", "expired"}


def provider_configured(source: str) -> bool:
    if source == "pexels":
        return bool(os.getenv("PEXELS_API_KEY"))
    if source == "pixabay":
        return bool(os.getenv("PIXABAY_API_KEY"))
    return False


def configured_video_source(job_input: dict[str, Any] | None = None) -> str:
    job_input = job_input or {}
    requested_source = job_input.get("videoSource")
    local_materials = job_input.get("videoMaterials") or job_input.get("video_materials")

    if requested_source == "local" and local_materials:
        return requested_source

    if requested_source in {"pexels", "pixabay"} and provider_configured(requested_source):
        return requested_source

    explicit_source = os.getenv("MONEYPRINT_VIDEO_SOURCE", "").strip().lower()
    if explicit_source == "local" and local_materials:
        return explicit_source
    if explicit_source in {"pexels", "pixabay"} and provider_configured(explicit_source):
        return explicit_source
    if os.getenv("PEXELS_API_KEY"):
        return "pexels"
    if os.getenv("PIXABAY_API_KEY"):
        return "pixabay"
    return "pexels"


def configure_moneyprinter(config: WorkerConfig, job_input: dict[str, Any] | None = None) -> None:
    example_path = config.moneyprinter_home / "config.example.toml"
    config_path = config.moneyprinter_home / "config.toml"
    root_config = toml.load(example_path)
    app_config = root_config.setdefault("app", {})
    video_source = configured_video_source(job_input)

    app_config["video_source"] = video_source
    app_config["pexels_api_keys"] = [os.getenv("PEXELS_API_KEY", "")] if os.getenv("PEXELS_API_KEY") else []
    app_config["pixabay_api_keys"] = [os.getenv("PIXABAY_API_KEY", "")] if os.getenv("PIXABAY_API_KEY") else []
    app_config["llm_provider"] = os.getenv("MONEYPRINT_LLM_PROVIDER", "openai")
    app_config["openai_api_key"] = os.getenv("OPENAI_API_KEY", "")
    app_config["deepseek_api_key"] = os.getenv("DEEPSEEK_API_KEY", "")
    app_config["gemini_api_key"] = os.getenv("GEMINI_API_KEY", "")
    app_config["subtitle_provider"] = os.getenv("MONEYPRINT_SUBTITLE_PROVIDER", (job_input or {}).get("ttsProvider", "edge"))
    app_config["hide_config"] = True
    app_config["max_concurrent_tasks"] = 1
    app_config["max_queued_tasks"] = 1

    with config_path.open("w", encoding="utf-8") as fp:
        toml.dump(root_config, fp)


def update_progress(job_id: str, status: str, progress: int, message: str, metadata: dict[str, Any] | None = None) -> None:
    rpc_or_raise(
        "update_video_job_progress",
        {
            "p_job_id": job_id,
            "p_status": status,
            "p_progress": progress,
            "p_message": message,
            "p_metadata": metadata or {},
        },
    )


def is_cancelled(job_id: str) -> bool:
    job = get_job(job_id)
    return bool(job and job.get("status") == "cancelled")


def upload_file(bucket: str, user_id: str, job_id: str, local_path: str, suffix: str) -> str:
    path = Path(local_path)
    storage_path = f"users/{user_id}/jobs/{job_id}/{suffix}"
    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"

    with path.open("rb") as fp:
        get_supabase().storage.from_(bucket).upload(
            storage_path,
            fp,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    return storage_path


def build_video_params(job: dict[str, Any]):
    from app.models.schema import VideoParams

    job_input = job.get("input") or {}
    duration = int(job_input.get("durationSeconds") or job.get("duration_seconds") or 30)
    scene_count = int(job_input.get("sceneCount") or (1 if duration <= 30 else 2))

    return VideoParams(
        video_subject=job_input.get("topic") or job["topic"],
        video_script="",
        video_script_prompt=job_input.get("prompt") or job.get("prompt") or "",
        video_aspect=job_input.get("aspectRatio") or job.get("aspect_ratio") or "9:16",
        video_source=configured_video_source(job_input),
        video_materials=job_input.get("videoMaterials") or job_input.get("video_materials"),
        video_language=job_input.get("language") or job.get("language") or "en",
        voice_name=job_input.get("voiceId") or job.get("voice_id") or "en-US-JennyNeural-Female",
        subtitle_enabled=True,
        video_count=int(job.get("variants") or 1),
        video_clip_duration=5,
        paragraph_number=max(1, min(scene_count, 6)),
        bgm_type="none" if (job_input.get("musicStyle") or job.get("music_style") or "none") == "none" else "random",
        n_threads=int(os.getenv("MONEYPRINT_RENDER_THREADS", "2")),
    )


def render_job(job_id: str) -> None:
    config = WorkerConfig.from_env()
    configure_moneyprinter(config)
    sys.path.insert(0, str(config.moneyprinter_home))

    claimed = rpc_or_raise(
        "claim_video_job",
        {"p_job_id": job_id, "p_worker_id": config.worker_id, "p_lock_minutes": config.lock_minutes},
    )

    if not claimed:
        return

    status = claimed.get("status")
    if status in TERMINAL_STATUSES:
        return

    if claimed.get("locked_by") != config.worker_id:
        return

    job_input = claimed.get("input") or {}
    configure_moneyprinter(config, job_input)

    work_dir = tempfile.mkdtemp(prefix=f"video-job-{job_id}-")
    original_cwd = Path.cwd()
    task_storage = config.moneyprinter_home / "storage" / "tasks" / job_id

    try:
        os.chdir(config.moneyprinter_home)
        from app.services import task as money_task

        update_progress(job_id, "generating_script", 8, "Starting MoneyPrinterTurbo generation.")
        params = build_video_params(claimed)

        if is_cancelled(job_id):
            return

        update_progress(job_id, "rendering_video", 35, "MoneyPrinterTurbo is rendering the video.")
        result = money_task.start(job_id, params, stop_at="video")

        if is_cancelled(job_id):
            return

        if not result or not result.get("videos"):
            raise RuntimeError("MoneyPrinterTurbo did not return a final video.")

        update_progress(job_id, "uploading", 92, "Uploading generated artifacts to Supabase Storage.")

        final_video = result["videos"][0]
        output_path = upload_file(config.storage_bucket, claimed["user_id"], job_id, final_video, "final.mp4")

        script_path = None
        subtitle_path = None
        if result.get("script"):
            script_file = Path(work_dir) / "script.txt"
            script_file.write_text(result["script"], encoding="utf-8")
            script_path = upload_file(config.storage_bucket, claimed["user_id"], job_id, str(script_file), "script.txt")

        if result.get("subtitle_path"):
            subtitle_path = upload_file(
                config.storage_bucket,
                claimed["user_id"],
                job_id,
                result["subtitle_path"],
                "subtitles.srt",
            )

        rpc_or_raise(
            "complete_video_job_with_artifacts",
            {
                "p_job_id": job_id,
                "p_output_bucket": config.storage_bucket,
                "p_output_path": output_path,
                "p_output_url": None,
                "p_thumbnail_path": None,
                "p_script_path": script_path,
                "p_subtitles_path": subtitle_path,
                "p_metadata": {
                    "moneyprinter_videos": result.get("videos", []),
                    "combined_videos": result.get("combined_videos", []),
                    "terms": result.get("terms", []),
                },
            },
        )
    except Exception as error:
        traceback.print_exc()
        rpc_or_raise("fail_video_job", {"p_job_id": job_id, "p_error_message": str(error)})
        raise
    finally:
        os.chdir(original_cwd)
        shutil.rmtree(work_dir, ignore_errors=True)
        shutil.rmtree(task_storage, ignore_errors=True)

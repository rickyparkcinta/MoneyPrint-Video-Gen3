from __future__ import annotations

import json
import mimetypes
import os
import sys
import traceback
from pathlib import Path
from typing import Any

import toml
from supabase import create_client

MONEYPRINTER_HOME = Path(os.getenv("MONEYPRINTER_HOME", "/app/moneyprinter")).resolve()
JOB_ID = os.getenv("VIDEO_JOB_ID", "")
JOB_USER_ID = os.getenv("VIDEO_JOB_USER_ID", "")
WORKER_ID = os.getenv("WORKER_ID", "cloud-run-worker")
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "videos")


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def configured_video_source() -> str:
    explicit_source = os.getenv("MONEYPRINT_VIDEO_SOURCE", "").strip().lower()
    if explicit_source in {"pexels", "pixabay", "local"}:
        return explicit_source
    if os.getenv("PEXELS_API_KEY"):
        return "pexels"
    if os.getenv("PIXABAY_API_KEY"):
        return "pixabay"
    return "pexels"


def configure_moneyprinter() -> None:
    example_path = MONEYPRINTER_HOME / "config.example.toml"
    config_path = MONEYPRINTER_HOME / "config.toml"
    config = toml.load(example_path)
    app_config = config.setdefault("app", {})

    pexels_key = os.getenv("PEXELS_API_KEY", "")
    pixabay_key = os.getenv("PIXABAY_API_KEY", "")
    video_source = configured_video_source()

    app_config["video_source"] = video_source
    app_config["pexels_api_keys"] = [pexels_key] if pexels_key else []
    app_config["pixabay_api_keys"] = [pixabay_key] if pixabay_key else []
    app_config["llm_provider"] = os.getenv("MONEYPRINT_LLM_PROVIDER", "openai")
    app_config["openai_api_key"] = os.getenv("OPENAI_API_KEY", "")
    app_config["deepseek_api_key"] = os.getenv("DEEPSEEK_API_KEY", "")
    app_config["gemini_api_key"] = os.getenv("GEMINI_API_KEY", "")
    app_config["subtitle_provider"] = os.getenv("MONEYPRINT_SUBTITLE_PROVIDER", "edge")
    app_config["hide_config"] = True
    app_config["max_concurrent_tasks"] = 1
    app_config["max_queued_tasks"] = 1

    with config_path.open("w", encoding="utf-8") as fp:
        toml.dump(config, fp)


def get_supabase():
    return create_client(required_env("SUPABASE_URL"), required_env("SUPABASE_SERVICE_ROLE_KEY"))


def rpc_or_raise(client, function_name: str, params: dict[str, Any]) -> Any:
    response = client.rpc(function_name, params).execute()
    return response.data


def update_progress(client, status: str, progress: int, message: str, metadata: dict[str, Any] | None = None) -> None:
    rpc_or_raise(
        client,
        "update_video_job_progress",
        {
            "p_job_id": JOB_ID,
            "p_status": status,
            "p_progress": progress,
            "p_message": message,
            "p_metadata": metadata or {},
        },
    )


def upload_file(client, user_id: str, job_id: str, local_path: str, suffix: str) -> str:
    path = Path(local_path)
    storage_path = f"users/{user_id}/jobs/{job_id}/{suffix}"
    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"

    with path.open("rb") as fp:
        client.storage.from_(BUCKET).upload(
            storage_path,
            fp,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    return storage_path


def build_video_params(job: dict[str, Any]):
    from app.models.schema import VideoParams

    duration = int(job.get("duration_seconds") or 30)
    return VideoParams(
        video_subject=job["topic"],
        video_script="",
        video_script_prompt=job.get("prompt") or "",
        video_aspect=job.get("aspect_ratio") or "9:16",
        video_source=configured_video_source(),
        video_language=job.get("language") or "en",
        voice_name=job.get("voice_id") or "en-US-JennyNeural-Female",
        subtitle_enabled=True,
        video_count=int(job.get("variants") or 1),
        video_clip_duration=5,
        paragraph_number=1 if duration <= 30 else 2,
        bgm_type="none" if (job.get("music_style") or "none") == "none" else "random",
        n_threads=int(os.getenv("MONEYPRINT_RENDER_THREADS", "2")),
    )


def main() -> None:
    if not JOB_ID:
        raise RuntimeError("VIDEO_JOB_ID is required.")

    configure_moneyprinter()
    sys.path.insert(0, str(MONEYPRINTER_HOME))
    os.chdir(MONEYPRINTER_HOME)

    client = get_supabase()
    job = rpc_or_raise(
        client,
        "claim_video_job",
        {"p_job_id": JOB_ID, "p_worker_id": WORKER_ID, "p_lock_minutes": 45},
    )

    if JOB_USER_ID and job.get("user_id") != JOB_USER_ID:
        raise RuntimeError("VIDEO_JOB_USER_ID does not match claimed job.")

    if job.get("status") in {"completed", "failed", "cancelled", "expired"}:
        print(json.dumps({"skipped": job.get("status"), "job_id": JOB_ID}))
        return

    try:
        from app.services import task as money_task

        update_progress(client, "generating_script", 8, "Starting MoneyPrinterTurbo generation.")
        params = build_video_params(job)

        update_progress(client, "rendering_video", 35, "MoneyPrinterTurbo is rendering the video.")
        result = money_task.start(JOB_ID, params, stop_at="video")

        if not result or not result.get("videos"):
            raise RuntimeError("MoneyPrinterTurbo did not return a final video.")

        update_progress(client, "uploading", 92, "Uploading generated artifacts to private storage.")

        final_video = result["videos"][0]
        output_path = upload_file(client, job["user_id"], JOB_ID, final_video, "output.mp4")

        script_path = None
        subtitle_path = None
        if result.get("script"):
            script_file = MONEYPRINTER_HOME / "storage" / "tasks" / JOB_ID / "script.txt"
            script_file.parent.mkdir(parents=True, exist_ok=True)
            script_file.write_text(result["script"], encoding="utf-8")
            script_path = upload_file(client, job["user_id"], JOB_ID, str(script_file), "script.txt")

        if result.get("subtitle_path"):
            subtitle_path = upload_file(client, job["user_id"], JOB_ID, result["subtitle_path"], "subtitles.srt")

        rpc_or_raise(
            client,
            "complete_video_job",
            {
                "p_job_id": JOB_ID,
                "p_output_path": output_path,
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

        print(json.dumps({"ok": True, "job_id": JOB_ID, "output_path": output_path}))
    except Exception as error:
        traceback.print_exc()
        rpc_or_raise(
            client,
            "fail_video_job_and_refund",
            {
                "p_job_id": JOB_ID,
                "p_error_code": "worker_failed",
                "p_error_message": str(error),
            },
        )
        raise


if __name__ == "__main__":
    main()

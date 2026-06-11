from __future__ import annotations

import mimetypes
import os
import shutil
import sys
import tempfile
import textwrap
import traceback
from pathlib import Path
from typing import Any

import toml
from moviepy import ImageClip, concatenate_videoclips
from PIL import Image, ImageDraw, ImageFont

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


def llm_provider_configured() -> bool:
    provider = os.getenv("MONEYPRINT_LLM_PROVIDER", "openai").strip().lower()
    if provider == "pollinations":
        return True

    provider_env_keys = {
        "openai": "OPENAI_API_KEY",
        "deepseek": "DEEPSEEK_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "qwen": "QWEN_API_KEY",
        "moonshot": "MOONSHOT_API_KEY",
        "minimax": "MINIMAX_API_KEY",
        "mimo": "MIMO_API_KEY",
        "grok": "GROK_API_KEY",
        "modelscope": "MODELSCOPE_API_KEY",
    }
    env_key = provider_env_keys.get(provider)
    return bool(env_key and os.getenv(env_key))


def should_use_simple_fallback(job_input: dict[str, Any] | None = None) -> bool:
    if os.getenv("MONEYPRINT_SIMPLE_FALLBACK", "1").strip().lower() in {"0", "false", "no"}:
        return False
    if os.getenv("MONEYPRINT_FORCE_SIMPLE_FALLBACK", "").strip().lower() in {"1", "true", "yes"}:
        return True

    job_input = job_input or {}
    local_materials = job_input.get("videoMaterials") or job_input.get("video_materials")
    source = job_input.get("videoSource") or os.getenv("MONEYPRINT_VIDEO_SOURCE", "").strip().lower()
    has_material_source = (
        (source == "local" and bool(local_materials))
        or bool(os.getenv("PEXELS_API_KEY"))
        or bool(os.getenv("PIXABAY_API_KEY"))
    )
    return not llm_provider_configured() or not has_material_source


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


def complete_job_with_artifacts(
    config: WorkerConfig,
    job_id: str,
    claimed: dict[str, Any],
    result: dict[str, Any],
) -> None:
    final_video = result["videos"][0]
    output_path = upload_file(config.storage_bucket, claimed["user_id"], job_id, final_video, "final.mp4")

    script_path = None
    subtitle_path = None
    if result.get("script"):
        script_file = Path(final_video).with_name("script.txt")
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
                "fallback": result.get("fallback", False),
            },
        },
    )


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


def fallback_script(job: dict[str, Any]) -> str:
    job_input = job.get("input") or {}
    topic = str(job_input.get("topic") or job["topic"]).strip()
    prompt = str(job_input.get("prompt") or job.get("prompt") or "").strip()
    lines = [
        f"{topic}.",
        "The strongest teams do not win by sitting in the same room. They win with clear goals, focused work blocks, and written decisions everyone can revisit.",
        "Remote work turns productivity into a system: fewer interruptions, better async communication, and access to talent wherever it lives.",
        "The future belongs to teams that measure outcomes, protect deep work, and design collaboration intentionally.",
    ]
    if prompt:
        lines.append(f"Direction: {prompt}")
    return "\n\n".join(lines)


def fallback_terms(job: dict[str, Any]) -> list[str]:
    topic = str((job.get("input") or {}).get("topic") or job["topic"]).strip()
    return [topic, "remote work", "productivity", "future of work", "focused teams"]


def fallback_resolution(aspect_ratio: str) -> tuple[int, int]:
    if aspect_ratio == "16:9":
        return 854, 480
    if aspect_ratio == "1:1":
        return 720, 720
    return 480, 854


def load_fallback_font(config: WorkerConfig, size: int) -> ImageFont.ImageFont:
    for name in ("STHeitiMedium.ttc", "MicrosoftYaHeiBold.ttc", "UTM Kabel KT.ttf"):
        path = config.moneyprinter_home / "resource" / "fonts" / name
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def wrapped_text(text: str, width: int) -> str:
    return "\n".join(textwrap.wrap(text, width=max(8, width), break_long_words=True)) or text


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    width: int,
    line_spacing: int = 12,
) -> None:
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=line_spacing, align="center")
    text_width = bbox[2] - bbox[0]
    x = xy[0] + max(0, (width - text_width) // 2)
    draw.multiline_text((x, xy[1]), text, font=font, fill=fill, spacing=line_spacing, align="center")


def create_fallback_frame(
    config: WorkerConfig,
    path: Path,
    size: tuple[int, int],
    title: str,
    body: str,
    index: int,
    total: int,
) -> None:
    width, height = size
    image = Image.new("RGB", size, (7, 12, 20))
    draw = ImageDraw.Draw(image)

    for y in range(height):
        ratio = y / max(1, height - 1)
        r = int(5 + 8 * ratio)
        g = int(14 + 38 * ratio)
        b = int(25 + 34 * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    accent = (14, 195, 112)
    draw.rounded_rectangle(
        [int(width * 0.07), int(height * 0.07), int(width * 0.93), int(height * 0.93)],
        radius=28,
        outline=(31, 47, 65),
        width=3,
    )
    draw.rounded_rectangle(
        [int(width * 0.07), int(height * 0.07), int(width * 0.28), int(height * 0.075)],
        radius=6,
        fill=accent,
    )

    brand_size = max(24, width // 34)
    title_size = max(42, width // 12)
    body_size = max(24, width // 27)
    small_size = max(20, width // 38)
    brand_font = load_fallback_font(config, brand_size)
    title_font = load_fallback_font(config, title_size)
    body_font = load_fallback_font(config, body_size)
    small_font = load_fallback_font(config, small_size)

    draw.text((int(width * 0.1), int(height * 0.1)), "MoneyPrint", font=brand_font, fill=accent)
    draw.text(
        (int(width * 0.78), int(height * 0.1)),
        f"{index:02d}/{total:02d}",
        font=small_font,
        fill=(154, 164, 178),
    )

    content_width = int(width * 0.78)
    title_text = wrapped_text(title, max(10, width // 34))
    body_text = wrapped_text(body, max(18, width // 24))
    draw_centered_text(
        draw,
        (int(width * 0.11), int(height * 0.29)),
        title_text,
        title_font,
        (244, 247, 251),
        content_width,
        line_spacing=max(10, title_size // 4),
    )
    draw_centered_text(
        draw,
        (int(width * 0.11), int(height * 0.56)),
        body_text,
        body_font,
        (203, 213, 225),
        content_width,
        line_spacing=max(8, body_size // 3),
    )

    draw.rounded_rectangle(
        [int(width * 0.27), int(height * 0.84), int(width * 0.73), int(height * 0.9)],
        radius=22,
        fill=(9, 28, 31),
        outline=(17, 94, 89),
        width=2,
    )
    draw_centered_text(
        draw,
        (int(width * 0.27), int(height * 0.855)),
        "AI video draft",
        small_font,
        (141, 245, 202),
        int(width * 0.46),
        line_spacing=4,
    )

    image.save(path)


def render_simple_fallback_video(config: WorkerConfig, job_id: str, claimed: dict[str, Any], work_dir: str) -> dict[str, Any]:
    job_input = claimed.get("input") or {}
    aspect_ratio = job_input.get("aspectRatio") or claimed.get("aspect_ratio") or "9:16"
    duration = max(6, min(12, int(job_input.get("durationSeconds") or claimed.get("duration_seconds") or 30)))
    scene_count = max(1, min(6, int(job_input.get("sceneCount") or 3)))
    frame_size = fallback_resolution(aspect_ratio)
    script = fallback_script(claimed)
    terms = fallback_terms(claimed)
    lines = [line.strip() for line in script.splitlines() if line.strip()]

    frame_paths: list[Path] = []
    clips: list[ImageClip] = []
    scene_duration = duration / scene_count
    work_path = Path(work_dir)

    for index in range(scene_count):
        frame_path = work_path / f"fallback-scene-{index + 1}.png"
        body = lines[min(index + 1, len(lines) - 1)] if lines else claimed["topic"]
        create_fallback_frame(
            config,
            frame_path,
            frame_size,
            claimed["topic"],
            body,
            index + 1,
            scene_count,
        )
        frame_paths.append(frame_path)
        clips.append(ImageClip(str(frame_path)).with_duration(scene_duration))

    output_path = work_path / "fallback-final.mp4"
    video = concatenate_videoclips(clips, method="compose")
    try:
        video.write_videofile(
            str(output_path),
            fps=12,
            codec="libx264",
            audio=False,
            threads=max(1, int(os.getenv("MONEYPRINT_RENDER_THREADS", "2"))),
            preset="ultrafast",
            ffmpeg_params=["-pix_fmt", "yuv420p"],
            logger=None,
        )
    finally:
        video.close()
        for clip in clips:
            clip.close()

    return {
        "videos": [str(output_path)],
        "combined_videos": [],
        "script": script,
        "terms": terms,
        "fallback": True,
    }


def build_video_params(job: dict[str, Any]):
    from app.models.schema import VideoParams

    job_input = job.get("input") or {}
    duration = int(job_input.get("durationSeconds") or job.get("duration_seconds") or 30)
    scene_count = int(job_input.get("sceneCount") or (1 if duration <= 30 else 2))
    prompt = job_input.get("prompt") or job.get("prompt") or ""
    max_words = max(35, min(150, int(duration * 2.2)))
    duration_instruction = (
        f"Create a concise voiceover for a {duration}-second short video. "
        f"Use no more than {max_words} words total, split into {max(1, min(scene_count, 6))} short paragraph(s). "
        "Keep sentences brief so text-to-speech audio fits the target duration."
    )
    script_prompt = f"{duration_instruction}\n\nUser direction: {prompt}".strip() if prompt else duration_instruction

    return VideoParams(
        video_subject=job_input.get("topic") or job["topic"],
        video_script="",
        video_script_prompt=script_prompt,
        custom_system_prompt=duration_instruction,
        video_aspect=job_input.get("aspectRatio") or job.get("aspect_ratio") or "9:16",
        video_source=configured_video_source(job_input),
        video_materials=job_input.get("videoMaterials") or job_input.get("video_materials"),
        video_language=job_input.get("language") or job.get("language") or "en",
        voice_name=job_input.get("voiceId") or job.get("voice_id") or "en-US-JennyNeural-Female",
        voice_rate=1.12 if duration <= 30 else 1.0,
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
        update_progress(job_id, "generating_script", 8, "Starting video generation.")

        if should_use_simple_fallback(job_input):
            update_progress(job_id, "rendering_video", 35, "Rendering simple fallback video.")
            result = render_simple_fallback_video(config, job_id, claimed, work_dir)
            update_progress(job_id, "uploading", 92, "Uploading generated artifacts to Supabase Storage.")
            complete_job_with_artifacts(config, job_id, claimed, result)
            return

        from app.services import task as money_task

        params = build_video_params(claimed)

        if is_cancelled(job_id):
            return

        update_progress(job_id, "rendering_video", 35, "MoneyPrinterTurbo is rendering the video.")
        result = money_task.start(job_id, params, stop_at="video")

        if is_cancelled(job_id):
            return

        if not result or not result.get("videos"):
            if should_use_simple_fallback(job_input):
                result = render_simple_fallback_video(config, job_id, claimed, work_dir)
            else:
                raise RuntimeError("MoneyPrinterTurbo did not return a final video.")

        update_progress(job_id, "uploading", 92, "Uploading generated artifacts to Supabase Storage.")
        complete_job_with_artifacts(config, job_id, claimed, result)
    except Exception as error:
        traceback.print_exc()
        rpc_or_raise("fail_video_job", {"p_job_id": job_id, "p_error_message": str(error)})
        raise
    finally:
        os.chdir(original_cwd)
        shutil.rmtree(work_dir, ignore_errors=True)
        shutil.rmtree(task_storage, ignore_errors=True)

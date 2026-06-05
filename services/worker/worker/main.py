from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import os
from contextlib import asynccontextmanager

import jwt
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse

from worker.config import WorkerConfig
from worker.renderer import TERMINAL_STATUSES, render_job
from worker.supabase_client import get_job, insert_job_event, list_claimable_jobs

queue: asyncio.Queue[str] = asyncio.Queue()
queued_ids: set[str] = set()


def qstash_body_hash(body: bytes) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(body).digest()).decode("ascii").rstrip("=")


def verify_qstash_signature(config: WorkerConfig, signature: str | None, body: bytes) -> None:
    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing QStash signature.")

    expected_body_hash = qstash_body_hash(body)
    last_error: Exception | None = None
    expected_url = _expected_qstash_url()

    for key in (config.qstash_current_signing_key, config.qstash_next_signing_key):
        try:
            claims = jwt.decode(
                signature,
                key,
                algorithms=["HS256"],
                issuer="Upstash",
                options={"require": ["iss", "sub", "exp", "nbf", "body"]},
                leeway=30,
            )
            signed_body_hash = str(claims.get("body", "")).rstrip("=")
            if not hmac.compare_digest(signed_body_hash, expected_body_hash):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid QStash body hash.")
            if expected_url and claims.get("sub") != expected_url:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid QStash subject.")
            return
        except HTTPException:
            raise
        except Exception as error:
            last_error = error

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Invalid QStash signature: {last_error}",
    )


def verify_shared_secret(config: WorkerConfig, authorization: str | None) -> None:
    if not config.worker_shared_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Worker auth is not configured.")

    expected = f"Bearer {config.worker_shared_secret}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid worker authorization.")


def verify_request(config: WorkerConfig, request: Request, body: bytes) -> None:
    if config.has_qstash_keys:
        verify_qstash_signature(config, request.headers.get("Upstash-Signature"), body)
        return

    verify_shared_secret(config, request.headers.get("Authorization"))


def _expected_qstash_url() -> str | None:
    configured_url = os.getenv("WORKER_PUBLIC_URL", "").strip().rstrip("/")
    if configured_url:
        return f"{configured_url}/qstash/render"
    return None


async def enqueue_job(job_id: str) -> None:
    if job_id in queued_ids:
        return
    queued_ids.add(job_id)
    await queue.put(job_id)


async def queue_consumer() -> None:
    while True:
        job_id = await queue.get()
        try:
            await asyncio.to_thread(render_job, job_id)
        finally:
            queued_ids.discard(job_id)
            queue.task_done()


async def queue_poller(config: WorkerConfig) -> None:
    while True:
        try:
            jobs = await asyncio.to_thread(list_claimable_jobs, 3, config.stale_lock_minutes)
            for job in jobs:
                await enqueue_job(job["id"])
        except Exception as error:
            print(f"poller error: {error}", flush=True)

        await asyncio.sleep(config.poll_interval_seconds)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    config = WorkerConfig.from_env()
    consumer = asyncio.create_task(queue_consumer())
    poller = asyncio.create_task(queue_poller(config))
    try:
        yield
    finally:
        consumer.cancel()
        poller.cancel()
        await asyncio.gather(consumer, poller, return_exceptions=True)


app = FastAPI(lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict[str, bool]:
    return {"ok": True}


@app.post("/qstash/render")
async def qstash_render(request: Request) -> JSONResponse:
    config = WorkerConfig.from_env()
    raw_body = await request.body()
    verify_request(config, request, raw_body)

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body.")

    job_id = payload.get("job_id")
    if not isinstance(job_id, str) or not job_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing job_id.")

    job = await asyncio.to_thread(get_job, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if job.get("status") in TERMINAL_STATUSES:
        return JSONResponse({"ok": True, "skipped": job.get("status"), "job_id": job_id}, status_code=202)

    await enqueue_job(job_id)
    if job.get("user_id"):
        await asyncio.to_thread(
            insert_job_event,
            job_id,
            job["user_id"],
            "render_accepted",
            "Render worker accepted the job.",
            1,
        )

    return JSONResponse({"accepted": True, "job_id": job_id}, status_code=202)

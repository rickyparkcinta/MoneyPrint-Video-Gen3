from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


@dataclass(frozen=True)
class WorkerConfig:
    supabase_url: str
    supabase_service_role_key: str
    storage_bucket: str
    worker_id: str
    worker_shared_secret: str
    qstash_current_signing_key: str
    qstash_next_signing_key: str
    moneyprinter_home: Path
    poll_interval_seconds: int
    lock_minutes: int
    stale_lock_minutes: int

    @classmethod
    def from_env(cls) -> "WorkerConfig":
        return cls(
            supabase_url=required_env("SUPABASE_URL"),
            supabase_service_role_key=required_env("SUPABASE_SERVICE_ROLE_KEY"),
            storage_bucket=os.getenv("SUPABASE_STORAGE_BUCKET", "videos"),
            worker_id=os.getenv("WORKER_ID", "render-worker"),
            worker_shared_secret=os.getenv("WORKER_SHARED_SECRET", ""),
            qstash_current_signing_key=os.getenv("QSTASH_CURRENT_SIGNING_KEY", ""),
            qstash_next_signing_key=os.getenv("QSTASH_NEXT_SIGNING_KEY", ""),
            moneyprinter_home=Path(os.getenv("MONEYPRINTER_HOME", "/app/moneyprinter")).resolve(),
            poll_interval_seconds=max(5, int(os.getenv("WORKER_POLL_INTERVAL_SECONDS", "15"))),
            lock_minutes=max(5, int(os.getenv("WORKER_LOCK_MINUTES", "45"))),
            stale_lock_minutes=max(10, int(os.getenv("WORKER_STALE_LOCK_MINUTES", "60"))),
        )

    @property
    def has_qstash_keys(self) -> bool:
        return bool(self.qstash_current_signing_key and self.qstash_next_signing_key)

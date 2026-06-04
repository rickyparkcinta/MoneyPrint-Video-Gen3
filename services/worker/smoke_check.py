from __future__ import annotations

import os
import sys
from pathlib import Path


def main() -> None:
    moneyprinter_home = Path(
        os.getenv("MONEYPRINTER_HOME", Path(__file__).resolve().parent / "moneyprinter")
    ).resolve()
    config_path = moneyprinter_home / "config.toml"
    created_config = not config_path.exists()

    sys.path.insert(0, str(moneyprinter_home))

    from app.models.schema import VideoParams
    from app.services import task

    if not hasattr(task, "start"):
        raise RuntimeError("app.services.task.start is missing")

    VideoParams(video_subject="smoke check")

    if created_config and config_path.exists():
        config_path.unlink()

    print("OK")


if __name__ == "__main__":
    main()

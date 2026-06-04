# MoneyPrint Video Gen3

MoneyPrint is the SaaS wrapper around a vendored copy of MoneyPrinterTurbo. The Next.js app lives in `apps/web`, shared package code lives in `packages/shared`, and the Cloud Run worker wrapper lives in `services/worker`.

## Vendored MoneyPrinterTurbo

MoneyPrinterTurbo is vendored under `services/worker/moneyprinter` from https://github.com/harry0703/MoneyPrinterTurbo. The vendored tree includes the upstream `app/`, `webui/`, `docs/`, `resource/`, Docker files, lockfiles, README files, scripts, and license so the worker build is reproducible without depending on a live upstream checkout.

MoneyPrint production code calls the vendored project through `services/worker/worker.py`:

```python
from app.services import task as money_task

result = money_task.start(JOB_ID, params, stop_at="video")
```

The original upstream WebUI and API remain available in the repository for local MoneyPrinterTurbo testing only. They are not exposed in production.

Production flow:

```text
Next.js -> QStash -> Cloud Run Job -> services/worker/worker.py -> MoneyPrinterTurbo
```

Upstream sync metadata and future update steps are tracked in `services/worker/moneyprinter/UPSTREAM.md`.

## Worker Build Notes

Local worker image build:

```sh
docker build -f services/worker/Dockerfile -t moneyprint-worker:local .
```

Cloud Run Job image build and push:

```sh
docker build -f services/worker/Dockerfile \
  -t REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/moneyprint-worker:latest .
docker push REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/moneyprint-worker:latest
```

Use the pushed image as the Cloud Run Job container image. For Google Cloud Build, use a build config whose build step runs the same `docker build -f services/worker/Dockerfile ... .` command.

Minimum worker runtime environment:

- `VIDEO_JOB_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` defaults to `videos` if omitted
- At least one material provider key: `PEXELS_API_KEY` or `PIXABAY_API_KEY`
- At least one script generation provider key for the configured provider, for example `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, or `GEMINI_API_KEY`

Optional worker environment:

- `VIDEO_JOB_USER_ID`
- `WORKER_ID`
- `MONEYPRINT_VIDEO_SOURCE`
- `MONEYPRINT_LLM_PROVIDER`
- `MONEYPRINT_SUBTITLE_PROVIDER`
- `MONEYPRINT_RENDER_THREADS`

Do not commit `services/worker/moneyprinter/config.toml`, generated storage outputs, generated videos/audio, or API keys.

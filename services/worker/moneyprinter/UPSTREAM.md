# MoneyPrinterTurbo Upstream Tracking

- Upstream repo URL: https://github.com/harry0703/MoneyPrinterTurbo
- Upstream branch/tag used: `main`
- Upstream commit SHA: `423d87c5d0eb67ae315588e701fecffc86fad943`
- Sync date: `2026-06-04`

## Local Modifications For MoneyPrint

This directory is intended to remain a reproducible vendored copy of upstream MoneyPrinterTurbo.
MoneyPrint-specific production integration lives outside the vendored tree:

- `services/worker/worker/renderer.py` configures MoneyPrinterTurbo from Render worker environment variables, builds `app.models.schema.VideoParams`, and calls `app.services.task.start(..., stop_at="video")`.
- `services/worker/Dockerfile` installs MoneyPrinterTurbo dependencies, installs the MoneyPrint worker dependencies, copies the full vendored tree, and runs `uvicorn worker.main:app`.
- `services/worker/smoke_check.py` verifies the expected import surface.
- The upstream Streamlit WebUI and API remain vendored for local testing only; production does not expose them.
- `services/worker/moneyprinter/.gitignore` has a narrow exception so upstream's tracked `webui/.streamlit/config.toml` remains part of the vendored copy.
- The only MoneyPrint tracking file intentionally added inside this vendored directory is this `UPSTREAM.md` file.

## Future Sync Process

From the repository root:

```sh
rm -rf /tmp/MoneyPrinterTurbo-upstream
git clone --depth 1 https://github.com/harry0703/MoneyPrinterTurbo.git /tmp/MoneyPrinterTurbo-upstream
git -C /tmp/MoneyPrinterTurbo-upstream rev-parse HEAD
rsync -a --delete --exclude '.git/' --exclude '/config.toml' --exclude '/storage/' /tmp/MoneyPrinterTurbo-upstream/ services/worker/moneyprinter/
```

After syncing:

1. Restore or update this `services/worker/moneyprinter/UPSTREAM.md` file with the new branch/tag, commit SHA, and sync date.
2. Run `python3 services/worker/smoke_check.py` in an environment with `services/worker/moneyprinter/requirements.txt` installed.
3. Confirm `app.services.task.start` and `app.models.schema.VideoParams` still exist.
4. Confirm `services/worker/worker/renderer.py` still maps MoneyPrint job fields to valid `VideoParams` fields.
5. Build the worker image with `docker build -f services/worker/Dockerfile -t moneyprint-worker:local .`.

Do not commit `services/worker/moneyprinter/config.toml`, storage outputs, generated videos/audio, or API keys.

import importlib.util
from pathlib import Path

moneyprinter_home = Path(__file__).resolve().parents[1] / "moneyprinter"

required_files = [
    moneyprinter_home / "app" / "services" / "task.py",
    moneyprinter_home / "app" / "models" / "schema.py",
    moneyprinter_home / "config.example.toml",
]

missing = [str(path) for path in required_files if not path.exists()]
if missing:
    raise SystemExit(f"Missing MoneyPrinterTurbo files: {missing}")

if importlib.util.find_spec("supabase") is None:
    raise SystemExit("supabase python package is not installed")

print("worker scaffold ok")

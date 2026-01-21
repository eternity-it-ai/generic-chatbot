"""Main entry point for the backend."""
import sys
import os
import json

# Add parent directory to path so we can import backend modules
# This is needed when running as a script
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_backend_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from backend.commands import handle


def _reply(ok: bool, result=None, error: str | None = None):
    """Send a reply to stdout."""
    out = {"ok": ok}
    if ok:
        out["result"] = result
    else:
        out["error"] = error or "unknown error"
    # Use ensure_ascii=False to preserve Hebrew/Unicode characters in JSON
    sys.stdout.write(json.dumps(out, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main():
    """Main loop for processing commands."""
    print("Backend started", file=sys.stderr, flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            result = handle(msg)
            _reply(True, result=result)
        except Exception as e:
            import traceback
            error_msg = str(e)
            traceback_str = traceback.format_exc()
            print(f"Backend error: {error_msg}\n{traceback_str}", file=sys.stderr, flush=True)
            _reply(False, error=error_msg)


if __name__ == "__main__":
    main()

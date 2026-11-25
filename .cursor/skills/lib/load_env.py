"""Load the workspace-root .env into os.environ.

Skill scripts source load-env.sh. Python scripts call load_workspace_env().
When .env exists, every KEY=VALUE in it replaces the current environment,
including a blank value. When .env is missing, the current environment is left
as it is.
"""

import os
import re
from pathlib import Path

MISSING_MESSAGE = (
    "Error: ATLASSIAN_USER and ATLASSIAN_TOKEN must be set in .env at the workspace root.\n"
    "Copy .env.example to .env and fill in both values."
)

_KEY = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def workspace_root():
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / ".cursor" / "skills").is_dir() and (parent / ".env.example").is_file():
            return parent
    return None


def parse_env(text):
    pairs = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not _KEY.match(key):
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        pairs.append((key, value))
    return pairs


def load_workspace_env():
    root = workspace_root()
    if root is None:
        return
    env_file = root / ".env"
    if not env_file.is_file():
        return
    for key, value in parse_env(env_file.read_text(encoding="utf-8")):
        os.environ[key] = value


def require_atlassian_env():
    load_workspace_env()
    user = os.environ.get("ATLASSIAN_USER", "")
    token = os.environ.get("ATLASSIAN_TOKEN", "")
    if not user or not token:
        raise SystemExit(MISSING_MESSAGE)
    return user, token

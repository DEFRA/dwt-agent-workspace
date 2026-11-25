#!/usr/bin/env python3
"""Read the release stages and current stage on a Jira fix version."""

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

_SKILLS_LIB = Path(__file__).resolve().parents[2] / "lib"
if str(_SKILLS_LIB) not in sys.path:
    sys.path.insert(0, str(_SKILLS_LIB))
from load_env import load_workspace_env

load_workspace_env()


def load_sections():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "release-sections.py")
    spec = importlib.util.spec_from_file_location("release_sections", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_stages(sections, base_url, ari):
    data = sections.graphql(base_url, "ReadStages", """
      query ReadStages($id: ID!) {
        jira {
          versionById(id: $id) {
            stageInfo @optIn(to: "JiraVersionStageInfoByIds") {
              stages
              currentStage
            }
          }
        }
      }
    """, {"id": ari})
    return (data["jira"]["versionById"].get("stageInfo") or {})


def main():
    parser = argparse.ArgumentParser(description="Read Jira release stages")
    parser.add_argument("--version-id", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    sections = load_sections()
    base_url = os.environ.get("ATLASSIAN_BASE_URL", "https://eaflood.atlassian.net")
    version = sections.request_json("GET", f"{base_url}/rest/api/2/version/{args.version_id}")
    if version.get("errorMessages"):
        raise SystemExit(f"Error: {'; '.join(version['errorMessages'])}")

    project = sections.request_json("GET", f"{base_url}/rest/api/2/project/{version['projectId']}")
    tenant = sections.request_json("GET", f"{base_url}/_edge/tenant_info")
    ari = sections.version_ari(
        base_url,
        tenant["cloudId"],
        project["key"],
        args.version_id,
        version["name"],
    )
    info = read_stages(sections, base_url, ari)
    stages = info.get("stages") or []
    current = info.get("currentStage")

    payload = {
        "versionId": str(args.version_id),
        "versionName": version["name"],
        "projectKey": project["key"],
        "currentStage": current,
        "stages": stages,
    }

    os.makedirs(args.output_dir, exist_ok=True)
    json_path = os.path.join(args.output_dir, "stages.json")
    text_path = os.path.join(args.output_dir, "stages.txt")
    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")

    stage_line = ", ".join(stages) if stages else "Not set"
    lines = [
        "=== Release stages ===",
        f"Version: {version['name']} ({args.version_id})",
        f"Current stage: {current or 'Not set'}",
        f"Stages: {stage_line}",
        "",
    ]
    with open(text_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))

    print(f"Saved: {text_path}")
    print(f"Saved: {json_path}")
    print(f"Current stage: {current or 'Not set'}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

#!/usr/bin/env python3
"""Set the release stages on an existing Jira fix version.

Planned is always first. Released is always last. Custom stages go between them.
"""

import argparse
import importlib.util
import os
import sys
from pathlib import Path

_SKILLS_LIB = Path(__file__).resolve().parents[2] / "lib"
if str(_SKILLS_LIB) not in sys.path:
    sys.path.insert(0, str(_SKILLS_LIB))
from load_env import load_workspace_env

load_workspace_env()


def load_jira():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(script_dir, "write-release-notes.py")
    spec = importlib.util.spec_from_file_location("write_release_notes", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_stages(value):
    stages = [part.strip() for part in value.split(",") if part.strip()]
    if not stages:
        raise SystemExit("Error: release stages are empty")
    if stages[0] != "Planned" or stages[-1] != "Released":
        raise SystemExit(
            "Error: release stages must start with Planned and end with Released. "
            "Put custom stages between them. Released stays the last stage."
        )
    if len(stages) != len(dict.fromkeys(stages)):
        raise SystemExit("Error: release stages must be unique")
    return stages


def read_stage(jira, base_url, ari):
    data = jira.graphql(base_url, "ReadStages", """
      query ReadStages($id: ID!) {
        jira {
          versionById(id: $id) {
            stageInfo @optIn(to: "JiraVersionStageInfoByIds") {
              stages
              currentStage
            }
            driverData @optIn(to: "JiraVersionDriverResult") {
              driver { accountId }
            }
          }
        }
      }
    """, {"id": ari})
    version = data["jira"]["versionById"]
    stage = version.get("stageInfo") or {}
    driver = ((version.get("driverData") or {}).get("driver") or {}).get("accountId")
    return stage.get("currentStage"), driver


def move_stage(jira, base_url, ari, stage):
    data = jira.graphql(base_url, "MoveStage", """
      mutation MoveStage($input: JiraUpdateVersionCurrentStageInput!) {
        jira {
          updateJiraVersionCurrentStage(input: $input)
            @optIn(to: "JiraVersionUpdateCurrentStage") {
            success
            errors { message }
          }
        }
      }
    """, {"input": {"id": ari, "currentStage": stage}})
    result = data["jira"]["updateJiraVersionCurrentStage"]
    if not result["success"] or result["errors"]:
        messages = "; ".join(error["message"] for error in result["errors"]) or "move failed"
        raise SystemExit(f"Error: {messages}")


def write_stages(jira, base_url, ari, version, stages, driver):
    payload = {
        "id": ari,
        "name": version["name"],
        "description": version.get("description") or "",
        "stages": stages,
        "approvalsRequired": False,
    }
    if version.get("startDate"):
        payload["startDate"] = f"{version['startDate']}T00:00:00.000Z"
    if version.get("releaseDate"):
        payload["releaseDate"] = f"{version['releaseDate']}T00:00:00.000Z"
    if driver:
        payload["driver"] = driver

    data = jira.graphql(base_url, "SetStages", """
      mutation SetStages($input: JiraVersionUpdateMutationInput!) {
        jira {
          updateJiraVersion(input: $input) @optIn(to: "JiraUpdateVersion") {
            success
            errors { message }
            version {
              stageInfo @optIn(to: "JiraVersionStageInfoByIds") {
                stages
                currentStage
              }
            }
          }
        }
      }
    """, {"input": payload})
    result = data["jira"]["updateJiraVersion"]
    if not result["success"] or result["errors"]:
        messages = "; ".join(error["message"] for error in result["errors"]) or "update failed"
        raise SystemExit(f"Error: {messages}")
    return result["version"]["stageInfo"]


def main():
    parser = argparse.ArgumentParser(description="Set Jira release stages")
    parser.add_argument("--project", required=True)
    parser.add_argument("--version-id", required=True)
    parser.add_argument("--stages", required=True, help="Comma-separated stages, Planned first and Released last")
    args = parser.parse_args()

    stages = parse_stages(args.stages)
    jira = load_jira()
    base_url = os.environ.get("ATLASSIAN_BASE_URL", "https://eaflood.atlassian.net")
    version = jira.request_json("GET", f"{base_url}/rest/api/2/version/{args.version_id}")
    if version.get("errorMessages"):
        raise SystemExit(f"Error: {'; '.join(version['errorMessages'])}")

    tenant = jira.request_json("GET", f"{base_url}/_edge/tenant_info")
    ari = jira.version_ari(
        base_url,
        tenant["cloudId"],
        args.project,
        args.version_id,
        version["name"],
    )
    current, driver = read_stage(jira, base_url, ari)
    if current and current not in stages:
        if "Planned" not in stages:
            raise SystemExit(f"Error: cannot remove the current stage {current}")
        move_stage(jira, base_url, ari, "Planned")

    info = write_stages(jira, base_url, ari, version, stages, driver)
    if current in stages and info["currentStage"] != current:
        move_stage(jira, base_url, ari, current)
        info["currentStage"] = current
    print(f"Release stages: {', '.join(info['stages'])}")
    print(f"Current stage: {info['currentStage']}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

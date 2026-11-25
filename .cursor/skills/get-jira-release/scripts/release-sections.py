#!/usr/bin/env python3
"""Read the custom rich text section on a Jira fix version.

Jira exposes one rich text section per version. Its title is chosen on the
release page (for these teams, "Release Notes"). The REST version description
does not include it.
"""

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

_SKILLS_LIB = Path(__file__).resolve().parents[2] / "lib"
if str(_SKILLS_LIB) not in sys.path:
    sys.path.insert(0, str(_SKILLS_LIB))
from load_env import load_workspace_env, require_atlassian_env

load_workspace_env()


def auth_header():
    user, token = require_atlassian_env()
    encoded = base64.b64encode(f"{user}:{token}".encode()).decode()
    return f"Basic {encoded}"


def request_json(method, url, body=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Authorization": auth_header(), "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=40) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise SystemExit(f"Error: {method} {url} failed ({error.code}): {detail[:500]}")


def graphql(base_url, operation, query, variables):
    result = request_json("POST", f"{base_url}/gateway/api/graphql", {
        "operationName": operation,
        "query": query,
        "variables": variables,
    })
    if result.get("errors"):
        messages = "; ".join(error.get("message", "unknown error") for error in result["errors"])
        raise SystemExit(f"Error: {messages}")
    return result["data"]


def version_ari(base_url, cloud_id, project_key, version_id, version_name):
    data = graphql(base_url, "FindVersion", """
      query FindVersion($cloudId: ID!, $key: String!, $search: String!) {
        jira_versionsForProjectByKey(
          cloudId: $cloudId
          projectKey: $key
          searchString: $search
          first: 20
        ) @optIn(to: "JiraVersionsForProjectByKey") {
          edges { node { id versionId } }
        }
      }
    """, {"cloudId": cloud_id, "key": project_key, "search": version_name})
    for edge in data["jira_versionsForProjectByKey"]["edges"] or []:
        node = edge["node"]
        if node["versionId"] == str(version_id):
            return node["id"]
    raise SystemExit(
        f"Error: could not find version {version_id} ({version_name}) in {project_key}"
    )


def read_section(base_url, ari):
    data = graphql(base_url, "ReadSection", """
      query ReadSection($id: ID!) {
        jira {
          versionById(id: $id) {
            richTextSection @optIn(to: "JiraVersionRichTextSection") {
              title
              content {
                json
                convertedPlainText { plainText }
              }
            }
          }
        }
      }
    """, {"id": ari})
    return data["jira"]["versionById"]["richTextSection"]


def main():
    parser = argparse.ArgumentParser(description="Read Jira release custom sections")
    parser.add_argument("--version-id", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    base_url = os.environ.get("ATLASSIAN_BASE_URL", "https://eaflood.atlassian.net")
    version = request_json("GET", f"{base_url}/rest/api/2/version/{args.version_id}")
    if version.get("errorMessages"):
        raise SystemExit(f"Error: {'; '.join(version['errorMessages'])}")

    project = request_json("GET", f"{base_url}/rest/api/2/project/{version['projectId']}")
    tenant = request_json("GET", f"{base_url}/_edge/tenant_info")
    ari = version_ari(
        base_url,
        tenant["cloudId"],
        project["key"],
        args.version_id,
        version["name"],
    )
    section = read_section(base_url, ari) or {}
    title = (section.get("title") or "").strip()
    content = section.get("content") or {}
    plain = ((content.get("convertedPlainText") or {}).get("plainText") or "").strip()
    adf = content.get("json")

    sections = []
    if title or plain:
        sections.append({
            "title": title or None,
            "plainText": plain,
            "adf": adf,
        })

    payload = {
        "versionId": str(args.version_id),
        "versionName": version["name"],
        "projectKey": project["key"],
        "sections": sections,
    }

    os.makedirs(args.output_dir, exist_ok=True)
    json_path = os.path.join(args.output_dir, "sections.json")
    text_path = os.path.join(args.output_dir, "sections.txt")
    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")

    lines = [
        "=== Custom sections ===",
        f"Version: {version['name']} ({args.version_id})",
        f"Count: {len(sections)}",
        "",
    ]
    if not sections:
        lines.append("No custom sections.")
    for item in sections:
        lines.append(f"=== {item['title'] or '(untitled)'} ===")
        lines.append(item["plainText"] or "(empty)")
        lines.append("")
    with open(text_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines).rstrip() + "\n")

    print(f"Saved: {text_path}")
    print(f"Saved: {json_path}")
    print(f"Custom sections: {len(sections)}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

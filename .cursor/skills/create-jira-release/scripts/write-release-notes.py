#!/usr/bin/env python3
"""Write a markdown release note into the Jira Release Notes section.

The section is the rich text block on the fix version, not the description field.
The section title is always "Release Notes".
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
import base64
from pathlib import Path

_SKILLS_LIB = Path(__file__).resolve().parents[2] / "lib"
if str(_SKILLS_LIB) not in sys.path:
    sys.path.insert(0, str(_SKILLS_LIB))
from load_env import load_workspace_env, require_atlassian_env

load_workspace_env()

SECTION_TITLE = "Release Notes"
INLINE = re.compile(r"\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)")


def inline_nodes(text):
    nodes = []
    position = 0
    for match in INLINE.finditer(text):
        if match.start() > position:
            nodes.append({"type": "text", "text": text[position:match.start()]})
        if match.group(1) is not None:
            nodes.append({
                "type": "text",
                "text": match.group(1),
                "marks": [{"type": "strong"}],
            })
        else:
            nodes.append({
                "type": "text",
                "text": match.group(2),
                "marks": [{"type": "link", "attrs": {"href": match.group(3)}}],
            })
        position = match.end()
    if position < len(text):
        nodes.append({"type": "text", "text": text[position:]})
    return nodes


def paragraph(text):
    nodes = inline_nodes(text)
    if not nodes:
        return {"type": "paragraph", "content": []}
    return {"type": "paragraph", "content": nodes}


def markdown_to_adf(markdown):
    content = []
    paragraph_lines = []
    bullet_items = []

    def flush_paragraph():
        nonlocal paragraph_lines
        text = " ".join(line.strip() for line in paragraph_lines).strip()
        paragraph_lines = []
        if text:
            content.append(paragraph(text))

    def flush_bullets():
        nonlocal bullet_items
        if not bullet_items:
            return
        content.append({
            "type": "bulletList",
            "content": [
                {"type": "listItem", "content": [paragraph(item)]}
                for item in bullet_items
            ],
        })
        bullet_items = []

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            flush_paragraph()
            flush_bullets()
            continue

        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading:
            flush_paragraph()
            flush_bullets()
            content.append({
                "type": "heading",
                "attrs": {"level": len(heading.group(1))},
                "content": inline_nodes(heading.group(2).strip()),
            })
            continue

        bullet = re.match(r"^[-*+]\s+(.*)$", line)
        if bullet:
            flush_paragraph()
            bullet_items.append(bullet.group(1).strip())
            continue

        flush_bullets()
        paragraph_lines.append(line)

    flush_paragraph()
    flush_bullets()
    if not content:
        raise SystemExit("Error: release notes file is empty")
    return {"version": 1, "type": "doc", "content": content}


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
          edges { node { id versionId name } }
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


def write_section(base_url, ari, adf):
    data = graphql(base_url, "WriteReleaseNotes", """
      mutation WriteReleaseNotes(
        $title: JiraUpdateVersionRichTextSectionTitleInput!
        $content: JiraUpdateVersionRichTextSectionContentInput!
      ) {
        jira {
          updateJiraVersionRichTextSectionTitle(input: $title)
            @optIn(to: "JiraUpdateVersionRichTextSectionTitle") {
            success
            errors { message }
          }
          updateJiraVersionRichTextSectionContent(input: $content)
            @optIn(to: "JiraUpdateVersionRichTextSectionContent") {
            success
            errors { message }
            version {
              richTextSection @optIn(to: "JiraVersionRichTextSection") {
                title
                content { convertedPlainText { plainText } }
              }
            }
          }
        }
      }
    """, {
        "title": {"id": ari, "title": SECTION_TITLE},
        "content": {"id": ari, "content": adf},
    })
    jira = data["jira"]
    for key in ("updateJiraVersionRichTextSectionTitle", "updateJiraVersionRichTextSectionContent"):
        result = jira[key]
        if not result["success"] or result["errors"]:
            messages = "; ".join(error["message"] for error in result["errors"]) or "update failed"
            raise SystemExit(f"Error: {key}: {messages}")
    return jira["updateJiraVersionRichTextSectionContent"]["version"]["richTextSection"]


def main():
    parser = argparse.ArgumentParser(description="Write the Jira Release Notes section")
    parser.add_argument("--project", required=True)
    parser.add_argument("--version-id", required=True)
    parser.add_argument("--version-name", required=True)
    parser.add_argument("--notes-file", required=True)
    args = parser.parse_args()

    with open(args.notes_file, encoding="utf-8") as handle:
        markdown = handle.read()
    adf = markdown_to_adf(markdown)

    base_url = os.environ.get("ATLASSIAN_BASE_URL", "https://eaflood.atlassian.net")
    tenant = request_json("GET", f"{base_url}/_edge/tenant_info")
    cloud_id = tenant["cloudId"]
    ari = version_ari(base_url, cloud_id, args.project, args.version_id, args.version_name)
    section = write_section(base_url, ari, adf)
    print(f"Release Notes section updated on {args.version_name}")
    print(f"Title: {section['title']}")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)

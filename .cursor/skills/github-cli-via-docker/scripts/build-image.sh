#!/bin/bash
# Build the local dwt-gh image from the official GitHub CLI release.
# No-op when the image already exists. Pass --force to rebuild.

set -euo pipefail

if docker image inspect dwt-gh >/dev/null 2>&1 && [[ "${1:-}" != "--force" ]]; then
  echo "dwt-gh already exists"
  exit 0
fi

case "$(uname -m)" in
  x86_64) arch=amd64 ;;
  aarch64 | arm64) arch=arm64 ;;
  *)
    echo "unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

version=$(curl -fsSL \
  -H "Accept: application/vnd.github+json" \
  -H "User-Agent: dwt-agent" \
  https://api.github.com/repos/cli/cli/releases/latest \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"].lstrip("v"))')

docker build -t dwt-gh - <<EOF
FROM debian:bookworm-slim
RUN apt-get update \\
  && apt-get install -y --no-install-recommends ca-certificates curl tar \\
  && curl -fsSL -o /tmp/gh.tgz "https://github.com/cli/cli/releases/download/v${version}/gh_${version}_linux_${arch}.tar.gz" \\
  && tar -xzf /tmp/gh.tgz -C /tmp \\
  && mv /tmp/gh_${version}_linux_${arch}/bin/gh /usr/local/bin/gh \\
  && chmod 755 /usr/local/bin/gh \\
  && rm -rf /var/lib/apt/lists/* /tmp/gh.tgz /tmp/gh_${version}_linux_${arch}
ENTRYPOINT ["gh"]
EOF

docker run --rm dwt-gh version

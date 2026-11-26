FROM debian:bookworm-slim

ARG GH_VERSION=2.105.0
ARG TARGETARCH

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl tar \
  && curl -fsSL -o /tmp/gh.tgz "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${TARGETARCH}.tar.gz" \
  && tar -xzf /tmp/gh.tgz -C /tmp \
  && mv /tmp/gh_${GH_VERSION}_linux_${TARGETARCH}/bin/gh /usr/local/bin/gh \
  && chmod 755 /usr/local/bin/gh \
  && rm -rf /var/lib/apt/lists/* /tmp/gh.tgz /tmp/gh_${GH_VERSION}_linux_${TARGETARCH}

ENTRYPOINT ["gh"]

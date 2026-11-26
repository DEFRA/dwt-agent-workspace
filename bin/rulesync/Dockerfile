FROM node:22.23.4-bookworm-slim

ARG RULESYNC_VERSION=43.15.0

RUN npm install -g "rulesync@${RULESYNC_VERSION}" \
  && npm cache clean --force

ENTRYPOINT ["rulesync"]

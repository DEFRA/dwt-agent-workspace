---
root: false
targets:
  - '*'
description: After a push, put each pull request link in the chat
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: After a push, put each pull request link in the chat
  globs: []
---
# Pull request links

After a push, put every pull request link from that push in the chat. Include the create-pull-request URL from git, and the pull request URL from GitHub or `gh`.

One link per repository. List each link when several branches were pushed.

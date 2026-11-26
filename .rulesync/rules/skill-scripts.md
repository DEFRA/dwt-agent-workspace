---
root: false
targets:
  - '*'
description: Skills use JavaScript, Bash, or Docker
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Skills use JavaScript, Bash, or Docker
  globs: []
---
# Skill scripts

JavaScript, Bash, and Docker are the approved tools for a skill.

Use JavaScript for complex work and for API requests. Those scripts are vanilla JavaScript in `.rulesync/skills/`. Edit them there. Generate copies them to `.cursor/skills/` and `.claude/skills/`. Those copies are gitignored. They use ESM and JSDoc. Node is 22.23.4, the version `waste-movement-backend` uses. A newer Node 22 can run them. Scripts use Node built-ins only. There is no install step.

`.rulesync/skills/lib/package.json` sets `"type": "module"`. Each other JavaScript skill links its `package.json` to that file. Generate copies the file into the skill so Node finds it next to the scripts. Run a script with `node` from either generated tree.

```bash
node .cursor/skills/<skill>/scripts/<script>.js
node .claude/skills/<skill>/scripts/<script>.js
```

Use Bash for a simple command sequence.

Use a Dockerfile or a Compose file to run a program a person may want to leave uninstalled. A person can have that program installed. A skill can still run it in Docker.

A skill calls a program by its command name. Use the installed command. When that command is missing, run the program with its Docker skill. `gh` uses the github-cli-via-docker skill. That skill's `bin/gh` is `.rulesync/skills/github-cli-via-docker/bin/gh`. Put that `bin` directory on `PATH` before a script that calls `gh`. `rulesync` is `bin/rulesync/rulesync`. Pass `--command` and `--tool`. The rulesync rule says the values. A shell alias is not visible inside a script. Do not write the Docker command into another skill's script.

When that program reads or writes files in the workspace, mount the current directory and set the working directory there. The shell expands `$PWD`.

```bash
docker run --rm -v "$PWD:$PWD" -w "$PWD" <image> <command>
```

A Compose service uses the same mount:

```yaml
volumes:
  - ${PWD}:${PWD}
working_dir: ${PWD}
```

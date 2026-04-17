# jansible

[![Node.js >=14](https://img.shields.io/badge/node-%3E%3D14-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![SSH](https://img.shields.io/badge/transport-SSH-4B32C3)](#how-it-works)

`jansible` is a tiny CLI for running the same command across multiple hosts.

Despite the name, it is **not** a replacement for Ansible. It does **not** provide idempotency, state management, playbooks, or convergence. It is only meant for simple batch command execution over SSH.

## What it does

- reads a host list from `config.json`
- runs the same command on all hosts over `ssh`
- executes hosts in parallel
- prints each host result as soon as it finishes
- can save combined output to a file

## What it does not do

`jansible` is intentionally small. It does **not** handle:

- idempotent deployment
- drift detection
- rollback
- inventory orchestration
- role / playbook workflows

If you need those features, use Ansible instead.

## Why use it

Use `jansible` when you just want a lightweight tool to run one command on several machines, especially for:

- quick inspection
- read-only checks
- small maintenance tasks
- temporary ad-hoc operations

## Node.js compatibility

`jansible` is built with a relatively low target and is intended to work with older Node.js versions.


## Usage

**`-o` must be ahead of `-e`**

**All things after `-e` is handled as a command**

```bash
jansible -e "uptime"
jansible -e "systemctl status nginx"
jansible -o result.txt -e "df -h"
```

## Options

- `-e, --exec`: command to execute
- `-o, --output`: write output to a file
- `-h, --help`: show help
- `-v, --version`: show version

## Configuration

Create a `config.json` file:

```json
{
  "hosts": [
    {
      "ip": "192.168.1.10",
      "user": "root",
      "port": "22"
    },
    {
      "ip": "192.168.1.11"
    }
  ],
  "common": {
    "user": "root",
    "port": "22"
  }
}
```

### Fields

- `ip`: host address
- `user`: SSH username
- `port`: SSH port
- `password`: reserved field; currently not injected into the `ssh` command automatically

### Merge behavior

- each item in `hosts` is one target machine
- `common` provides default values
- host-level values override `common`

## How it works

`jansible` is basically a thin wrapper around the system `ssh` command.

That means:

1. it depends on `ssh` being available on your machine
2. it does not inspect remote state before running commands
3. repeated runs may produce different results
4. command safety and repeatability are your responsibility

## Example

```bash
jansible -o report.txt -e "systemctl status nginx"
```

This runs the same command on every configured host and writes the collected output to `report.txt`.

## License

MIT. See [LICENSE](./LICENSE).

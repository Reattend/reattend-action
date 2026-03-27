# Save to Reattend — GitHub Action

Automatically save PRs, commits, releases, and issues to your [Reattend](https://reattend.com) memory. Ask questions about your codebase history from Claude, Cursor, or any AI tool.

```yaml
- uses: Reattend/reattend-action@v1
  with:
    token: ${{ secrets.REATTEND_TOKEN }}
```

That's it. Every PR, push, and release in your repo gets saved to memory automatically.

---

## What gets captured

| Event | What's saved |
|---|---|
| `pull_request` | PR title, description, branch names, author, action (opened/merged/closed) |
| `push` | Commit messages, branch, author |
| `release` | Tag name, release title, release notes |
| `issues` | Issue title, description, author, action |
| `issue_comment` | Comment body, linked issue title |
| `workflow_dispatch` | Workflow name, inputs, actor |

---

## Setup

### 1. Add your Reattend token as a secret

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

Name: `REATTEND_TOKEN`
Value: your token from [reattend.com/app/settings](https://reattend.com/app/settings)

### 2. Add to your workflow

**Save every PR:**
```yaml
name: Save PR to Reattend
on:
  pull_request:
    types: [opened, closed]

jobs:
  save:
    runs-on: ubuntu-latest
    steps:
      - uses: Reattend/reattend-action@v1
        with:
          token: ${{ secrets.REATTEND_TOKEN }}
```

**Save every push to main:**
```yaml
name: Save commits to Reattend
on:
  push:
    branches: [main]

jobs:
  save:
    runs-on: ubuntu-latest
    steps:
      - uses: Reattend/reattend-action@v1
        with:
          token: ${{ secrets.REATTEND_TOKEN }}
```

**Save releases:**
```yaml
name: Save release to Reattend
on:
  release:
    types: [published]

jobs:
  save:
    runs-on: ubuntu-latest
    steps:
      - uses: Reattend/reattend-action@v1
        with:
          token: ${{ secrets.REATTEND_TOKEN }}
```

**Capture everything — one workflow file:**
```yaml
name: Reattend memory sync
on:
  pull_request:
    types: [opened, closed]
  push:
    branches: [main]
  release:
    types: [published]
  issues:
    types: [opened]

jobs:
  save:
    runs-on: ubuntu-latest
    steps:
      - uses: Reattend/reattend-action@v1
        with:
          token: ${{ secrets.REATTEND_TOKEN }}
```

**Save a custom message at any point in a workflow:**
```yaml
- uses: Reattend/reattend-action@v1
  with:
    token: ${{ secrets.REATTEND_TOKEN }}
    content: "Deployed ${{ github.ref_name }} to production. SHA: ${{ github.sha }}"
    source: "deploy"
```

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `token` | Yes | | Your Reattend API token (`rat_...`) |
| `content` | No | | Custom content to save. If omitted, auto-captures from the event context. |
| `source` | No | `github` | Source label attached to the memory |

## Outputs

| Output | Description |
|---|---|
| `status` | Result: `saved`, `deduped`, `filtered`, or `skipped` |

---

## What you can ask after

Once your repo is connected, ask Claude or Cursor:

- "What changed in the last release?"
- "Why was the auth service refactored?"
- "What PRs did we merge this sprint?"
- "What issues are open in the payments module?"
- "What did we deploy last Friday?"

All answered from real data in your repository history, not hallucination.

---

## Requirements

- A Reattend account: [sign up free](https://reattend.com)
- The [Reattend MCP server](https://github.com/Reattend/reattend-mcp) connected to your AI tool (to query the memory)

---

MIT License

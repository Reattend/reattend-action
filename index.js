// Reattend GitHub Action
// Saves GitHub event context to Reattend memory.
// Uses Node 20 built-in fetch — no dependencies.

const core = require('@actions/core')
const github = require('@actions/github')

const API_BASE = 'https://reattend.com'

async function buildContent() {
  const custom = core.getInput('content')
  if (custom && custom.trim().length >= 10) return custom.trim()

  const { eventName, payload, repo, sha, ref, actor } = github.context
  const repoName = `${repo.owner}/${repo.repo}`

  switch (eventName) {
    case 'pull_request': {
      const pr = payload.pull_request
      const action = payload.action // opened, closed, merged, etc.
      const merged = pr.merged ? ' (merged)' : ''
      const body = pr.body ? `\n\n${pr.body.slice(0, 800)}` : ''
      return `PR #${pr.number} ${action}${merged}: ${pr.title}\nRepo: ${repoName} | Branch: ${pr.head?.ref} → ${pr.base?.ref}\nAuthor: ${actor}${body}`
    }

    case 'push': {
      const commits = (payload.commits || []).slice(0, 10)
      if (commits.length === 0) return null
      const messages = commits.map(c => `  - ${c.message.split('\n')[0]}`).join('\n')
      return `Push to ${ref} in ${repoName} by ${actor}:\n${messages}`
    }

    case 'release': {
      const rel = payload.release
      const body = rel.body ? `\n\n${rel.body.slice(0, 800)}` : ''
      return `Release ${rel.tag_name} published in ${repoName} by ${actor}: ${rel.name || rel.tag_name}${body}`
    }

    case 'issues': {
      const issue = payload.issue
      const body = issue.body ? `\n\n${issue.body.slice(0, 600)}` : ''
      return `Issue #${issue.number} ${payload.action}: ${issue.title}\nRepo: ${repoName} | Author: ${issue.user?.login}${body}`
    }

    case 'issue_comment': {
      const comment = payload.comment
      const issue = payload.issue
      return `Comment on issue #${issue.number} "${issue.title}" in ${repoName} by ${comment.user?.login}:\n\n${comment.body?.slice(0, 600)}`
    }

    case 'create': {
      if (payload.ref_type === 'tag') {
        return `Tag ${payload.ref} created in ${repoName} by ${actor}`
      }
      return null
    }

    case 'workflow_dispatch': {
      const inputs = payload.inputs ? JSON.stringify(payload.inputs) : 'none'
      return `Workflow "${payload.workflow}" manually triggered in ${repoName} by ${actor}. Inputs: ${inputs}`
    }

    default:
      return `GitHub event "${eventName}" in ${repoName} by ${actor} on ${ref || sha?.slice(0, 8)}`
  }
}

async function run() {
  try {
    const token = core.getInput('token', { required: true })
    const source = core.getInput('source') || 'github'

    const content = await buildContent()

    if (!content || content.trim().length < 15) {
      core.info('Nothing meaningful to capture for this event. Skipping.')
      core.setOutput('status', 'skipped')
      return
    }

    core.info(`Saving to Reattend: ${content.slice(0, 80)}...`)

    const res = await fetch(`${API_BASE}/api/tray/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content.trim(),
        source,
        metadata: {
          capturedBy: 'github-action',
          event: github.context.eventName,
          repo: `${github.context.repo.owner}/${github.context.repo.repo}`,
          actor: github.context.actor,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      core.setFailed(`Reattend API error: ${res.status} — ${err}`)
      return
    }

    const data = await res.json()

    if (data.status === 'deduped') {
      core.info('Similar content already captured recently. Skipped duplicate.')
      core.setOutput('status', 'deduped')
    } else if (data.status === 'filtered') {
      core.info('Content was too short or noisy. Skipped.')
      core.setOutput('status', 'filtered')
    } else {
      core.info(`Saved to Reattend memory.`)
      core.setOutput('status', 'saved')
    }
  } catch (err) {
    core.setFailed(`Unexpected error: ${err.message}`)
  }
}

run()

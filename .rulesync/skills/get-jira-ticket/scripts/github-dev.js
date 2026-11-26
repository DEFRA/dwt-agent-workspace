import { pathToFileURL } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

/**
 * Write GitHub development data linked from a Jira issue.
 * @param {string} ticket
 * @param {string} outputDir
 */
export async function githubDev (ticket, outputDir) {
  if (!ticket || !outputDir) throw new Error('Usage: node github-dev.js DWT-XXXX <output_dir>')
  requireAtlassianEnv()
  mkdirSync(outputDir, { recursive: true })
  let issueId = ''
  const ticketJson = join(outputDir, 'ticket.json')
  try {
    issueId = JSON.parse(readFileSync(ticketJson, 'utf8')).id
  } catch {
    const issue = await jira('GET', `${jiraBaseUrl()}/rest/api/2/issue/${ticket}?fields=id`)
    issueId = issue?.id
  }
  if (!issueId) throw new Error(`Error: unable to resolve issue id for ${ticket}`)
  const summary = await jira('GET', `${jiraBaseUrl()}/rest/dev-status/1.0/issue/summary?issueId=${issueId}`)
  const pullRequests = await jira('GET', `${jiraBaseUrl()}/rest/dev-status/1.0/issue/details?issueId=${issueId}&applicationType=GitHub&dataType=pullrequest`)
  const repositories = await jira('GET', `${jiraBaseUrl()}/rest/dev-status/1.0/issue/details?issueId=${issueId}&applicationType=GitHub&dataType=repository`)
  const builds = await jira('GET', `${jiraBaseUrl()}/rest/dev-status/1.0/issue/details?issueId=${issueId}&applicationType=GitHub&dataType=build`)
  const fetchedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  writeFileSync(join(outputDir, 'github.json'), JSON.stringify({
    ticket, issueId, fetchedAt, summary, pullRequests, repositories, builds
  }, null, 2) + '\n')
  const prs = (pullRequests?.detail || []).flatMap((detail) => detail.pullRequests || [])
  const commits = (repositories?.detail || []).flatMap((detail) => (detail.repositories || []).flatMap((repo) => repo.commits || []))
  const files = [...new Set(commits.flatMap((commit) => (commit.files || []).map((file) => `- [${file.changeType}] ${file.path}`)))]
  const buildList = (builds?.detail || []).flatMap((detail) => (detail.jswddBuildsData || []).flatMap((item) => item.builds || []))
  const lines = [
    `=== GitHub Development for ${ticket} ===`,
    `Issue ID: ${issueId}`,
    `Fetched: ${fetchedAt}`,
    '',
    `=== Pull Requests (${prs.length}) ===`,
    prs.length ? prs.map((pr) => `- ${pr.id} [${pr.status}] ${pr.repositoryName}: ${pr.name}\n  ${pr.url}\n  ${pr.source?.branch} -> ${pr.destination?.branch}`).join('\n') : '(none linked in Jira development panel)',
    '',
    `=== Commits (${commits.length}) ===`,
    commits.length ? commits.map((commit) => `- ${commit.displayId} [${commit.author?.name || 'unknown'}]\n  ${(commit.message || '').split('\n')[0]}\n  ${commit.url}`).join('\n') : '(none)',
    '',
    '=== Changed files ===',
    files.length ? files.join('\n') : '(none)',
    '',
    `=== Builds / CI (${buildList.length}) ===`,
    buildList.length ? buildList.slice(0, 20).map((build) => `- [${build.state}] ${build.displayName} #${build.buildNumber}\n  ${build.url}`).join('\n') : '(none)'
  ]
  if (buildList.length > 20) lines.push(`(showing first 20 of ${buildList.length} — see github.json for full list)`)
  const text = lines.join('\n') + '\n'
  writeFileSync(join(outputDir, 'github.txt'), text)
  process.stdout.write(text)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  await githubDev(argv[0] || '', argv[1] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

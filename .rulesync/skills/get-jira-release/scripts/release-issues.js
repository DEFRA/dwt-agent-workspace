import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraReleaseDir, rejectOutputArg } from '../../lib/tmp.js'
import { resolveVersion } from './release-sections.js'

function columns (lines) {
  const rows = lines.filter((line) => line !== '').map((line) => line.split('\t'))
  const widths = []
  for (const row of rows) {
    row.forEach((cell, index) => {
      widths[index] = Math.max(widths[index] || 0, cell.length)
    })
  }
  return rows.map((row) => row.map((cell, index) => {
    if (index === row.length - 1) return cell
    return cell.padEnd(widths[index])
  }).join('  ')).join('\n')
}

/**
 * Write the tickets on a fix version.
 * @param {string} input
 * @param {string} [versionName]
 */
export async function releaseIssues (input, versionName = '') {
  if (!input) throw new Error('Usage: node release-issues.js <version_id_or_url> [version_name]')
  requireAtlassianEnv()
  const versionId = await resolveVersion(input, versionName)
  const outputDir = jiraReleaseDir(versionId)
  mkdirSync(outputDir, { recursive: true })
  const version = await jira('GET', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`)
  if (version?.errorMessages) throw new Error(`Error: ${errorText(version)}`)
  const jql = `fixVersion = ${versionId} ORDER BY key ASC`
  const maxResults = process.env.JIRA_RELEASE_MAX_ISSUES || '100'
  const fields = 'key,summary,status,issuetype,assignee,priority,parent,labels'
  const issues = []
  let nextPageToken = ''
  let isLast = false
  while (!isLast) {
    const params = new URLSearchParams({ jql, maxResults, fields })
    if (nextPageToken) params.set('nextPageToken', nextPageToken)
    const page = await jira('GET', `${jiraBaseUrl()}/rest/api/3/search/jql?${params}`)
    if (page?.errorMessages) throw new Error(`Error: ${errorText(page)}`)
    for (const issue of page.issues || []) {
      issues.push({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        type: issue.fields.issuetype.name,
        priority: issue.fields.priority?.name || 'None',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        parent: issue.fields.parent?.key || null,
        labels: issue.fields.labels || []
      })
    }
    isLast = page.isLast === true || !page.nextPageToken
    nextPageToken = page.nextPageToken || ''
  }
  const by = (field) => {
    const groups = new Map()
    for (const issue of issues) groups.set(issue[field], (groups.get(issue[field]) || 0) + 1)
    return [...groups.entries()].map(([name, count]) => `${name}: ${count}`).join('\n')
  }
  const table = columns([
    'KEY\tTYPE\tSTATUS\tPRIORITY\tASSIGNEE\tSUMMARY',
    ...issues.map((issue) => [issue.key, issue.type, issue.status, issue.priority, issue.assignee, issue.summary].join('\t'))
  ])
  const text = [
    '=== Release tickets ===',
    `Version ID: ${versionId}`,
    `Version name: ${version.name}`,
    `Total tickets: ${issues.length}`,
    '',
    '=== Issues ===',
    table,
    '',
    '=== By status ===',
    by('status'),
    '',
    '=== By type ===',
    by('type'),
    ''
  ].join('\n')
  writeFileSync(join(outputDir, 'issues.txt'), text)
  writeFileSync(join(outputDir, 'issues.json'), JSON.stringify({
    versionId: String(versionId),
    versionName: version.name,
    jql,
    total: issues.length,
    issues
  }, null, 2) + '\n')
  console.log(`Saved: ${outputDir}/issues.txt`)
  console.log(`Saved: ${outputDir}/issues.json`)
  console.log(`Total tickets: ${issues.length}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  if (!argv[0] || argv.length > 2) throw new Error('Usage: node release-issues.js <version_id_or_url> [version_name]')
  rejectOutputArg(argv[1] || '')
  await releaseIssues(argv[0], argv[1] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

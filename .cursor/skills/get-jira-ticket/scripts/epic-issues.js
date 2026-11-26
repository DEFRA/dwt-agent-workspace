import { pathToFileURL } from 'node:url'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

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
 * List the issues in a Jira epic.
 * @param {string} epicKey
 * @param {string} [format]
 * @returns {Promise<string>}
 */
export async function epicIssuesText (epicKey, format = 'list') {
  if (!epicKey) throw new Error('Usage: node epic-issues.js DWT-XXXX [format]\nFormats: list (default), json')
  requireAtlassianEnv()
  const issues = []
  let startAt = 0
  while (true) {
    const page = await jira('GET', `${jiraBaseUrl()}/rest/agile/1.0/epic/${epicKey}/issue?startAt=${startAt}&maxResults=100`)
    if (page?.errorMessages) throw new Error(page.errorMessages.join('\n'))
    const batch = page.issues || []
    issues.push(...batch)
    startAt += batch.length
    if (startAt >= page.total || !batch.length) break
  }
  if (format === 'json') return JSON.stringify({ epic: epicKey, issues, total: issues.length }, null, 2)
  const table = columns(issues.map((issue) => `${issue.key}\t${issue.fields.status.name}\t${issue.fields.issuetype.name}\t${issue.fields.summary}`))
  return [`=== Issues in Epic ${epicKey} ===`, table, '', `Total: ${issues.length} issues`].join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  console.log(await epicIssuesText(argv[0] || '', argv[1] || 'list'))
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

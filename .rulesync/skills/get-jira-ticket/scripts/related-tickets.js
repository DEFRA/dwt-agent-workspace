import { pathToFileURL } from 'node:url'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraTicketDir, rejectOutputArg } from '../../lib/tmp.js'
import { commentsText } from './comments.js'
import { epicIssuesText } from './epic-issues.js'
import { ticketText } from './ticket.js'

/**
 * Write parent, linked issues, subtasks, and epic context.
 * Requires ticket.json from fetch-ticket.js.
 * Writes `.tmp/jira-tickets/<KEY>/related` and `epic`.
 * @param {string} ticket
 */
export async function relatedTickets (ticket) {
  if (!ticket) throw new Error('Usage: node related-tickets.js DWT-XXXX')
  const outputDir = jiraTicketDir(ticket)
  const ticketJsonPath = join(outputDir, 'ticket.json')
  let ticketJson
  try {
    ticketJson = JSON.parse(readFileSync(ticketJsonPath, 'utf8'))
  } catch {
    throw new Error(`Error: ${ticketJsonPath} not found — run fetch-ticket.js first`)
  }
  requireAtlassianEnv()
  const maxRelated = Number(process.env.JIRA_MAX_RELATED || 10)
  const relatedDir = join(outputDir, 'related')
  const epicDir = join(outputDir, 'epic')
  mkdirSync(relatedDir, { recursive: true })
  mkdirSync(epicDir, { recursive: true })
  const reasons = new Map()
  const addKey = (key, reason) => {
    if (!key || key === 'null' || key === ticket) return
    reasons.set(key, reasons.has(key) ? `${reasons.get(key)}; ${reason}` : reason)
  }
  addKey(ticketJson.fields?.parent?.key, 'parent')
  for (const subtask of ticketJson.fields?.subtasks || []) addKey(subtask.key, 'subtask')
  for (const link of ticketJson.fields?.issuelinks || []) {
    if (link.outwardIssue) addKey(link.outwardIssue.key, `linked (${link.type.outward})`)
    else if (link.inwardIssue) addKey(link.inwardIssue.key, `linked (${link.type.inward})`)
  }
  const agile = await jira('GET', `${jiraBaseUrl()}/rest/agile/1.0/issue/${ticket}`)
  let epicKey = agile?.fields?.epic?.key || ''
  const parentKey = ticketJson.fields?.parent?.key || ''
  if (!epicKey && parentKey) {
    const parent = await jira('GET', `${jiraBaseUrl()}/rest/api/2/issue/${parentKey}?fields=issuetype`)
    if (parent?.fields?.issuetype?.name === 'Epic') epicKey = parentKey
  }
  const lines = [
    `Related context for ${ticket}`,
    `Fetched: ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    '',
    epicKey ? `Epic: ${epicKey} (saved under epic/)` : 'Epic: none detected',
    '',
    `Related tickets (full ticket + comments, max ${maxRelated}):`
  ]
  let count = 0
  for (const [key, reason] of reasons) {
    if (count >= maxRelated) {
      lines.push(`  (skipped — max ${maxRelated} reached; set JIRA_MAX_RELATED to increase)`)
      break
    }
    const keyDir = join(relatedDir, key)
    mkdirSync(keyDir, { recursive: true })
    writeFileSync(join(keyDir, 'ticket.txt'), (await ticketText(key, 'full')) + '\n')
    writeFileSync(join(keyDir, 'comments.txt'), (await commentsText(key, 'list')) + '\n')
    lines.push(`  ${key} — ${reason}`)
    count += 1
  }
  if (!count) lines.push('  (none)')
  if (epicKey && epicKey !== ticket) {
    writeFileSync(join(epicDir, 'ticket.txt'), (await ticketText(epicKey, 'full')) + '\n')
    writeFileSync(join(epicDir, 'comments.txt'), (await commentsText(epicKey, 'list')) + '\n')
    try {
      writeFileSync(join(epicDir, 'issues.txt'), (await epicIssuesText(epicKey, 'list')) + '\n')
    } catch {
      writeFileSync(join(epicDir, 'issues.txt'), 'Could not list epic issues (ticket may not be registered as an epic in Agile API)\n')
    }
    lines.push('', `Epic ${epicKey} saved under epic/ (description, comments, sibling issue list)`)
  }
  const text = lines.join('\n') + '\n'
  writeFileSync(join(relatedDir, 'index.txt'), text)
  process.stdout.write(text)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  rejectOutputArg(argv[1] || '')
  await relatedTickets(argv[0] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

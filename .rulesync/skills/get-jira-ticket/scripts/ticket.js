import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraTicketDir, rejectOutputArg } from '../../lib/tmp.js'

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
 * Render one Jira issue.
 * @param {string} ticket
 * @param {string} [format]
 * @returns {Promise<string>}
 */
export async function ticketText (ticket, format = 'full') {
  if (!ticket) throw new Error('Usage: node ticket.js DWT-XXXX [format]\nFormats: full (default), summary, json')
  requireAtlassianEnv()
  const issue = await jira('GET', `${jiraBaseUrl()}/rest/api/2/issue/${ticket}?expand=renderedFields`)
  if (issue?.errorMessages) throw new Error(issue.errorMessages.join('\n'))
  if (format === 'json') return JSON.stringify(issue)
  if (format === 'summary') {
    return JSON.stringify({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      type: issue.fields.issuetype.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee?.displayName,
      parent: issue.fields.parent?.key,
      labels: issue.fields.labels,
      attachmentCount: issue.fields.attachment?.length || 0
    }, null, 2)
  }
  const lines = [
    `=== ${ticket} ===`,
    `Type: ${issue.fields.issuetype.name}`,
    `Status: ${issue.fields.status.name}`,
    `Priority: ${issue.fields.priority?.name}`,
    `Summary: ${issue.fields.summary}`,
    `Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`,
    `Parent: ${issue.fields.parent?.key || 'None'}`,
    `Labels: ${(issue.fields.labels || []).join(', ')}`,
    '',
    '=== Description ===',
    issue.renderedFields?.description || 'No description'
  ]
  const attachments = issue.fields.attachment || []
  if (attachments.length) {
    lines.push('', `=== Attachments (${attachments.length}) ===`)
    lines.push(columns(attachments.map((item) => `${item.id}\t${item.filename}\t${item.mimeType}\t${item.size} bytes`)))
    lines.push('', `Download with: node .cursor/skills/get-jira-ticket/scripts/attachments.js '${ticket}'`)
  }
  const subtasks = issue.fields.subtasks || []
  if (subtasks.length) {
    lines.push('', `=== Subtasks (${subtasks.length}) ===`)
    lines.push(columns(subtasks.map((item) => `${item.key}\t${item.fields.status.name}\t${item.fields.summary}`)))
  }
  const links = issue.fields.issuelinks || []
  if (links.length) {
    lines.push('', `=== Linked Issues (${links.length}) ===`)
    lines.push(columns(links.map((link) => {
      const other = link.outwardIssue || link.inwardIssue
      const relation = link.outwardIssue ? link.type.outward : link.type.inward
      return `${other.key}\t${relation}\t${other.fields.status.name}\t${other.fields.summary}`
    })))
  }
  return lines.join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  const format = argv[1] || 'full'
  rejectOutputArg(format === 'summary' || format === 'json' || format === 'full' ? '' : format)
  if (format === 'summary') {
    console.log(await ticketText(argv[0] || '', 'summary'))
    return
  }
  if (argv.length > 1) throw new Error('Usage: node fetch-ticket.js DWT-XXXX\n   or: node ticket.js DWT-XXXX summary')
  const ticket = argv[0] || ''
  const dir = jiraTicketDir(ticket)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ticket.txt'), (await ticketText(ticket, 'full')) + '\n')
  writeFileSync(join(dir, 'ticket.json'), (await ticketText(ticket, 'json')) + '\n')
  console.log(`Saved ticket in ${dir}`)
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

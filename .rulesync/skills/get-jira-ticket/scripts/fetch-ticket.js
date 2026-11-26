import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jiraTicketDir } from '../../lib/tmp.js'
import { downloadAttachments } from './attachments.js'
import { commentsText } from './comments.js'
import { githubDev } from './github-dev.js'
import { relatedTickets } from './related-tickets.js'
import { ticketText } from './ticket.js'

/**
 * Fetch one Jira ticket into `.tmp/jira-tickets/<KEY>/`.
 * @param {string} ticket
 */
export async function fetchTicket (ticket) {
  if (!ticket) throw new Error('Usage: node fetch-ticket.js DWT-XXXX')
  const dir = jiraTicketDir(ticket)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ticket.txt'), (await ticketText(ticket, 'full')) + '\n')
  writeFileSync(join(dir, 'ticket.json'), (await ticketText(ticket, 'json')) + '\n')
  writeFileSync(join(dir, 'comments.txt'), (await commentsText(ticket, 'list')) + '\n')
  writeFileSync(join(dir, 'comments.json'), (await commentsText(ticket, 'json')) + '\n')
  await downloadAttachments(ticket)
  await githubDev(ticket)
  await relatedTickets(ticket)
  console.log(`Fetched ticket into ${dir}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve(fetchTicket(process.argv[2] || '')).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

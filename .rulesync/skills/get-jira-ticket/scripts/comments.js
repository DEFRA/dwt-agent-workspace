import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraTicketDir, rejectOutputArg } from '../../lib/tmp.js'

/**
 * Render comments on a Jira issue.
 * @param {string} ticket
 * @param {string} [format]
 * @returns {Promise<string>}
 */
export async function commentsText (ticket, format = 'list') {
  if (!ticket) throw new Error('Usage: node comments.js DWT-XXXX [format]\nFormats: list (default), json, count')
  requireAtlassianEnv()
  const response = await jira('GET', `${jiraBaseUrl()}/rest/api/2/issue/${ticket}/comment?expand=renderedBody`)
  if (response?.errorMessages) throw new Error(response.errorMessages.join('\n'))
  const comments = response.comments || []
  if (format === 'json') return JSON.stringify(comments)
  if (format === 'count') return String(comments.length)
  if (!comments.length) return `No comments on ${ticket}`
  const lines = [`=== Comments on ${ticket} (${comments.length}) ===`]
  for (const comment of comments) {
    lines.push(`--- ${comment.author.displayName} (${comment.created.split('T')[0]}) ---`)
    lines.push(comment.renderedBody || comment.body || 'No comment body', '')
  }
  return lines.join('\n')
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  rejectOutputArg(argv[1] || '')
  const ticket = argv[0] || ''
  const dir = jiraTicketDir(ticket)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'comments.txt'), (await commentsText(ticket, 'list')) + '\n')
  writeFileSync(join(dir, 'comments.json'), (await commentsText(ticket, 'json')) + '\n')
  console.log(`Saved comments in ${dir}`)
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

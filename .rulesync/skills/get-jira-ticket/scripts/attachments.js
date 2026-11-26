import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { atlassianBytes, jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraTicketDir, rejectOutputArg } from '../../lib/tmp.js'

/**
 * Download the attachments on a Jira issue into `.tmp/jira-tickets/<KEY>/attachments`.
 * @param {string} ticket
 */
export async function downloadAttachments (ticket) {
  if (!ticket) throw new Error('Usage: node attachments.js DWT-XXXX')
  requireAtlassianEnv()
  const dir = join(jiraTicketDir(ticket), 'attachments')
  const issue = await jira('GET', `${jiraBaseUrl()}/rest/api/2/issue/${ticket}?fields=attachment`)
  if (issue?.errorMessages) throw new Error(issue.errorMessages.join('\n'))
  const attachments = issue.fields?.attachment || []
  if (!attachments.length) {
    console.log(`No attachments on ${ticket}`)
    return
  }
  mkdirSync(dir, { recursive: true })
  console.log(`Downloading ${attachments.length} attachment(s) to ${dir}`)
  for (const attachment of attachments) {
    const outputPath = join(dir, attachment.filename)
    writeFileSync(outputPath, await atlassianBytes(attachment.content))
    console.log(`Saved: ${outputPath}`)
  }
  console.log('')
  console.log(`Attachment directory: ${dir}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  rejectOutputArg(argv[1] || '')
  await downloadAttachments(argv[0] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

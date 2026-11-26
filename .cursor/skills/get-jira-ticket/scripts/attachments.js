import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { atlassianBytes, jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

/**
 * Download the attachments on a Jira issue.
 * @param {string} ticket
 * @param {string} [outputDir]
 */
export async function downloadAttachments (ticket, outputDir) {
  if (!ticket) throw new Error('Usage: node attachments.js DWT-XXXX [output_dir]')
  requireAtlassianEnv()
  const dir = outputDir || `.tmp/jira-tickets/${ticket}/attachments`
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
  await downloadAttachments(argv[0] || '', argv[1] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

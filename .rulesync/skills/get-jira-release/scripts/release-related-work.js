import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { resolveVersion } from './release-sections.js'

/**
 * Write Related work links for a fix version.
 * @param {string} input
 * @param {string} outputDir
 * @param {string} [versionName]
 */
export async function releaseRelatedWork (input, outputDir, versionName = '') {
  if (!input || !outputDir) throw new Error('Usage: node release-related-work.js <version_id_or_url> <output_dir> [version_name]')
  requireAtlassianEnv()
  const versionId = await resolveVersion(input, versionName)
  mkdirSync(outputDir, { recursive: true })
  const version = await jira('GET', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`)
  if (version?.errorMessages) throw new Error(`Error: ${version.errorMessages.join('\n')}`)
  const related = await jira('GET', `${jiraBaseUrl()}/rest/api/3/version/${versionId}/relatedwork`)
  if (related?.statusCode) throw new Error(`Error: ${related.message || 'Failed to fetch related work'}`)
  if (!Array.isArray(related)) throw new Error('Error: related work response was not a list')
  const lines = related.map((item) => `- ${item.title || '(untitled)'} [${item.category || 'Uncategorised'}]\n  ${item.url || item.issueId || ''}`)
  const text = [
    '=== Related work ===',
    `Version: ${version.name} (${versionId})`,
    `Count: ${related.length}`,
    '',
    related.length ? lines.join('\n') : 'No related work.',
    ''
  ].join('\n')
  writeFileSync(join(outputDir, 'related-work.txt'), text)
  writeFileSync(join(outputDir, 'related-work.json'), JSON.stringify({
    versionId: String(versionId),
    versionName: version.name,
    total: related.length,
    relatedWork: related
  }, null, 2) + '\n')
  console.log(`Saved: ${outputDir}/related-work.txt`)
  console.log(`Saved: ${outputDir}/related-work.json`)
  console.log(`Related work: ${related.length}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  await releaseRelatedWork(argv[0], argv[1], argv[2] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

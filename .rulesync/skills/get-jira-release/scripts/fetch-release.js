import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jiraReleaseDir, rejectOutputArg } from '../../lib/tmp.js'
import { releaseText } from './release.js'
import { releaseIssues } from './release-issues.js'
import { releaseRelatedWork } from './release-related-work.js'
import { releaseSections, resolveVersion } from './release-sections.js'
import { releaseStages } from './release-stages.js'

/**
 * Fetch status, dates, stage, tickets, related work, and the Release Notes section.
 * Writes `.tmp/jira-releases/<id>/`.
 * @param {string[]} argv
 */
export async function fetchRelease (argv) {
  const input = argv[0]
  const versionName = argv[1] || ''
  if (!input || argv.length > 2) throw new Error('Usage: node fetch-release.js <version_id_or_url> [version_name]')
  rejectOutputArg(versionName)
  const outputDir = jiraReleaseDir(await resolveVersion(input, versionName))
  mkdirSync(outputDir, { recursive: true })
  const releaseArgs = versionName ? [input, versionName, 'full'] : [input, 'full']
  const jsonArgs = versionName ? [input, versionName, 'json'] : [input, 'json']
  writeFileSync(join(outputDir, 'release.txt'), (await releaseText(releaseArgs)) + '\n')
  writeFileSync(join(outputDir, 'release.json'), (await releaseText(jsonArgs)) + '\n')
  await releaseIssues(input, versionName)
  await releaseSections(input, versionName)
  await releaseRelatedWork(input, versionName)
  await releaseStages(input, versionName)
  console.log(`Fetched release into ${outputDir}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((fetchRelease)(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

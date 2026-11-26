import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { releaseText } from './release.js'
import { releaseIssues } from './release-issues.js'
import { releaseRelatedWork } from './release-related-work.js'
import { releaseSections } from './release-sections.js'
import { releaseStages } from './release-stages.js'

/**
 * Fetch status, dates, stage, tickets, related work, and the Release Notes section.
 * @param {string[]} argv
 */
export async function fetchRelease (argv) {
  const input = argv[0]
  const outputDir = argv[1]
  const versionName = argv[2] || ''
  if (!input || !outputDir) throw new Error('Usage: node fetch-release.js <version_id_or_url> <output_dir> [version_name]')
  mkdirSync(outputDir, { recursive: true })
  const releaseArgs = versionName ? [input, versionName, 'full'] : [input, 'full']
  const jsonArgs = versionName ? [input, versionName, 'json'] : [input, 'json']
  writeFileSync(join(outputDir, 'release.txt'), (await releaseText(releaseArgs)) + '\n')
  writeFileSync(join(outputDir, 'release.json'), (await releaseText(jsonArgs)) + '\n')
  await releaseIssues(input, outputDir, versionName)
  await releaseSections(input, outputDir, versionName)
  await releaseRelatedWork(input, outputDir, versionName)
  await releaseStages(input, outputDir, versionName)
  console.log(`Fetched release into ${outputDir}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((fetchRelease)(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

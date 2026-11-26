import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { graphql, jira, versionAri } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraReleaseDir, rejectOutputArg } from '../../lib/tmp.js'
import { resolveReleaseId } from './resolve-release-id.js'

const READ_SECTION = `
  query ReadSection($id: ID!) {
    jira {
      versionById(id: $id) {
        richTextSection @optIn(to: "JiraVersionRichTextSection") {
          title
          content {
            json
            convertedPlainText { plainText }
          }
        }
      }
    }
  }
`

/**
 * Read the Release Notes section into sections.txt and sections.json.
 * @param {string} input
 * @param {string} [versionName]
 */
export async function releaseSections (input, versionName = '') {
  if (!input) throw new Error('Usage: node release-sections.js <version_id_or_url> [version_name]')
  requireAtlassianEnv()
  const versionId = await resolveVersion(input, versionName)
  const outputDir = jiraReleaseDir(versionId)
  const version = await jira('GET', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`)
  if (version?.errorMessages) throw new Error(`Error: ${errorText(version)}`)
  const project = await jira('GET', `${jiraBaseUrl()}/rest/api/2/project/${version.projectId}`)
  const ari = await versionAri(project.key, versionId, version.name)
  const data = await graphql('ReadSection', READ_SECTION, { id: ari })
  const section = data.jira.versionById.richTextSection || {}
  const title = (section.title || '').trim()
  const plain = (section.content?.convertedPlainText?.plainText || '').trim()
  const sections = []
  if (title || plain) {
    sections.push({ title: title || null, plainText: plain, adf: section.content?.json })
  }
  const payload = {
    versionId: String(versionId),
    versionName: version.name,
    projectKey: project.key,
    sections
  }
  mkdirSync(outputDir, { recursive: true })
  const jsonPath = join(outputDir, 'sections.json')
  const textPath = join(outputDir, 'sections.txt')
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + '\n')
  const lines = [
    '=== Custom sections ===',
    `Version: ${version.name} (${versionId})`,
    `Count: ${sections.length}`,
    ''
  ]
  if (!sections.length) lines.push('No custom sections.')
  for (const item of sections) {
    lines.push(`=== ${item.title || '(untitled)'} ===`, item.plainText || '(empty)', '')
  }
  writeFileSync(textPath, lines.join('\n').replace(/\s+$/, '') + '\n')
  console.log(`Saved: ${textPath}`)
  console.log(`Saved: ${jsonPath}`)
  console.log(`Custom sections: ${sections.length}`)
}

/**
 * @param {string} input
 * @param {string} [versionName]
 * @returns {Promise<string>}
 */
export async function resolveVersion (input, versionName = '') {
  if (versionName && /^[A-Z][A-Z0-9_-]+$/.test(input)) return resolveReleaseId(input, versionName)
  return resolveReleaseId(input)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  if (!argv[0] || argv.length > 2) throw new Error('Usage: node release-sections.js <version_id_or_url> [version_name]')
  rejectOutputArg(argv[1] || '')
  await releaseSections(argv[0], argv[1] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

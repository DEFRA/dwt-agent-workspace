import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { graphql, jira, versionAri } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'
import { jiraReleaseDir, rejectOutputArg } from '../../lib/tmp.js'
import { resolveVersion } from './release-sections.js'

const READ_STAGES = `
  query ReadStages($id: ID!) {
    jira {
      versionById(id: $id) {
        stageInfo @optIn(to: "JiraVersionStageInfoByIds") {
          stages
          currentStage
        }
      }
    }
  }
`

/**
 * Read release stages into stages.txt and stages.json.
 * @param {string} input
 * @param {string} [versionName]
 */
export async function releaseStages (input, versionName = '') {
  if (!input) throw new Error('Usage: node release-stages.js <version_id_or_url> [version_name]')
  requireAtlassianEnv()
  const versionId = await resolveVersion(input, versionName)
  const outputDir = jiraReleaseDir(versionId)
  const version = await jira('GET', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`)
  if (version?.errorMessages) throw new Error(`Error: ${errorText(version)}`)
  const project = await jira('GET', `${jiraBaseUrl()}/rest/api/2/project/${version.projectId}`)
  const ari = await versionAri(project.key, versionId, version.name)
  const data = await graphql('ReadStages', READ_STAGES, { id: ari })
  const info = data.jira.versionById.stageInfo || {}
  const stages = info.stages || []
  const current = info.currentStage ?? null
  const payload = {
    versionId: String(versionId),
    versionName: version.name,
    projectKey: project.key,
    currentStage: current,
    stages
  }
  mkdirSync(outputDir, { recursive: true })
  const jsonPath = join(outputDir, 'stages.json')
  const textPath = join(outputDir, 'stages.txt')
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + '\n')
  const lines = [
    '=== Release stages ===',
    `Version: ${version.name} (${versionId})`,
    `Current stage: ${current || 'Not set'}`,
    `Stages: ${stages.length ? stages.join(', ') : 'Not set'}`,
    ''
  ]
  writeFileSync(textPath, lines.join('\n'))
  console.log(`Saved: ${textPath}`)
  console.log(`Saved: ${jsonPath}`)
  console.log(`Current stage: ${current || 'Not set'}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  if (!argv[0] || argv.length > 2) throw new Error('Usage: node release-stages.js <version_id_or_url> [version_name]')
  rejectOutputArg(argv[1] || '')
  await releaseStages(argv[0], argv[1] || '')
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

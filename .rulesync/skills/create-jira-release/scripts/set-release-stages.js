import { pathToFileURL } from 'node:url'
import { graphql, jira, versionAri } from '../../lib/atlassian.js'
import { errorText, requireAtlassianEnv } from '../../lib/env.js'

const READ_STAGES = `
  query ReadStages($id: ID!) {
    jira {
      versionById(id: $id) {
        stageInfo @optIn(to: "JiraVersionStageInfoByIds") {
          stages
          currentStage
        }
        driverData @optIn(to: "JiraVersionDriverResult") {
          driver { accountId }
        }
      }
    }
  }
`

const MOVE_STAGE = `
  mutation MoveStage($input: JiraUpdateVersionCurrentStageInput!) {
    jira {
      updateJiraVersionCurrentStage(input: $input)
        @optIn(to: "JiraVersionUpdateCurrentStage") {
        success
        errors { message }
      }
    }
  }
`

const SET_STAGES = `
  mutation SetStages($input: JiraVersionUpdateMutationInput!) {
    jira {
      updateJiraVersion(input: $input) @optIn(to: "JiraUpdateVersion") {
        success
        errors { message }
        version {
          stageInfo @optIn(to: "JiraVersionStageInfoByIds") {
            stages
            currentStage
          }
        }
      }
    }
  }
`

/**
 * @param {string} value
 * @returns {string[]}
 */
export function parseStages (value) {
  const stages = value.split(',').map((part) => part.trim()).filter(Boolean)
  if (!stages.length) throw new Error('Error: release stages are empty')
  if (stages[0] !== 'Planned' || stages.at(-1) !== 'Released') {
    throw new Error('Error: release stages must start with Planned and end with Released. Put custom stages between them. Released stays the last stage.')
  }
  if (new Set(stages).size !== stages.length) throw new Error('Error: release stages must be unique')
  return stages
}

function failResult (result, fallback) {
  if (!result.success || result.errors?.length) {
    const messages = (result.errors || []).map((error) => error.message).join('; ') || fallback
    throw new Error(`Error: ${messages}`)
  }
}

/**
 * Set the release stages. Planned is first. Released is last.
 * @param {{ project: string, versionId: string, stages: string }} input
 */
export async function setReleaseStages (input) {
  requireAtlassianEnv()
  const stages = parseStages(input.stages)
  const version = await jira('GET', `/rest/api/2/version/${input.versionId}`)
  const versionError = errorText(version)
  if (version?.errorMessages) throw new Error(`Error: ${versionError}`)
  const ari = await versionAri(input.project, input.versionId, version.name)
  const read = await graphql('ReadStages', READ_STAGES, { id: ari })
  const versionNode = read.jira.versionById
  const current = versionNode.stageInfo?.currentStage || null
  const driver = versionNode.driverData?.driver?.accountId || null
  if (current && !stages.includes(current)) {
    if (!stages.includes('Planned')) throw new Error(`Error: cannot remove the current stage ${current}`)
    const moved = await graphql('MoveStage', MOVE_STAGE, { input: { id: ari, currentStage: 'Planned' } })
    failResult(moved.jira.updateJiraVersionCurrentStage, 'move failed')
  }
  const payload = {
    id: ari,
    name: version.name,
    description: version.description || '',
    stages,
    approvalsRequired: false
  }
  if (version.startDate) payload.startDate = `${version.startDate}T00:00:00.000Z`
  if (version.releaseDate) payload.releaseDate = `${version.releaseDate}T00:00:00.000Z`
  if (driver) payload.driver = driver
  const written = await graphql('SetStages', SET_STAGES, { input: payload })
  failResult(written.jira.updateJiraVersion, 'update failed')
  const info = written.jira.updateJiraVersion.version.stageInfo
  if (current && stages.includes(current) && info.currentStage !== current) {
    const moved = await graphql('MoveStage', MOVE_STAGE, { input: { id: ari, currentStage: current } })
    failResult(moved.jira.updateJiraVersionCurrentStage, 'move failed')
    info.currentStage = current
  }
  console.log(`Release stages: ${info.stages.join(', ')}`)
  console.log(`Current stage: ${info.currentStage}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  const project = argv[argv.indexOf('--project') + 1]
  const versionId = argv[argv.indexOf('--version-id') + 1]
  const stages = argv[argv.indexOf('--stages') + 1]
  if (!project || !versionId || !stages) {
    throw new Error('Usage: node set-release-stages.js --project KEY --version-id ID --stages "Planned,Ext-Test,Released"')
  }
  await setReleaseStages({ project, versionId, stages })
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

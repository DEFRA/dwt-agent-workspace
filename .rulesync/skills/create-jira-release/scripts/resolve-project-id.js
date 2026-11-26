import { pathToFileURL } from 'node:url'
import { jira } from '../../lib/atlassian.js'
import { jiraBaseUrl, requireAtlassianEnv } from '../../lib/env.js'

/**
 * Print the numeric id for a project key.
 * @param {string} projectKey
 * @returns {Promise<string>}
 */
export async function resolveProjectId (projectKey) {
  if (!projectKey) throw new Error('Usage: node resolve-project-id.js <project_key>')
  requireAtlassianEnv()
  const key = projectKey.toUpperCase()
  const project = await jira('GET', `${jiraBaseUrl()}/rest/api/2/project/${key}`)
  if (project?.errorMessages) throw new Error(`Error: ${project.errorMessages.join('\n')}`)
  if (!project?.id) throw new Error(`Error: project '${key}' not found`)
  return String(project.id)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  console.log(await resolveProjectId(argv[0] || ''))
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

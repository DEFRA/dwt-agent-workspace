import { jiraBaseUrl } from './env.js'

/**
 * Call an Atlassian URL with the workspace credentials.
 * @param {string} url
 * @param {{ method?: string, body?: unknown, headers?: Record<string, string> }} [options]
 * @returns {Promise<any>}
 */
export async function atlassianJson (url, options = {}) {
  const headers = {
    Accept: 'application/json',
    Authorization: 'Basic ' + Buffer.from(`${process.env.ATLASSIAN_USER}:${process.env.ATLASSIAN_TOKEN}`).toString('base64'),
    ...options.headers
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(40_000)
  })
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    if (!response.ok) throw new Error(`Error: ${options.method || 'GET'} ${url} failed (${response.status}): ${text.slice(0, 500)}`)
    return text
  }
}

/**
 * Download a URL to a Buffer.
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
export async function atlassianBytes (url) {
  const response = await fetch(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${process.env.ATLASSIAN_USER}:${process.env.ATLASSIAN_TOKEN}`).toString('base64')
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(40_000)
  })
  if (!response.ok) throw new Error(`Error: GET ${url} failed (${response.status})`)
  return Buffer.from(await response.arrayBuffer())
}

/**
 * @param {string} operation
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @returns {Promise<any>}
 */
export async function graphql (operation, query, variables) {
  const result = await atlassianJson(`${jiraBaseUrl()}/gateway/api/graphql`, {
    method: 'POST',
    body: { operationName: operation, query, variables }
  })
  if (result?.errors?.length) {
    throw new Error('Error: ' + result.errors.map((error) => error.message || 'unknown error').join('; '))
  }
  return result?.data
}

const FIND_VERSION = `
  query FindVersion($cloudId: ID!, $key: String!, $search: String!) {
    jira_versionsForProjectByKey(
      cloudId: $cloudId
      projectKey: $key
      searchString: $search
      first: 20
    ) @optIn(to: "JiraVersionsForProjectByKey") {
      edges { node { id versionId name } }
    }
  }
`

/**
 * Resolve the Jira version ARI used by the rich-text and stage mutations.
 * @param {string} projectKey
 * @param {string | number} versionId
 * @param {string} versionName
 * @returns {Promise<string>}
 */
export async function versionAri (projectKey, versionId, versionName) {
  const tenant = await atlassianJson(`${jiraBaseUrl()}/_edge/tenant_info`)
  const data = await graphql('FindVersion', FIND_VERSION, {
    cloudId: tenant.cloudId,
    key: projectKey,
    search: versionName
  })
  const edges = data?.jira_versionsForProjectByKey?.edges || []
  const node = edges.map((edge) => edge.node).find((item) => String(item.versionId) === String(versionId))
  if (!node) throw new Error(`Error: could not find version ${versionId} (${versionName}) in ${projectKey}`)
  return node.id
}

/**
 * @param {string} method
 * @param {string} path
 * @param {unknown} [body]
 * @returns {Promise<any>}
 */
export function jira (method, path, body) {
  const url = path.startsWith('http') ? path : `${jiraBaseUrl()}${path}`
  return atlassianJson(url, { method, body })
}

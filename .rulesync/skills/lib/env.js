import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

/**
 * Workspace root, the directory that contains `.env.example`.
 * @returns {string}
 */
export function workspaceRoot () {
  return root
}

/**
 * Load the workspace `.env` into `process.env`.
 * When the file exists, each assignment replaces the current value, including a blank.
 * When the file is missing, the current environment is left as it is.
 */
export function loadWorkspaceEnv () {
  const envFile = join(root, '.env')
  if (!existsSync(envFile)) return
  for (const raw of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    let line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('export ')) line = line.slice(7).trim()
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    let value = line.slice(eq + 1)
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

/**
 * Load `.env`, then stop when the Atlassian user or token is empty.
 * @param {number} [status]
 */
export function requireAtlassianEnv (status = 1) {
  loadWorkspaceEnv()
  if (!process.env.ATLASSIAN_USER || !process.env.ATLASSIAN_TOKEN) {
    console.error('Error: ATLASSIAN_USER and ATLASSIAN_TOKEN must be set in .env at the workspace root.')
    console.error('Copy .env.example to .env and fill in both values.')
    process.exit(status)
  }
}

/**
 * @returns {string}
 */
export function jiraBaseUrl () {
  return (process.env.ATLASSIAN_BASE_URL || 'https://eaflood.atlassian.net').replace(/\/$/, '')
}

/**
 * @returns {string}
 */
export function confluenceBaseUrl () {
  return (process.env.CONFLUENCE_BASE_URL || 'https://eaflood.atlassian.net/wiki').replace(/\/$/, '')
}

/**
 * @param {unknown} json
 * @returns {string | null}
 */
export function errorText (json) {
  if (!json || typeof json !== 'object') return null
  const body = /** @type {{ errorMessages?: string[], errors?: Record<string, string>, message?: string }} */ (json)
  if (Array.isArray(body.errorMessages) && body.errorMessages.length) return body.errorMessages.join('\n')
  if (body.errors && typeof body.errors === 'object') {
    const values = Object.values(body.errors).filter(Boolean)
    if (values.length) return values.join('\n')
  }
  return null
}

/**
 * @param {unknown} json
 */
export function failOnJiraError (json) {
  const message = errorText(json)
  if (message && /** @type {{ errorMessages?: unknown }} */ (json).errorMessages) throw new Error(message)
}

/**
 * Stop when a Confluence error body includes statusCode.
 * @param {unknown} json
 */
export function failOnConfluenceError (json) {
  if (json && typeof json === 'object' && 'statusCode' in json) {
    const body = /** @type {{ message?: string }} */ (json)
    throw new Error(body.message || 'Unknown error')
  }
}


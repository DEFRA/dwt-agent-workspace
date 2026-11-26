import { join } from 'node:path'
import { workspaceRoot } from './env.js'

/**
 * Stop when a caller passes a path where a name or id belongs.
 * @param {string} [value]
 */
export function rejectOutputArg (value) {
  if (value && (value.includes('/') || value.startsWith('.'))) {
    throw new Error('Error: this script chooses its .tmp folder. Do not pass an output directory.')
  }
}

/**
 * @param {string} ticket
 * @returns {string}
 */
export function jiraTicketDir (ticket) {
  const key = String(ticket || '').trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9]+-\d+$/.test(key)) throw new Error(`Error: expected a Jira ticket key, got '${ticket}'`)
  return join(workspaceRoot(), '.tmp', 'jira-tickets', key)
}

/**
 * @param {string | number} versionId
 * @returns {string}
 */
export function jiraReleaseDir (versionId) {
  const id = String(versionId || '').trim()
  if (id !== 'new' && !/^\d+$/.test(id)) throw new Error(`Error: expected a Jira version id, got '${versionId}'`)
  return join(workspaceRoot(), '.tmp', 'jira-releases', id)
}

/**
 * @param {string} pageId
 * @returns {string}
 */
export function confluencePageDir (pageId) {
  return join(workspaceRoot(), '.tmp', 'confluence-pages', numericId(pageId, 'Confluence page'))
}

/**
 * @param {string} folderId
 * @returns {string}
 */
export function confluenceFolderDir (folderId) {
  return join(workspaceRoot(), '.tmp', 'confluence-folders', numericId(folderId, 'Confluence folder'))
}

/**
 * @param {string} query
 * @param {string} [spaceKey]
 * @returns {string}
 */
export function confluenceSearchFile (query, spaceKey = '') {
  const name = [slug(query), slug(spaceKey)].filter(Boolean).join('-')
  if (!name) throw new Error('Error: search query is empty')
  return join(workspaceRoot(), '.tmp', 'confluence-searches', `${name}.txt`)
}

/**
 * @param {string} value
 * @param {string} label
 * @returns {string}
 */
function numericId (value, label) {
  const id = String(value || '').trim()
  if (!/^\d+$/.test(id)) throw new Error(`Error: expected a ${label} id, got '${value}'`)
  return id
}

/**
 * @param {string} value
 * @returns {string}
 */
function slug (value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

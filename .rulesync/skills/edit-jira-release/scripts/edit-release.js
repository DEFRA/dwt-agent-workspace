import { pathToFileURL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, loadWorkspaceEnv, requireAtlassianEnv } from '../../lib/env.js'
import { jiraReleaseDir } from '../../lib/tmp.js'
import { formatDescription } from '../../lib/markdown.js'
import { resolveReleaseId } from '../../get-jira-release/scripts/resolve-release-id.js'
import { assignIssues } from '../../create-jira-release/scripts/assign-issues.js'
import { setReleaseStages } from '../../create-jira-release/scripts/set-release-stages.js'
import { writeReleaseNotes } from '../../create-jira-release/scripts/write-release-notes.js'

/**
 * Change an existing Jira fix version.
 * @param {string[]} argv
 */
export async function editRelease (argv) {
  if (!argv.length) usage()
  loadWorkspaceEnv()
  const options = {
    outputDir: '',
    project: '',
    name: '',
    version: '',
    tickets: '',
    descriptionFile: '',
    descriptionText: '',
    descriptionFormat: process.env.JIRA_RELEASE_DESCRIPTION_FORMAT || 'markdown',
    releaseNotesFile: '',
    releaseDate: '',
    stages: '',
    released: false,
    dryRun: false
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = () => argv[++index]
    if (arg === '--project') options.project = next()
    else if (arg === '--name' || arg === '--release-name') options.name = next()
    else if (arg === '--version') options.version = next()
    else if (arg === '--tickets') options.tickets = next()
    else if (arg === '--description-file') options.descriptionFile = next()
    else if (arg === '--description-text') options.descriptionText = next()
    else if (arg === '--description-format') options.descriptionFormat = next()
    else if (arg === '--release-notes-file') options.releaseNotesFile = next()
    else if (arg === '--release-date') options.releaseDate = next()
    else if (arg === '--stages') options.stages = next()
    else if (arg === '--released') options.released = true
    else if (arg === '--dry-run') options.dryRun = true
    else throw new Error(`Error: unknown argument: ${arg}`)
  }
  if (!options.version) throw new Error('Error: --version is required. This skill edits an existing release.')
  if (!options.project) throw new Error('Error: --project is required')
  if (options.descriptionFile && options.descriptionText) throw new Error('Error: use only one of --description-file or --description-text')
  if (!options.name && !options.releaseDate && !options.descriptionFile && !options.descriptionText && !options.releaseNotesFile && !options.stages && !options.tickets && !options.released) {
    throw new Error('Error: pass at least one change, such as --description-file, --release-notes-file, --stages, or --tickets')
  }
  if (options.releaseDate && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(options.releaseDate)) {
    throw new Error(`Error: --release-date must be YYYY-MM-DD (got: '${options.releaseDate}')`)
  }
  requireAtlassianEnv(2)
  const projectKey = options.project.toUpperCase()
  const versionId = await resolveReleaseId(options.version)
  options.outputDir = jiraReleaseDir(versionId)
  mkdirSync(options.outputDir, { recursive: true })
  let formattedFile = ''
  if (options.descriptionFile || options.descriptionText) {
    const sourceFile = join(options.outputDir, 'description-source.txt')
    formattedFile = join(options.outputDir, 'description-jira.txt')
    if (options.descriptionFile && !existsSync(options.descriptionFile)) throw new Error(`Error: description file not found: ${options.descriptionFile}`)
    const source = options.descriptionFile ? readFileSync(options.descriptionFile, 'utf8') : `${options.descriptionText}\n`
    if (/^#{1,6} |^Services and versions/m.test(source)) {
      throw new Error('Error: the description is one sentence. Put the release note in --release-notes-file.')
    }
    writeFileSync(sourceFile, options.descriptionText ? `${options.descriptionText}\n` : source)
    const formatted = formatDescription(readFileSync(sourceFile, 'utf8'), options.descriptionFormat)
    writeFileSync(formattedFile, formatted.endsWith('\n') ? formatted : `${formatted}\n`)
  }
  if (options.releaseNotesFile) {
    try { readFileSync(options.releaseNotesFile) } catch { throw new Error(`Error: release notes file not found: ${options.releaseNotesFile}`) }
  }
  if (options.dryRun) {
    console.log('Dry run — no Jira changes made')
    console.log(`  Project: ${projectKey}`)
    console.log(`  Version: ${versionId}`)
    if (options.name) console.log(`  Name: ${options.name}`)
    if (options.releaseDate) console.log(`  Release date: ${options.releaseDate}`)
    if (options.stages) console.log(`  Release stages: ${options.stages}`)
    if (options.tickets) console.log(`  Tickets to add: ${options.tickets}`)
    if (options.releaseNotesFile) console.log(`  Release Notes section: ${options.releaseNotesFile}`)
    if (options.released) console.log('  Mark released: true')
    if (formattedFile) {
      console.log('  Description preview:')
      console.log(readFileSync(formattedFile, 'utf8').split('\n').slice(0, 20).map((line) => `    ${line}`).join('\n'))
    }
    return
  }
  let current = await jira('GET', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`)
  if (current?.errorMessages) throw new Error(`Error: ${current.errorMessages.join('\n')}`)
  const body = {}
  if (options.name) body.name = options.name
  if (options.releaseDate) body.releaseDate = options.releaseDate
  if (options.released) body.released = true
  if (formattedFile) body.description = readFileSync(formattedFile, 'utf8')
  if (Object.keys(body).length) {
    const response = await jira('PUT', `${jiraBaseUrl()}/rest/api/2/version/${versionId}`, body)
    if (response?.errorMessages || response?.errors) throw new Error(`Error: ${errorText(response)}`)
    current = response
  }
  if (options.stages) await setReleaseStages({ project: projectKey, versionId, stages: options.stages })
  if (options.tickets) await assignIssues(versionId, options.tickets, options.outputDir)
  if (options.releaseNotesFile) {
    copyFileSync(options.releaseNotesFile, join(options.outputDir, 'release-notes.md'))
    await writeReleaseNotes({
      project: projectKey,
      versionId,
      versionName: current.name,
      notesFile: options.releaseNotesFile
    })
  }
  const releaseUrl = `${jiraBaseUrl()}/projects/${projectKey}/versions/${versionId}`
  const tickets = options.tickets ? options.tickets.split(',').map((ticket) => ticket.trim().toUpperCase()).filter(Boolean) : []
  writeFileSync(join(options.outputDir, 'manifest.json'), JSON.stringify({
    createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    action: 'edit',
    projectKey,
    version: {
      id: versionId,
      name: current.name,
      url: releaseUrl,
      releaseReportUrl: `${releaseUrl}/tab/release-report-all-issues`,
      releaseDate: options.releaseDate || null,
      stages: options.stages ? options.stages.split(',').map((stage) => stage.trim()) : null,
      released: options.released
    },
    tickets
  }, null, 2) + '\n')
  console.log('Jira release edited')
  console.log(`Name: ${current.name}`)
  console.log(`ID: ${versionId}`)
  console.log(`URL: ${releaseUrl}`)
  console.log(`Report: ${releaseUrl}/tab/release-report-all-issues`)
  console.log(`Manifest: ${join(options.outputDir, 'manifest.json')}`)
}

function usage () {
  throw new Error([
    'Usage:',
    '  node edit-release.js --project DWTC --version 48175 \\',
    '    [--release-name "New name"] [--release-date 2026-11-24] \\',
    '    [--description-file description.md] [--release-notes-file release-notes.md] \\',
    '    [--stages "Planned,Ext-Test,Released"] [--tickets "DWTC-259"] [--released] [--dry-run]'
  ].join('\n'))
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((editRelease)(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

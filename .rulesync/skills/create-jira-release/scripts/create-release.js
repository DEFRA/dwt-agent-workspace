import { pathToFileURL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { jira } from '../../lib/atlassian.js'
import { errorText, jiraBaseUrl, loadWorkspaceEnv, requireAtlassianEnv } from '../../lib/env.js'
import { jiraReleaseDir } from '../../lib/tmp.js'
import { formatDescription } from '../../lib/markdown.js'
import { assignIssues } from './assign-issues.js'
import { checkExistingRelease } from './check-existing-release.js'
import { linkRelatedWork } from './link-related-work.js'
import { resolveProjectId } from './resolve-project-id.js'
import { setReleaseStages } from './set-release-stages.js'
import { writeReleaseNotes } from './write-release-notes.js'

/**
 * @param {string[]} argv
 * @returns {Record<string, string | boolean>}
 */
function parseArgs (argv) {
  if (!argv.length) usage()
  const options = {
    outputDir: jiraReleaseDir('new'),
    project: '',
    name: '',
    tickets: '',
    descriptionFile: '',
    descriptionText: '',
    descriptionFormat: process.env.JIRA_RELEASE_DESCRIPTION_FORMAT || 'markdown',
    releaseNotesFile: '',
    releaseDate: '',
    stages: '',
    stagesSet: false,
    released: false,
    dryRun: false,
    relatedWorkUrl: '',
    relatedWorkTitle: '',
    relatedWorkCategory: process.env.JIRA_RELATED_WORK_CATEGORY || 'Documentation'
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = () => argv[++index]
    if (arg === '--project') options.project = next()
    else if (arg === '--name' || arg === '--release-name') options.name = next()
    else if (arg === '--version') throw new Error('Error: create-jira-release does not update a release. Use edit-jira-release.')
    else if (arg === '--tickets') options.tickets = next()
    else if (arg === '--description-file') options.descriptionFile = next()
    else if (arg === '--description-text') options.descriptionText = next()
    else if (arg === '--description-format') options.descriptionFormat = next()
    else if (arg === '--release-notes-file') options.releaseNotesFile = next()
    else if (arg === '--release-date') options.releaseDate = next()
    else if (arg === '--stages') { options.stages = next(); options.stagesSet = true }
    else if (arg === '--released') options.released = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--related-work-url') options.relatedWorkUrl = next()
    else if (arg === '--related-work-title') options.relatedWorkTitle = next()
    else if (arg === '--related-work-category') options.relatedWorkCategory = next()
    else throw new Error(`Error: unknown argument: ${arg}`)
  }
  return options
}

function usage () {
  throw new Error([
    'Usage:',
    '  node create-release.js --project DWTC --release-name "RoW enhancements v1" \\',
    '    --release-date 2026-11-24 --tickets "DWTC-259,DWTC-260" \\',
    '    --description-file description.md --release-notes-file release-notes.md \\',
    '    [--stages "Planned,Ext-Test,Released"]'
  ].join('\n'))
}

/**
 * Create a Jira fix version, then assign tickets and write the Release Notes section.
 * @param {string[]} argv
 */
export async function createRelease (argv) {
  loadWorkspaceEnv()
  const options = parseArgs(argv)
  if (!options.project) throw new Error('Error: --project is required')
  if (!options.name) throw new Error('Error: --release-name is required')
  if (!options.tickets) throw new Error('Error: --tickets is required')
  if (!options.descriptionFile && !options.descriptionText) throw new Error('Error: provide --description-file or --description-text')
  if (options.descriptionFile && options.descriptionText) throw new Error('Error: use only one of --description-file or --description-text')
  if (!options.releaseDate) throw new Error('Error: --release-date is required')
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(options.releaseDate)) throw new Error(`Error: --release-date must be YYYY-MM-DD (got: '${options.releaseDate}')`)
  if (!options.stagesSet) options.stages = 'Planned,Ext-Test,Released'
  requireAtlassianEnv(2)
  const projectKey = options.project.toUpperCase()
  mkdirSync(options.outputDir, { recursive: true })
  const sourceFile = join(options.outputDir, 'description-source.txt')
  const formattedFile = join(options.outputDir, 'description-jira.txt')
  if (options.descriptionFile && !existsSync(options.descriptionFile)) throw new Error(`Error: description file not found: ${options.descriptionFile}`)
  const source = options.descriptionFile ? readFileSync(options.descriptionFile, 'utf8') : `${options.descriptionText}\n`
  if (/^#{1,6} |^Services and versions/m.test(source)) {
    throw new Error('Error: the description is one sentence. Put the release note in --release-notes-file.')
  }
  writeFileSync(sourceFile, source.endsWith('\n') ? source : `${source}\n`)
  const formatted = formatDescription(readFileSync(sourceFile, 'utf8'), options.descriptionFormat)
  writeFileSync(formattedFile, formatted.endsWith('\n') ? formatted : `${formatted}\n`)
  if (options.releaseNotesFile) {
    try { readFileSync(options.releaseNotesFile) } catch { throw new Error(`Error: release notes file not found: ${options.releaseNotesFile}`) }
  }
  const projectId = await resolveProjectId(projectKey)
  const versionName = options.name
  if (await checkExistingRelease(projectKey, options.name)) {
    throw new Error(`Error: release '${options.name}' already exists. Use edit-jira-release.`)
  }
  if (options.dryRun) {
    console.log('Dry run — no Jira changes made')
    console.log(`  Project: ${projectKey} (${projectId})`)
    console.log(`  Name: ${versionName}`)
    console.log(`  Release date: ${options.releaseDate}`)
    if (options.stages) console.log(`  Release stages: ${options.stages}`)
    console.log(`  Tickets: ${options.tickets}`)
    console.log(`  Description format: ${options.descriptionFormat}`)
    if (options.releaseNotesFile) console.log(`  Release Notes section: ${options.releaseNotesFile}`)
    if (options.relatedWorkUrl) {
      console.log(`  Related work URL: ${options.relatedWorkUrl}`)
      console.log(`  Related work title: ${options.relatedWorkTitle || 'Release notes'}`)
      console.log(`  Related work category: ${options.relatedWorkCategory}`)
    }
    console.log('  Description preview:')
    console.log(readFileSync(formattedFile, 'utf8').split('\n').slice(0, 20).map((line) => `    ${line}`).join('\n'))
    return
  }
  const response = await jira('POST', `${jiraBaseUrl()}/rest/api/2/version`, {
    name: versionName,
    description: readFileSync(formattedFile, 'utf8'),
    released: options.released,
    releaseDate: options.releaseDate,
    projectId: Number(projectId)
  })
  if (response?.errorMessages || response?.errors) throw new Error(`Error: ${errorText(response)}`)
  const versionId = String(response.id)
  const createdName = response.name
  if (options.stages) await setReleaseStages({ project: projectKey, versionId, stages: options.stages })
  const assignments = await assignIssues(versionId, options.tickets, options.outputDir)
  if (options.releaseNotesFile) {
    copyFileSync(options.releaseNotesFile, join(options.outputDir, 'release-notes.md'))
    await writeReleaseNotes({ project: projectKey, versionId, versionName: createdName, notesFile: options.releaseNotesFile })
  }
  let relatedWork = null
  if (options.relatedWorkUrl) {
    const linkArgs = [versionId, options.relatedWorkUrl, '--category', options.relatedWorkCategory]
    if (options.relatedWorkTitle) linkArgs.push('--title', options.relatedWorkTitle)
    linkArgs.push(join(options.outputDir, 'related-work.json'))
    const linked = await linkRelatedWork(linkArgs)
    relatedWork = linked?.relatedWork || null
  }
  const releaseUrl = `${jiraBaseUrl()}/projects/${projectKey}/versions/${versionId}`
  const tickets = options.tickets.split(',').map((ticket) => ticket.trim().toUpperCase()).filter(Boolean)
  const manifest = {
    createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    action: 'create',
    projectKey,
    projectId: Number(projectId),
    version: {
      id: versionId,
      name: createdName,
      url: releaseUrl,
      releaseReportUrl: `${releaseUrl}/tab/release-report-all-issues`,
      releaseDate: options.releaseDate || null,
      stages: options.stages ? options.stages.split(',').map((stage) => stage.trim()) : null,
      released: options.released
    },
    tickets,
    descriptionFormat: options.descriptionFormat,
    descriptionSourceFile: 'description-source.txt',
    descriptionJiraFile: 'description-jira.txt',
    descriptionJira: readFileSync(formattedFile, 'utf8'),
    assignments,
    relatedWork
  }
  writeFileSync(join(options.outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('Jira release created')
  console.log(`Name: ${createdName}`)
  console.log(`Release date: ${options.releaseDate}`)
  console.log(`ID: ${versionId}`)
  console.log(`URL: ${releaseUrl}`)
  console.log(`Report: ${releaseUrl}/tab/release-report-all-issues`)
  console.log(`Tickets assigned: ${assignments.assigned.join(', ')}`)
  if (options.relatedWorkUrl) console.log(`Related work: ${options.relatedWorkUrl}`)
  console.log(`Manifest: ${join(options.outputDir, 'manifest.json')}`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((createRelease)(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { graphql, versionAri } from '../../lib/atlassian.js'
import { requireAtlassianEnv } from '../../lib/env.js'
import { markdownToAdf } from '../../lib/markdown.js'

const SECTION_TITLE = 'Release Notes'

const WRITE_NOTES = `
  mutation WriteReleaseNotes(
    $title: JiraUpdateVersionRichTextSectionTitleInput!
    $content: JiraUpdateVersionRichTextSectionContentInput!
  ) {
    jira {
      updateJiraVersionRichTextSectionTitle(input: $title)
        @optIn(to: "JiraUpdateVersionRichTextSectionTitle") {
        success
        errors { message }
      }
      updateJiraVersionRichTextSectionContent(input: $content)
        @optIn(to: "JiraUpdateVersionRichTextSectionContent") {
        success
        errors { message }
        version {
          richTextSection @optIn(to: "JiraVersionRichTextSection") {
            title
            content { convertedPlainText { plainText } }
          }
        }
      }
    }
  }
`

/**
 * Write markdown into the Jira Release Notes section.
 * @param {{ project: string, versionId: string, versionName: string, notesFile: string }} input
 */
export async function writeReleaseNotes (input) {
  requireAtlassianEnv()
  const markdown = readFileSync(input.notesFile, 'utf8')
  const adf = markdownToAdf(markdown)
  const ari = await versionAri(input.project, input.versionId, input.versionName)
  const data = await graphql('WriteReleaseNotes', WRITE_NOTES, {
    title: { id: ari, title: SECTION_TITLE },
    content: { id: ari, content: adf }
  })
  const jira = data.jira
  for (const key of ['updateJiraVersionRichTextSectionTitle', 'updateJiraVersionRichTextSectionContent']) {
    const result = jira[key]
    if (!result.success || result.errors?.length) {
      const messages = (result.errors || []).map((error) => error.message).join('; ') || 'update failed'
      throw new Error(`Error: ${key}: ${messages}`)
    }
  }
  const section = jira.updateJiraVersionRichTextSectionContent.version.richTextSection
  console.log(`Release Notes section updated on ${input.versionName}`)
  console.log(`Title: ${section.title}`)
}

function flag (argv, name) {
  const index = argv.indexOf(name)
  return index === -1 ? '' : argv[index + 1]
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  const project = flag(argv, '--project')
  const versionId = flag(argv, '--version-id')
  const versionName = flag(argv, '--version-name')
  const notesFile = flag(argv, '--notes-file')
  if (!project || !versionId || !versionName || !notesFile) {
    throw new Error('Usage: node write-release-notes.js --project KEY --version-id ID --version-name NAME --notes-file FILE')
  }
  await writeReleaseNotes({ project, versionId, versionName, notesFile })
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { formatDescription } from '../../lib/markdown.js'

/**
 * Print the Jira wiki form of a description file.
 * @param {string[]} argv
 */
export function formatDescriptionFile (argv) {
  const file = argv[0]
  const formatFlag = argv.indexOf('--format')
  const format = formatFlag === -1 ? 'markdown' : argv[formatFlag + 1]
  if (!file) {
    console.error('Usage: node format-description.js <file> --format markdown|wiki|text|html')
    process.exit(1)
  }
  const value = readFileSync(file, 'utf8')
  const formatted = formatDescription(value, format)
  process.stdout.write(formatted.endsWith('\n') ? formatted : `${formatted}\n`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve((async (argv) => {
  formatDescriptionFile(argv)
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

import { pathToFileURL } from 'node:url'

/**
 * Print a Confluence content id from a number or a page or folder URL.
 * @param {string} input
 * @returns {string}
 */
export function resolveContentId (input) {
  if (!input) throw new Error('Usage: node resolve-content-id.js CONTENT_ID_OR_URL')
  let contentId = input
  if (/^https?:\/\//.test(input)) {
    const folder = input.match(/\/folder\/([0-9]+)/)
    const page = input.match(/\/pages\/([0-9]+)/)
    contentId = folder?.[1] || page?.[1] || input.replace(/.*\/(pages|folder)\/([0-9]+).*/, '$2')
  }
  if (!/^[0-9]+$/.test(contentId)) throw new Error(`Error: unable to determine content id from input: ${input}`)
  return contentId
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve(((argv) => {
  console.log(resolveContentId(argv[0] || ''))
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

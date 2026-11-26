import { pathToFileURL } from 'node:url'
import { resolveContentId } from '../../get-confluence-page/scripts/resolve-content-id.js'

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  Promise.resolve(((argv) => {
  console.log(resolveContentId(argv[0] || ''))
})(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

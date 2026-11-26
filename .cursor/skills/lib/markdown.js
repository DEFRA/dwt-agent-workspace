/**
 * Convert a release description into Jira wiki markup.
 * @param {string} value
 * @param {string} sourceFormat
 * @returns {string}
 */
export function formatDescription (value, sourceFormat) {
  const format = sourceFormat.toLowerCase()
  if (format === 'wiki' || format === 'text') return value.trim()
  if (format === 'html') return htmlToText(value)
  if (format === 'markdown') return markdownToWiki(value)
  throw new Error(`Unsupported format: ${sourceFormat}`)
}

/**
 * Turn release-note markdown into the Atlassian document Jira stores.
 * @param {string} markdown
 * @returns {{ version: number, type: string, content: object[] }}
 */
export function markdownToAdf (markdown) {
  const content = []
  let paragraphLines = []
  let bulletItems = []

  const flushParagraph = () => {
    const text = paragraphLines.map((line) => line.trim()).join(' ').trim()
    paragraphLines = []
    if (text) content.push(paragraph(text))
  }
  const flushBullets = () => {
    if (!bulletItems.length) return
    content.push({
      type: 'bulletList',
      content: bulletItems.map((item) => ({ type: 'listItem', content: [paragraph(item)] }))
    })
    bulletItems = []
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim()) {
      flushParagraph()
      flushBullets()
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushBullets()
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: inlineNodes(heading[2].trim())
      })
      continue
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line)
    if (bullet) {
      flushParagraph()
      bulletItems.push(bullet[1].trim())
      continue
    }
    flushBullets()
    paragraphLines.push(line)
  }
  flushParagraph()
  flushBullets()
  if (!content.length) throw new Error('Error: release notes file is empty')
  return { version: 1, type: 'doc', content }
}

/**
 * @param {string} text
 * @returns {object[]}
 */
function inlineNodes (text) {
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  const nodes = []
  let position = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > position) nodes.push({ type: 'text', text: text.slice(position, start) })
    if (match[1] != null) {
      nodes.push({ type: 'text', text: match[1], marks: [{ type: 'strong' }] })
    } else {
      nodes.push({
        type: 'text',
        text: match[2],
        marks: [{ type: 'link', attrs: { href: match[3] } }]
      })
    }
    position = start + match[0].length
  }
  if (position < text.length) nodes.push({ type: 'text', text: text.slice(position) })
  return nodes
}

/**
 * @param {string} text
 * @returns {object}
 */
function paragraph (text) {
  const nodes = inlineNodes(text)
  if (!nodes.length) return { type: 'paragraph', content: [] }
  return { type: 'paragraph', content: nodes }
}

/**
 * @param {string} text
 * @returns {string}
 */
function inlineMarkdownToWiki (text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]')
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')
    .replace(/__([^_]+)__/g, '*$1*')
    .replace(/`([^`]+)`/g, '{{$1}}')
}

/**
 * @param {string[]} lines
 * @param {number} startIndex
 * @returns {{ lines: string[], index: number }}
 */
function markdownTableToWiki (lines, startIndex) {
  const rows = []
  let index = startIndex
  while (index < lines.length) {
    const line = lines[index].replace(/\s+$/, '')
    if (!line.trim().startsWith('|')) break
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
    if (!cells.length) break
    if (!cells.every((cell) => /^:?-+:?$/.test(cell))) rows.push(cells)
    index += 1
  }
  if (!rows.length) return { lines: [], index: startIndex }
  const header = rows[0]
  const output = ['|| ' + header.map(inlineMarkdownToWiki).join(' || ') + ' ||']
  for (const row of rows.slice(1)) {
    const padded = row.concat(Array(Math.max(0, header.length - row.length)).fill('')).slice(0, header.length)
    output.push('| ' + padded.map(inlineMarkdownToWiki).join(' | ') + ' |')
  }
  return { lines: output, index }
}

/**
 * @param {string} value
 * @returns {string}
 */
function markdownToWiki (value) {
  const lines = value.split(/\r?\n/)
  const output = []
  let inCode = false
  let index = 0
  while (index < lines.length) {
    const line = lines[index].replace(/\s+$/, '')
    if (line.trim().startsWith('```')) {
      inCode = !inCode
      output.push('{code}')
      index += 1
      continue
    }
    if (inCode) {
      output.push(line)
      index += 1
      continue
    }
    if (line.trim().startsWith('|')) {
      const table = markdownTableToWiki(lines, index)
      if (table.lines.length) {
        output.push(...table.lines)
        index = table.index
        continue
      }
    }
    if (!line.trim()) {
      output.push('')
      index += 1
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      output.push(`h${heading[1].length}. ${inlineMarkdownToWiki(heading[2].trim())}`)
      index += 1
      continue
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line)
    if (bullet) {
      output.push(`* ${inlineMarkdownToWiki(bullet[1].trim())}`)
      index += 1
      continue
    }
    const numbered = /^\d+\.\s+(.*)$/.exec(line)
    if (numbered) {
      output.push(`# ${inlineMarkdownToWiki(numbered[1].trim())}`)
      index += 1
      continue
    }
    output.push(inlineMarkdownToWiki(line.trim()))
    index += 1
  }
  return output.join('\n').trim()
}

/**
 * @param {string} value
 * @returns {string}
 */
function htmlToText (value) {
  const text = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(p|div|li|tr|h[1-4])(\s[^>]*)?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-4])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

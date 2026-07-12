export interface MarkdownHeading {
  title: string
  level: number
  line: number
}

interface MarkdownDoc {
  lines: number
  line: (n: number) => { text: string }
}

function isFrontMatterClose(trimmed: string): boolean {
  return trimmed === `---` || trimmed === `...`
}

function matchFenceDelimiter(trimmed: string): RegExpMatchArray | null {
  return trimmed.match(/^(`{3,}|~{3,})/)
}

function matchClosingFence(trimmed: string): RegExpMatchArray | null {
  return trimmed.match(/^(`{3,}|~{3,})\s*$/)
}

export function extractMarkdownHeadings(doc: MarkdownDoc): MarkdownHeading[] {
  const items: MarkdownHeading[] = []
  let codeFenceChar = ``
  let codeFenceCount = 0
  let inFrontMatter = false

  for (let i = 1; i <= doc.lines; i++) {
    const text = doc.line(i).text
    const trimmed = text.trimStart()

    if (i === 1 && trimmed === `---`) {
      inFrontMatter = true
      continue
    }
    if (inFrontMatter) {
      if (isFrontMatterClose(trimmed))
        inFrontMatter = false
      continue
    }

    if (codeFenceChar) {
      const closeMatch = matchClosingFence(trimmed)
      if (closeMatch && closeMatch[1][0] === codeFenceChar && closeMatch[1].length >= codeFenceCount) {
        codeFenceChar = ``
        codeFenceCount = 0
      }
      continue
    }
    const openMatch = matchFenceDelimiter(trimmed)
    if (openMatch) {
      codeFenceChar = openMatch[1][0]
      codeFenceCount = openMatch[1].length
      continue
    }

    const match = text.match(/^(\s{0,3})(#{1,6})\s+(.+)/)
    if (match) {
      const level = match[2].length
      const title = match[3].replace(/\s*#+\s*$/, ``).trim()
      items.push({ title, level, line: i })
    }
  }

  return items
}

export function computeHeadingBreadcrumbs(
  headings: MarkdownHeading[],
  currentLine: number,
): MarkdownHeading[] {
  const stack: MarkdownHeading[] = []
  for (const item of headings) {
    if (item.line > currentLine)
      break
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level)
      stack.pop()
    stack.push(item)
  }
  return stack
}

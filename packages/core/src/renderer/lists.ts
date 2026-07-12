import type { Tokens } from 'marked'
import type { StyledContent } from './html'

interface ListFrame {
  counter: number
  ordered: boolean
}

export interface ListState {
  enter: (ordered: boolean, start: number | ``) => void
  exit: () => void
  nextPrefix: () => string
  reset: () => void
}

type ParseListItemTokens = (tokens: Tokens.ListItem[`tokens`]) => string

interface RenderListOptions {
  items: Tokens.ListItem[]
  listState: ListState
  ordered: boolean
  renderItem: (item: Tokens.ListItem) => string
  start: number | ``
  styledContent: StyledContent
}

interface RenderListItemOptions {
  listState: ListState
  parseBlock: ParseListItemTokens
  parseInline: ParseListItemTokens
  styledContent: StyledContent
  token: Tokens.ListItem
}

const PARAGRAPH_WRAPPER_REGEX = /^<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/

export function createListState() {
  const stack: ListFrame[] = []

  function enter(ordered: boolean, start: number | ``): void {
    stack.push({ ordered, counter: Number(start) })
  }

  function exit(): void {
    stack.pop()
  }

  function reset(): void {
    stack.length = 0
  }

  function nextPrefix(): string {
    const frame = stack[stack.length - 1]
    if (!frame)
      return `• `

    const current = frame.counter
    frame.counter = current + 1

    return frame.ordered
      ? `${current}. `
      : `• `
  }

  return {
    enter,
    exit,
    nextPrefix,
    reset,
  }
}

export function renderList({
  items,
  listState,
  ordered,
  renderItem,
  start,
  styledContent,
}: RenderListOptions): string {
  listState.enter(ordered, start)
  let html = ``
  try {
    html = items
      .map(item => renderItem(item))
      .join(``)
  }
  finally {
    listState.exit()
  }

  return styledContent(
    ordered ? `ol` : `ul`,
    html,
  )
}

export function renderListItem({
  listState,
  parseBlock,
  parseInline,
  styledContent,
  token,
}: RenderListItemOptions): string {
  const prefix = listState.nextPrefix()

  let content: string
  try {
    content = parseInline(token.tokens)
  }
  catch {
    content = parseBlock(token.tokens)
      .replace(PARAGRAPH_WRAPPER_REGEX, `$1`)
  }

  return styledContent(
    `listitem`,
    `${prefix}${content}`,
    `li`,
  )
}

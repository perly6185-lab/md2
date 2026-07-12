import type { StyledContent } from './html'
import { escapeHtml } from '../utils/basicHelpers'

interface RenderTextOptions {
  styledContent: StyledContent
  text: string
}

interface RenderHeadingOptions extends RenderTextOptions {
  depth: number
}

const STANDALONE_KATEX_BLOCK_REGEX = /^<section class="katex-block"[\s\S]*<\/section>\s*$/

function isStandaloneKatexBlock(html: string): boolean {
  return STANDALONE_KATEX_BLOCK_REGEX.test(html.trim())
}

export function renderHeading({
  depth,
  styledContent,
  text,
}: RenderHeadingOptions): string {
  return styledContent(`h${depth}`, text)
}

export function renderParagraph({
  styledContent,
  text,
}: RenderTextOptions): string {
  const isFigureImage = text.includes(`<figure`) && text.includes(`<img`)
  const isEmpty = text.trim() === ``
  const isKatexOnly = isStandaloneKatexBlock(text)
  if (isFigureImage || isEmpty || isKatexOnly)
    return text

  return styledContent(`p`, text)
}

export function renderBlockquote({
  styledContent,
  text,
}: RenderTextOptions): string {
  return styledContent(`blockquote`, text)
}

export function renderCodespan({
  styledContent,
  text,
}: RenderTextOptions): string {
  return styledContent(`codespan`, escapeHtml(text), `code`)
}

export function renderStrong({
  styledContent,
  text,
}: RenderTextOptions): string {
  return styledContent(`strong`, text)
}

export function renderEm({
  styledContent,
  text,
}: RenderTextOptions): string {
  return styledContent(`em`, text)
}

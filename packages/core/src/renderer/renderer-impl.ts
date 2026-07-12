import type { IOpts, RendererAPI } from '@md/shared/types'
import type { RendererObject, Tokens } from 'marked'
import hljs from 'highlight.js/lib/core'
import { escapeHtml } from '../utils/basicHelpers'
import { COMMON_LANGUAGES } from '../utils/languages'
import { renderCodeBlock } from './codeBlocks'
import { buildAdditionStyle, buildReadingTime, parseFrontMatterAndContent } from './document'
import { createFootnoteRegistry } from './footnotes'
import { styledContent } from './html'
import { renderImage } from './images'
import { renderLink } from './links'
import { createListState, renderList, renderListItem } from './lists'
import { createMarkdownParser } from './markdownParser'
import { renderHorizontalRule } from './rules'
import { renderTable, renderTableCell } from './tables'

Object.entries(COMMON_LANGUAGES).forEach(([name, lang]) => {
  hljs.registerLanguage(name, lang)
})

export { hljs }

function isStandaloneKatexBlock(html: string): boolean {
  return /^<section class="katex-block"[\s\S]*<\/section>\s*$/.test(html.trim())
}

export function initRenderer(opts: IOpts = {}): RendererAPI {
  const footnotes = createFootnoteRegistry()
  const listState = createListState()

  function getOpts(): IOpts {
    return opts
  }

  function reset(newOpts: Partial<IOpts>): void {
    footnotes.reset()
    listState.reset()
    setOptions(newOpts)
  }

  function setOptions(newOpts: Partial<IOpts>): void {
    opts = { ...opts, ...newOpts }
  }

  const buildFootnotes = () => {
    return footnotes.build(styledContent)
  }

  const renderer: RendererObject = {
    heading({ tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens)
      const tag = `h${depth}`
      return styledContent(tag, text)
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens)
      const isFigureImage = text.includes(`<figure`) && text.includes(`<img`)
      const isEmpty = text.trim() === ``
      const isKatexOnly = isStandaloneKatexBlock(text)
      if (isFigureImage || isEmpty || isKatexOnly) {
        return text
      }
      return styledContent(`p`, text)
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const text = this.parser.parse(tokens)
      // 新主题系统：blockquote 内的 p 标签由 CSS 选择器 `blockquote p` 控制
      return styledContent(`blockquote`, text)
    },

    code({ text, lang = `` }: Tokens.Code): string {
      return renderCodeBlock({
        hljs,
        lang,
        showLineNumber: opts.isShowLineNumber,
        text,
      })
    },

    codespan({ text }: Tokens.Codespan): string {
      const escapedText = escapeHtml(text)
      return styledContent(`codespan`, escapedText, `code`)
    },

    list({ ordered, items, start = 1 }: Tokens.List) {
      return renderList({
        items,
        listState,
        ordered,
        renderItem: item => this.listitem(item) as string,
        start,
        styledContent,
      })
    },

    listitem(token: Tokens.ListItem) {
      return renderListItem({
        listState,
        parseBlock: tokens => this.parser.parse(tokens),
        parseInline: tokens => this.parser.parseInline(tokens),
        styledContent,
        token,
      })
    },

    image({ href, title, text }: Tokens.Image): string {
      return renderImage({
        href,
        legend: opts.legend,
        styledContent,
        text,
        title,
      })
    },

    link({ href, title, text, tokens }: Tokens.Link): string {
      const parsedText = this.parser.parseInline(tokens)
      return renderLink({
        citeStatus: opts.citeStatus,
        footnotes,
        href,
        parsedText,
        text,
        title,
      })
    },

    strong({ tokens }: Tokens.Strong): string {
      return styledContent(`strong`, this.parser.parseInline(tokens))
    },

    em({ tokens }: Tokens.Em): string {
      return styledContent(`em`, this.parser.parseInline(tokens))
    },

    table({ header, rows }: Tokens.Table): string {
      return renderTable({
        header,
        parseInline: tokens => this.parser.parseInline(tokens),
        rows,
        styledContent,
      })
    },

    tablecell(token: Tokens.TableCell): string {
      return renderTableCell({
        cell: token,
        parseInline: tokens => this.parser.parseInline(tokens),
        styledContent,
      })
    },

    hr(token: Tokens.Hr): string {
      return renderHorizontalRule(token)
    },
  }

  const markdownParser = createMarkdownParser({
    getOptions: getOpts,
    renderer,
  })

  return {
    buildAddition: buildAdditionStyle,
    buildFootnotes,
    setOptions,
    reset,
    parseFrontMatterAndContent,
    renderMarkdownToHtml(markdown: string) {
      return markdownParser.parse(markdown) as string
    },
    buildReadingTime(readingTime) {
      return buildReadingTime(readingTime, opts.countStatus)
    },
    createContainer(content: string) {
      return styledContent(`container`, content, `section`)
    },
    getOpts,
  }
}

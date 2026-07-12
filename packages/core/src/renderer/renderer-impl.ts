import type { IOpts, RendererAPI } from '@md/shared/types'
import type { RendererObject, Tokens } from 'marked'
import { renderCodeBlock } from './codeBlocks'
import { buildAdditionStyle, buildReadingTime, parseFrontMatterAndContent } from './document'
import { createFootnoteRegistry } from './footnotes'
import { hljs } from './highlighting'
import { styledContent } from './html'
import { renderImage } from './images'
import { renderLink } from './links'
import { createListState, renderList, renderListItem } from './lists'
import { createMarkdownParser } from './markdownParser'
import { renderHorizontalRule } from './rules'
import { renderTable, renderTableCell } from './tables'
import { renderBlockquote, renderCodespan, renderEm, renderHeading, renderParagraph, renderStrong } from './text'

export { hljs }

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
      return renderHeading({
        depth,
        styledContent,
        text,
      })
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens)
      return renderParagraph({
        styledContent,
        text,
      })
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      const text = this.parser.parse(tokens)
      return renderBlockquote({
        styledContent,
        text,
      })
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
      return renderCodespan({
        styledContent,
        text,
      })
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
      return renderStrong({
        styledContent,
        text: this.parser.parseInline(tokens),
      })
    },

    em({ tokens }: Tokens.Em): string {
      return renderEm({
        styledContent,
        text: this.parser.parseInline(tokens),
      })
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

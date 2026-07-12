import type { IOpts } from '@md/shared/types'
import type { HLJSApi } from 'highlight.js'
import type { RendererObject, Tokens } from 'marked'
import type { ListState } from './lists'
import { renderCodeBlock } from './codeBlocks'
import { styledContent } from './html'
import { renderImage } from './images'
import { renderLink } from './links'
import { renderList, renderListItem } from './lists'
import { renderHorizontalRule } from './rules'
import { renderTable, renderTableCell } from './tables'
import { renderBlockquote, renderCodespan, renderEm, renderHeading, renderParagraph, renderStrong } from './text'

interface LinkFootnotes {
  add: (title: string, link: string) => number
}

interface CreateRendererObjectOptions {
  footnotes: LinkFootnotes
  getOptions: () => IOpts
  highlighter: HLJSApi
  listState: ListState
}

export function createRendererObject({
  footnotes,
  getOptions,
  highlighter,
  listState,
}: CreateRendererObjectOptions): RendererObject {
  return {
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
        hljs: highlighter,
        lang,
        showLineNumber: getOptions().isShowLineNumber,
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
        legend: getOptions().legend,
        styledContent,
        text,
        title,
      })
    },

    link({ href, title, text, tokens }: Tokens.Link): string {
      const parsedText = this.parser.parseInline(tokens)
      return renderLink({
        citeStatus: getOptions().citeStatus,
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
}

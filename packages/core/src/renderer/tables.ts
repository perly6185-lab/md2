import type { Tokens } from 'marked'
import type { StyledContent } from './html'

type TableCellTag = `td` | `th`
type ParseInline = (tokens: Tokens.TableCell[`tokens`]) => string

interface RenderTableOptions {
  header: Tokens.TableCell[]
  parseInline: ParseInline
  rows: Tokens.TableCell[][]
  styledContent: StyledContent
}

interface RenderTableCellOptions {
  cell: Tokens.TableCell
  parseInline: ParseInline
  styledContent: StyledContent
  tag?: TableCellTag
}

export function renderTableCell({
  cell,
  parseInline,
  styledContent,
  tag = `td`,
}: RenderTableCellOptions): string {
  const text = parseInline(cell.tokens)
  return styledContent(tag, text, undefined, `text-align: ${cell.align || `left`}`)
}

export function renderTable({
  header,
  parseInline,
  rows,
  styledContent,
}: RenderTableOptions): string {
  const headerRow = header
    .map(cell => renderTableCell({
      cell,
      parseInline,
      styledContent,
      tag: `th`,
    }))
    .join(``)

  const body = rows
    .map((row) => {
      const rowContent = row
        .map(cell => renderTableCell({
          cell,
          parseInline,
          styledContent,
        }))
        .join(``)
      return styledContent(`tr`, rowContent)
    })
    .join(``)

  return `
        <section style="max-width: 100%; overflow: auto; -webkit-overflow-scrolling: touch">
          <table class="preview-table">
            <thead>${headerRow}</thead>
            <tbody>${body}</tbody>
          </table>
        </section>
      `
}

import type { StyledContent } from './html'

type Footnote = [number, string, string]

function buildFootnoteArray(footnotes: Footnote[]): string {
  return footnotes
    .map(([index, title, link]) =>
      link === title
        ? `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code>: <i style="word-break: break-all">${title}</i><br/>`
        : `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code> ${title}: <i style="word-break: break-all">${link}</i><br/>`,
    )
    .join(`\n`)
}

export function createFootnoteRegistry() {
  const footnotes: Footnote[] = []
  let footnoteIndex = 0

  function add(title: string, link: string): number {
    const existingFootnote = footnotes.find(([, , existingLink]) => existingLink === link)
    if (existingFootnote)
      return existingFootnote[0]

    footnotes.push([++footnoteIndex, title, link])
    return footnoteIndex
  }

  function reset(): void {
    footnotes.length = 0
    footnoteIndex = 0
  }

  function build(styledContent: StyledContent): string {
    if (!footnotes.length)
      return ``

    return (
      styledContent(`h4`, `引用链接`)
      + styledContent(`footnotes`, buildFootnoteArray(footnotes), `p`)
    )
  }

  return {
    add,
    build,
    reset,
  }
}

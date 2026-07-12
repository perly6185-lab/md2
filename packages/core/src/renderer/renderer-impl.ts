import type { IOpts, RendererAPI } from '@md/shared/types'
import { buildAdditionStyle, buildReadingTime, parseFrontMatterAndContent } from './document'
import { createFootnoteRegistry } from './footnotes'
import { hljs } from './highlighting'
import { styledContent } from './html'
import { createListState } from './lists'
import { createMarkdownParser } from './markdownParser'
import { createRendererObject } from './rendererObject'

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

  const renderer = createRendererObject({
    footnotes,
    getOptions: getOpts,
    highlighter: hljs,
    listState,
  })

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

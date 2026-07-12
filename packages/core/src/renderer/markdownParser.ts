import type { IOpts } from '@md/shared/types'
import type { RendererObject } from 'marked'
import { Marked } from 'marked'
import {
  getBuiltInRegistry,
  markedAlert,
  markedComponent,
  markedFootnotes,
  markedInfographic,
  markedMarkup,
  markedMermaid,
  markedPlantUML,
  markedRuby,
  markedSlider,
  markedToc,
  MDKatex,
} from '../extensions'

interface CreateMarkdownParserOptions {
  getOptions: () => IOpts
  renderer: RendererObject
}

export function createMarkdownParser({
  getOptions,
  renderer,
}: CreateMarkdownParserOptions): Marked {
  const markdownParser = new Marked()

  markdownParser.setOptions({
    breaks: true,
  })

  markdownParser.use({ renderer })
  markdownParser.use(markedComponent(() => getOptions().components ?? getBuiltInRegistry()))
  markdownParser.use(markedMarkup())
  markdownParser.use(markedToc())
  markdownParser.use(markedSlider())
  markdownParser.use(markedAlert({}))
  markdownParser.use(MDKatex({ nonStandard: true }, true))
  markdownParser.use(markedFootnotes())
  markdownParser.use(markedMermaid(() => ({
    themeMode: getOptions().themeMode,
    diagramMessages: getOptions().diagramMessages,
  })))
  markdownParser.use(markedPlantUML({
    inlineSvg: true,
    getDiagramMessages: () => getOptions().diagramMessages,
    getThemeMode: () => getOptions().themeMode,
  }))
  markdownParser.use(markedInfographic(() => ({
    themeMode: getOptions().themeMode,
    diagramMessages: getOptions().diagramMessages,
  })))
  markdownParser.use(markedRuby())

  return markdownParser
}

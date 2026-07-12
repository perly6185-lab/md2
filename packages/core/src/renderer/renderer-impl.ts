import type { IOpts, RendererAPI } from '@md/shared/types'
import type { FrontMatterData } from '@md/shared/types/front-matter'
import type { ReadTimeResults } from '@md/shared/utils/readingTime'
import type { RendererObject, Tokens } from 'marked'
import readingTime from '@md/shared/utils/readingTime'
import frontMatter from 'front-matter'
import hljs from 'highlight.js/lib/core'
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
import { escapeHtml } from '../utils/basicHelpers'
import { COMMON_LANGUAGES } from '../utils/languages'
import { renderCodeBlock } from './codeBlocks'
import { createFootnoteRegistry } from './footnotes'

Object.entries(COMMON_LANGUAGES).forEach(([name, lang]) => {
  hljs.registerLanguage(name, lang)
})

export { hljs }

const UNDERSCORE_REGEX = /_/g
const HEADING_TAG_REGEX = /^h\d$/
const PARAGRAPH_WRAPPER_REGEX = /^<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/
const MP_WEIXIN_LINK_REGEX = /^https?:\/\/mp\.weixin\.qq\.com/

const ADDITION_STYLE = `
    <style>
      .preview-wrapper pre::before {
        position: absolute;
        top: 0;
        right: 0;
        color: #ccc;
        text-align: center;
        font-size: 0.8em;
        padding: 5px 10px 0;
        line-height: 15px;
        height: 15px;
        font-weight: 600;
      }
    </style>
  `

function extractFileName(href: string): string {
  try {
    // 移除查询参数和哈希
    const urlPath = href.split('?')[0].split('#')[0]
    // 获取最后一个 / 之后的部分
    const fileName = urlPath.split('/').pop() || ''
    // 移除文件扩展名
    const nameWithoutExt = fileName.replace(/\.[^.]*$/, '')
    return nameWithoutExt
  }
  catch {
    return ''
  }
}

function transform(legend: string, text: string | null, title: string | null, href: string = ''): string {
  const options = legend.split(`-`)
  for (const option of options) {
    if (option === `alt` && text) {
      return text
    }
    if (option === `title` && title) {
      return title
    }
    if (option === `filename` && href) {
      const fileName = extractFileName(href)
      if (fileName) {
        return escapeHtml(fileName)
      }
    }
  }
  return ``
}

function isStandaloneKatexBlock(html: string): boolean {
  return /^<section class="katex-block"[\s\S]*<\/section>\s*$/.test(html.trim())
}

interface ParseResult {
  yamlData: FrontMatterData
  markdownContent: string
  readingTime: ReadTimeResults
}

function parseFrontMatterAndContent(markdownText: string): ParseResult {
  try {
    const parsed = frontMatter(markdownText)
    const yamlData = parsed.attributes as FrontMatterData
    const markdownContent = parsed.body

    const readingTimeResult = readingTime(markdownContent)

    return {
      yamlData,
      markdownContent,
      readingTime: readingTimeResult,
    }
  }
  catch (error) {
    console.error(`Error parsing front-matter:`, error)
    return {
      yamlData: {},
      markdownContent: markdownText,
      readingTime: readingTime(markdownText),
    }
  }
}

export function initRenderer(opts: IOpts = {}): RendererAPI {
  const footnotes = createFootnoteRegistry()
  const listOrderedStack: boolean[] = []
  const listCounters: number[] = []
  const markdownParser = new Marked()

  markdownParser.setOptions({
    breaks: true,
  })

  function getOpts(): IOpts {
    return opts
  }

  /**
   * 生成带 CSS 类的内容（新主题系统）
   * @param styleLabel CSS 类名标识
   * @param content 内容
   * @param tagName HTML 标签名（可选）
   * @param style 内联样式（可选）
   */
  function styledContent(styleLabel: string, content: string, tagName?: string, style?: string): string {
    const tag = tagName ?? styleLabel
    const className = `${styleLabel.replace(UNDERSCORE_REGEX, `-`)}`
    const headingAttr = HEADING_TAG_REGEX.test(tag) ? ` data-heading="true"` : ``
    const styleAttr = style ? ` style="${style}"` : ``
    return `<${tag} class="${className}"${headingAttr}${styleAttr}>${content}</${tag}>`
  }

  function reset(newOpts: Partial<IOpts>): void {
    footnotes.reset()
    listOrderedStack.length = 0
    listCounters.length = 0
    setOptions(newOpts)
  }

  function setOptions(newOpts: Partial<IOpts>): void {
    opts = { ...opts, ...newOpts }
  }

  function buildReadingTime(readingTime: ReadTimeResults): string {
    if (!opts.countStatus) {
      return ``
    }
    if (!readingTime.words) {
      return ``
    }
    return `
      <blockquote class="md-blockquote">
        <p class="md-blockquote-p">字数 ${readingTime?.words}，阅读大约需 ${Math.ceil(readingTime?.minutes)} 分钟</p>
      </blockquote>
    `
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
      listOrderedStack.push(ordered)
      listCounters.push(Number(start))

      const html = items
        .map(item => this.listitem(item))
        .join(``)

      listOrderedStack.pop()
      listCounters.pop()

      return styledContent(
        ordered ? `ol` : `ul`,
        html,
      )
    },

    // 2. listitem：从栈顶取 ordered + counter，计算 prefix 并自增
    listitem(token: Tokens.ListItem) {
      const ordered = listOrderedStack[listOrderedStack.length - 1]
      const idx = listCounters[listCounters.length - 1]!

      // 准备下一个
      listCounters[listCounters.length - 1] = idx + 1

      const prefix = ordered
        ? `${idx}. `
        : `• `

      // 渲染内容：优先 inline，fallback 去掉 <p> 包裹
      let content: string
      try {
        content = this.parser.parseInline(token.tokens)
      }
      catch {
        content = this.parser
          .parse(token.tokens)
          .replace(PARAGRAPH_WRAPPER_REGEX, `$1`)
      }

      return styledContent(
        `listitem`,
        `${prefix}${content}`,
        `li`,
      )
    },

    image({ href, title, text }: Tokens.Image): string {
      let widthAttr = ``
      let heightAttr = ``
      let altText = text

      const sizeMatch = text.match(/\|(\d+)(?:x(\d+))?$/)
      if (sizeMatch) {
        altText = text.replace(/\|(\d+)(?:x(\d+))?$/, ``)
        widthAttr = sizeMatch[1] ? ` width="${sizeMatch[1]}"` : ``
        heightAttr = sizeMatch[2] ? ` height="${sizeMatch[2]}"` : ``
      }

      const newText = opts.legend ? transform(opts.legend, altText, title, href) : ``
      const subText = newText ? styledContent(`figcaption`, newText) : ``
      const titleAttr = title ? ` title="${title}"` : ``
      return `<figure><img src="${href}"${titleAttr}${widthAttr}${heightAttr} alt="${altText}"/>${subText}</figure>`
    },

    link({ href, title, text, tokens }: Tokens.Link): string {
      const parsedText = this.parser.parseInline(tokens)
      if (MP_WEIXIN_LINK_REGEX.test(href)) {
        return `<a href="${href}" title="${title || text}">${parsedText}</a>`
      }
      if (href === text) {
        return parsedText
      }
      if (opts.citeStatus) {
        const ref = footnotes.add(title || text, href)
        return `<a href="${href}" title="${title || text}">${parsedText}<sup>[${ref}]</sup></a>`
      }
      return `<a href="${href}" title="${title || text}">${parsedText}</a>`
    },

    strong({ tokens }: Tokens.Strong): string {
      return styledContent(`strong`, this.parser.parseInline(tokens))
    },

    em({ tokens }: Tokens.Em): string {
      return styledContent(`em`, this.parser.parseInline(tokens))
    },

    table({ header, rows }: Tokens.Table): string {
      const headerRow = header
        .map((cell) => {
          const text = this.parser.parseInline(cell.tokens)
          return styledContent(`th`, text, undefined, `text-align: ${cell.align || `left`}`)
        })
        .join(``)
      const body = rows
        .map((row) => {
          const rowContent = row
            .map(cell => this.tablecell(cell))
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
    },

    tablecell(token: Tokens.TableCell): string {
      const text = this.parser.parseInline(token.tokens)
      return styledContent(`td`, text, undefined, `text-align: ${token.align || `left`}`)
    },

    hr(token: Tokens.Hr): string {
      const raw = token.raw.trim()
      let variant = `dash`
      if (raw.includes(`*`)) {
        variant = `star`
      }
      else if (raw.includes(`_`)) {
        variant = `underscore`
      }
      return `<hr class="hr hr-${variant}">`
    },
  }

  markdownParser.use({ renderer })
  // 新主题系统：扩展不再需要 styles 参数
  // 通过闭包传入注册表 getter，避免直接依赖全局状态
  markdownParser.use(markedComponent(() => opts.components ?? getBuiltInRegistry()))
  markdownParser.use(markedMarkup())
  markdownParser.use(markedToc())
  markdownParser.use(markedSlider())
  markdownParser.use(markedAlert({}))
  markdownParser.use(MDKatex({ nonStandard: true }, true))
  markdownParser.use(markedFootnotes())
  markdownParser.use(markedMermaid(() => ({
    themeMode: opts.themeMode,
    diagramMessages: opts.diagramMessages,
  })))
  markdownParser.use(markedPlantUML({
    inlineSvg: true, // 启用SVG内嵌，适用于微信公众号
    getDiagramMessages: () => opts.diagramMessages,
    getThemeMode: () => opts.themeMode,
  }))
  markdownParser.use(markedInfographic(() => ({
    themeMode: opts.themeMode,
    diagramMessages: opts.diagramMessages,
  })))
  markdownParser.use(markedRuby())

  return {
    buildAddition: () => ADDITION_STYLE,
    buildFootnotes,
    setOptions,
    reset,
    parseFrontMatterAndContent,
    renderMarkdownToHtml(markdown: string) {
      return markdownParser.parse(markdown) as string
    },
    buildReadingTime,
    createContainer(content: string) {
      return styledContent(`container`, content, `section`)
    },
    getOpts,
  }
}

/// <reference path="../types/prettier.d.ts" />

type FormatDocType = `markdown` | `css` | `javascript`

type PrettierModule = typeof import('prettier/standalone')
type ParserBabelModule = typeof import('prettier/parser-babel')
type ParserMarkdownModule = typeof import('prettier/parser-markdown')
type ParserPostcssModule = typeof import('prettier/parser-postcss')
type FormatParser = `markdown` | `css` | `babel`
type ParserModule = ParserBabelModule | ParserMarkdownModule | ParserPostcssModule

let prettierModule: PrettierModule | null = null
let parserBabelModule: ParserBabelModule | null = null
let parserMarkdownModule: ParserMarkdownModule | null = null
let parserPostcssModule: ParserPostcssModule | null = null

function resolveDefaultExport<T>(module: T): T {
  return (module as { default?: T }).default ?? module
}

async function loadPrettierModule() {
  if (!prettierModule) {
    prettierModule = resolveDefaultExport(await import(`prettier/standalone`))
  }

  return prettierModule
}

async function loadParserBabel() {
  if (!parserBabelModule) {
    parserBabelModule = await import(`prettier/parser-babel`)
  }

  return parserBabelModule
}

async function loadParserMarkdown() {
  if (!parserMarkdownModule) {
    parserMarkdownModule = await import(`prettier/parser-markdown`)
  }

  return parserMarkdownModule
}

async function loadParserPostcss() {
  if (!parserPostcssModule) {
    parserPostcssModule = await import(`prettier/parser-postcss`)
  }

  return parserPostcssModule
}

function resolveParserPlugin(module: ParserModule) {
  return (module as { default?: unknown }).default ?? module
}

async function resolveFormatDependencies(type: FormatDocType): Promise<{
  prettier: PrettierModule
  parser: FormatParser
  plugins: unknown[]
}> {
  if (type === `css`) {
    const [prettier, parserPostcss] = await Promise.all([
      loadPrettierModule(),
      loadParserPostcss(),
    ])

    return {
      prettier,
      parser: `css`,
      plugins: [resolveParserPlugin(parserPostcss)],
    }
  }

  if (type === `javascript`) {
    const [prettier, parserBabel] = await Promise.all([
      loadPrettierModule(),
      loadParserBabel(),
    ])

    return {
      prettier,
      parser: `babel`,
      plugins: [resolveParserPlugin(parserBabel)],
    }
  }

  const [prettier, parserMarkdown, parserBabel] = await Promise.all([
    loadPrettierModule(),
    loadParserMarkdown(),
    loadParserBabel(),
  ])

  return {
    prettier,
    parser: `markdown`,
    plugins: [resolveParserPlugin(parserMarkdown), resolveParserPlugin(parserBabel)],
  }
}

/**
 * 格式化文档内容
 * @param content - 要格式化的内容
 * @param type - 内容类型，决定使用的解析器，默认为 'markdown'
 * @returns 格式化后的内容
 */
export async function formatDoc(content: string, type: FormatDocType = `markdown`): Promise<string> {
  const { prettier, parser, plugins } = await resolveFormatDependencies(type)

  return await prettier.format(content, {
    parser,
    plugins,
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    quoteProps: `as-needed`,
    trailingComma: `es5`,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: `avoid`,
    proseWrap: `preserve`,
    htmlWhitespaceSensitivity: `css`,
    endOfLine: `lf`,
  })
}

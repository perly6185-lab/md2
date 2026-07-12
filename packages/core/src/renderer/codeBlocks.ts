import type { HLJSApi } from 'highlight.js'
import { escapeHtml } from '../utils/basicHelpers'
import { highlightAndFormatCode } from '../utils/languages'

const DOUBLE_QUOTE_REGEX = /"/g

const macCodeSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="45px" height="13px" viewBox="0 0 450 130">
    <ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)" />
    <ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)" />
    <ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)" />
  </svg>
`.trim()

const macCodeSign = `<span class="mac-sign" style="padding: 10px 14px 0;">${macCodeSvg}</span>`

interface RenderCodeBlockOptions {
  hljs: HLJSApi
  lang?: string
  showLineNumber?: boolean
  text: string
}

function buildPendingLanguageAttr(
  hljs: HLJSApi,
  langText: string,
  text: string,
  showLineNumber: boolean | undefined,
): string {
  if (hljs.getLanguage(langText) || langText === `plaintext`)
    return ``

  const escapedText = text.replace(DOUBLE_QUOTE_REGEX, `&quot;`)
  return ` data-language-pending="${langText}" data-raw-code="${escapedText}" data-show-line-number="${showLineNumber}"`
}

/**
 * 渲染 diff-{lang} 代码块。
 * 以 `+` 开头的行显示绿色底色（新增），`-` 开头的行显示红色底色（删除），
 * 其余行正常高亮显示。
 */
function renderDiffCode(hljs: HLJSApi, text: string, baseLang: string): string {
  const isLangRegistered = hljs.getLanguage(baseLang)
  const lang = isLangRegistered ? baseLang : `plaintext`

  const lines = text.split(`\n`)
  const prefixes = lines.map(line => line[0])
  // 将每行去掉前缀（+/-/ ）后拼接，整体高亮一次以避免逐行调用 hljs
  const strippedLines = lines.map((line, i) => {
    const p = prefixes[i]
    return (p === `+` || p === `-`) ? line.slice(1) : line
  })
  const highlightedLines = isLangRegistered
    ? hljs.highlight(strippedLines.join(`\n`), { language: lang }).value.split(`\n`)
    : strippedLines.map(escapeHtml)

  const rendered = lines
    .map((_, i) => {
      const prefix = prefixes[i]
      const highlighted = highlightedLines[i] ?? ``
      let bg: string
      let sign: string

      if (prefix === `+`) {
        bg = `background:rgba(80,200,80,.18);`
        sign = `<span style="color:#52c41a;user-select:none;">+</span>`
      }
      else if (prefix === `-`) {
        bg = `background:rgba(255,80,80,.18);`
        sign = `<span style="color:#ff4d4f;user-select:none;">-</span>`
      }
      else {
        bg = ``
        sign = `<span style="user-select:none;"> </span>`
      }

      return `<span style="display:block;${bg}">${sign}${highlighted}</span>`
    })
    .join(``)

  return `<pre class="hljs code__pre">${macCodeSign}<code class="language-diff-${baseLang}">${rendered}</code></pre>`
}

export function renderCodeBlock({
  hljs,
  lang = ``,
  showLineNumber,
  text,
}: RenderCodeBlockOptions): string {
  const langText = lang.split(` `)[0]

  if (langText.startsWith(`diff-`))
    return renderDiffCode(hljs, text, langText.slice(5))

  const isLanguageRegistered = hljs.getLanguage(langText)
  const language = isLanguageRegistered ? langText : `plaintext`

  const highlighted = highlightAndFormatCode(text, language, hljs, !!showLineNumber)
  const pendingAttr = buildPendingLanguageAttr(hljs, langText, text, showLineNumber)
  const code = `<code class="language-${lang}"${pendingAttr}>${highlighted}</code>`

  return `<pre class="hljs code__pre">${macCodeSign}${code}</pre>`
}

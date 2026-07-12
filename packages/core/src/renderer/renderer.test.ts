import { describe, expect, it } from 'vitest'
import { postProcessHtml, renderMarkdown } from '../utils/markdownHelpers'
import { initRenderer } from './renderer-impl'

describe('initRenderer', () => {
  it('renders headings and paragraphs', () => {
    const renderer = initRenderer({})
    const { html } = renderMarkdown(`# Hello\n\nWorld`, renderer)

    expect(html).toContain(`<h1`)
    expect(html).toContain(`Hello`)
    expect(html).toContain(`World`)
  })

  it('strips script tags during sanitization', () => {
    const renderer = initRenderer({})
    const { html } = renderMarkdown(`<script>alert(1)</script>\n\nSafe text`, renderer)

    expect(html).not.toContain(`<script>`)
    expect(html).toContain(`Safe text`)
  })

  it('renders GFM alert blocks', () => {
    const renderer = initRenderer({})
    const { html } = renderMarkdown(`> [!NOTE]\n> Alert body`, renderer)

    expect(html).toContain(`markdown-alert`)
    expect(html).toContain(`Alert body`)
  })

  it('parses YAML front matter', () => {
    const renderer = initRenderer({})
    const { markdownContent, readingTime } = renderer.parseFrontMatterAndContent(
      `---\ntitle: Test\n---\n\n# Body`,
    )

    expect(markdownContent.trim()).toBe(`# Body`)
    expect(readingTime.words).toBeGreaterThan(0)
  })

  it('includes reading time stats in postProcessHtml output', () => {
    const renderer = initRenderer({ countStatus: true, isMacCodeBlock: false })
    const { html, readingTime } = renderMarkdown(`# Hi`, renderer)
    const output = postProcessHtml(html, readingTime, renderer)

    expect(output).toContain(`字数`)
    expect(output).toContain(`Hi`)
  })

  it('renders image dimensions and alt legend', () => {
    const renderer = initRenderer({ legend: `alt` })
    const { html } = renderMarkdown(
      `![Diagram|320x180](https://example.com/assets/flow.png "Flow title")`,
      renderer,
    )

    expect(html).toContain(`<figure>`)
    expect(html).toContain(`width="320"`)
    expect(html).toContain(`height="180"`)
    expect(html).toContain(`alt="Diagram"`)
    expect(html).toContain(`<figcaption class="figcaption">Diagram</figcaption>`)
  })

  it('renders filename image legend without extension or URL suffixes', () => {
    const renderer = initRenderer({ legend: `filename` })
    const { html } = renderMarkdown(
      `![Alt](https://cdn.example.com/path/flow-chart.png?x=1#top)`,
      renderer,
    )

    expect(html).toContain(`<figcaption class="figcaption">flow-chart</figcaption>`)
  })

  it('renders cited links as reusable footnote references', () => {
    const renderer = initRenderer({ citeStatus: true })
    const { html, readingTime } = renderMarkdown(
      `[Doocs](https://doocs.org "Doocs Site") and [Again](https://doocs.org)`,
      renderer,
    )
    const output = postProcessHtml(html, readingTime, renderer)

    expect(html.match(/<sup>\[1\]<\/sup>/g)).toHaveLength(2)
    expect(output).toContain(`引用链接`)
    expect(output).toContain(`Doocs Site`)
    expect(output).toContain(`https://doocs.org`)
  })

  it('does not convert WeChat article links into citations', () => {
    const renderer = initRenderer({ citeStatus: true })
    const { html, readingTime } = renderMarkdown(
      `[Article](https://mp.weixin.qq.com/s/example)`,
      renderer,
    )
    const output = postProcessHtml(html, readingTime, renderer)

    expect(html).toContain(`<a href="https://mp.weixin.qq.com/s/example"`)
    expect(html).not.toContain(`<sup>`)
    expect(output).not.toContain(`引用链接`)
  })

  it('renders aligned tables with the preview table wrapper', () => {
    const renderer = initRenderer({})
    const { html } = renderMarkdown(
      `| Name | Count | Note |\n| :--- | ---: | :---: |\n| Alpha | 2 | ok |`,
      renderer,
    )

    expect(html).toContain(`class="preview-table"`)
    expect(html).toContain(`class="th" style="text-align: left">Name`)
    expect(html).toContain(`class="th" style="text-align: right">Count`)
    expect(html).toContain(`class="th" style="text-align: center">Note`)
    expect(html).toContain(`class="td" style="text-align: right">2`)
  })

  it('renders horizontal rule variants from source markers', () => {
    const renderer = initRenderer({})

    expect(renderMarkdown(`---`, renderer).html).toContain(`class="hr hr-dash"`)
    expect(renderMarkdown(`***`, renderer).html).toContain(`class="hr hr-star"`)
    expect(renderMarkdown(`___`, renderer).html).toContain(`class="hr hr-underscore"`)
  })

  it('renders single-line block formula as katex-block without paragraph wrapper', () => {
    const renderer = initRenderer({})
    const formula = `$$ITE_{i}=Y_{i,1}-Y_{i,0} \\tag{1}$$`
    const { html } = renderMarkdown(formula, renderer)

    expect(html).toContain(`katex-block`)
    expect(html).toContain(`data-math-raw`)
    expect(html).not.toMatch(/<p[^>]*>\s*<section class="katex-block"/)
  })

  it('renders list item followed by single-line block formula without paragraph wrapper', () => {
    const renderer = initRenderer({})
    const userMd = `1.比如识别段落之间带有编号的latex公式，如 

$$ITE_{i}=Y_{i,1}-Y_{i,0} \\tag{1}$$`
    const { html } = renderMarkdown(userMd, renderer)

    expect(html).toContain(`data-math-raw`)
    expect(html).toContain(`\\tag{1}`)
    expect(html).not.toMatch(/<p[^>]*>\s*<section class="katex-block"/)
  })
})

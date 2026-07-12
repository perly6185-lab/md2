/**
 * Verify bundled previewRenderer.js can render HTML in Node.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { buildPreviewHtml } = require(path.join(__dirname, `..`, `dist`, `previewRenderer.js`))

const html = buildPreviewHtml({
  markdown: `# Test\n\n[link](https://example.com)\n\n\`\`\`js\nconsole.log('ok')\n\`\`\``,
  primaryColor: `#0F4C81`,
  fontFamily: `sans-serif`,
  fontSize: `16px`,
  theme: `default`,
  countStatus: true,
  isMacCodeBlock: true,
  citeStatus: true,
})

const checks = [
  [`heading`, html.includes(`Test`)],
  [`citation link`, html.includes(`example.com`) && html.includes(`<sup>[`)],
  [`reading stats`, /阅读|分钟|字/.test(html)],
  [`mac code block`, html.includes(`.mac-sign`) && html.includes(`hljs`)],
  [`theme css`, html.includes(`--md-primary-color`) && html.includes(`#0F4C81`)],
]

for (const [label, passed] of checks) {
  if (!passed) {
    throw new Error(`previewRenderer output missing expected ${label}`)
  }
}

console.log(`✓ previewRenderer.js renders HTML in Node`)

import { Marked } from 'marked'
import { describe, expect, it } from 'vitest'
import { markedPlantUML } from './plantuml'

function renderPlantUML(themeMode: `light` | `dark`) {
  const parser = new Marked()
  parser.use(markedPlantUML({
    inlineSvg: false,
    getThemeMode: () => themeMode,
  }))

  return parser.parse(`\`\`\`plantuml
Alice -> Bob
\`\`\``) as string
}

describe(`markedPlantUML`, () => {
  it(`includes theme mode in generated diagram output`, () => {
    const light = renderPlantUML(`light`)
    const dark = renderPlantUML(`dark`)

    expect(light).toContain(`plantuml-diagram`)
    expect(dark).toContain(`plantuml-diagram`)
    expect(dark).not.toBe(light)
  })
})

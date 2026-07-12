import type { Tokens } from 'marked'

export function renderHorizontalRule(token: Tokens.Hr): string {
  const raw = token.raw.trim()
  let variant = `dash`
  if (raw.includes(`*`))
    variant = `star`
  else if (raw.includes(`_`))
    variant = `underscore`

  return `<hr class="hr hr-${variant}">`
}

const UNDERSCORE_REGEX = /_/g
const HEADING_TAG_REGEX = /^h\d$/

export type StyledContent = (styleLabel: string, content: string, tagName?: string, style?: string) => string

export const styledContent: StyledContent = (styleLabel, content, tagName, style) => {
  const tag = tagName ?? styleLabel
  const className = `${styleLabel.replace(UNDERSCORE_REGEX, `-`)}`
  const headingAttr = HEADING_TAG_REGEX.test(tag) ? ` data-heading="true"` : ``
  const styleAttr = style ? ` style="${style}"` : ``
  return `<${tag} class="${className}"${headingAttr}${styleAttr}>${content}</${tag}>`
}

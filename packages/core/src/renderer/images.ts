import type { StyledContent } from './html'
import { escapeHtml } from '../utils/basicHelpers'

const IMAGE_SIZE_SUFFIX_REGEX = /\|(\d+)(?:x(\d+))?$/

interface RenderImageOptions {
  href: string
  legend?: string
  styledContent: StyledContent
  text: string
  title: string | null
}

function extractFileName(href: string): string {
  try {
    const urlPath = href.split(`?`)[0].split(`#`)[0]
    const fileName = urlPath.split(`/`).pop() || ``
    return fileName.replace(/\.[^.]*$/, ``)
  }
  catch {
    return ``
  }
}

function resolveLegendText(legend: string, text: string | null, title: string | null, href: string = ``): string {
  const options = legend.split(`-`)
  for (const option of options) {
    if (option === `alt` && text)
      return text

    if (option === `title` && title)
      return title

    if (option === `filename` && href) {
      const fileName = extractFileName(href)
      if (fileName)
        return escapeHtml(fileName)
    }
  }
  return ``
}

export function renderImage({
  href,
  legend,
  styledContent,
  text,
  title,
}: RenderImageOptions): string {
  let widthAttr = ``
  let heightAttr = ``
  let altText = text

  const sizeMatch = text.match(IMAGE_SIZE_SUFFIX_REGEX)
  if (sizeMatch) {
    altText = text.replace(IMAGE_SIZE_SUFFIX_REGEX, ``)
    widthAttr = sizeMatch[1] ? ` width="${sizeMatch[1]}"` : ``
    heightAttr = sizeMatch[2] ? ` height="${sizeMatch[2]}"` : ``
  }

  const legendText = legend ? resolveLegendText(legend, altText, title, href) : ``
  const subText = legendText ? styledContent(`figcaption`, legendText) : ``
  const titleAttr = title ? ` title="${title}"` : ``
  return `<figure><img src="${href}"${titleAttr}${widthAttr}${heightAttr} alt="${altText}"/>${subText}</figure>`
}

interface LinkFootnotes {
  add: (title: string, link: string) => number
}

interface RenderLinkOptions {
  citeStatus?: boolean
  footnotes: LinkFootnotes
  href: string
  parsedText: string
  text: string
  title: string | null | undefined
}

const MP_WEIXIN_LINK_REGEX = /^https?:\/\/mp\.weixin\.qq\.com/

export function renderLink({
  citeStatus,
  footnotes,
  href,
  parsedText,
  text,
  title,
}: RenderLinkOptions): string {
  const displayTitle = title || text

  if (MP_WEIXIN_LINK_REGEX.test(href))
    return `<a href="${href}" title="${displayTitle}">${parsedText}</a>`

  if (href === text)
    return parsedText

  if (citeStatus) {
    const ref = footnotes.add(displayTitle, href)
    return `<a href="${href}" title="${displayTitle}">${parsedText}<sup>[${ref}]</sup></a>`
  }

  return `<a href="${href}" title="${displayTitle}">${parsedText}</a>`
}

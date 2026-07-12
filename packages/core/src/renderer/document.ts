import type { FrontMatterData } from '@md/shared/types/front-matter'
import type { ReadTimeResults } from '@md/shared/utils/readingTime'
import readingTime from '@md/shared/utils/readingTime'
import frontMatter from 'front-matter'

export interface ParseResult {
  yamlData: FrontMatterData
  markdownContent: string
  readingTime: ReadTimeResults
}

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

export function parseFrontMatterAndContent(markdownText: string): ParseResult {
  try {
    const parsed = frontMatter(markdownText)
    const yamlData = parsed.attributes as FrontMatterData
    const markdownContent = parsed.body

    return {
      yamlData,
      markdownContent,
      readingTime: readingTime(markdownContent),
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

export function buildReadingTime(readingTime: ReadTimeResults, countStatus?: boolean): string {
  if (!countStatus)
    return ``

  if (!readingTime.words)
    return ``

  return `
      <blockquote class="md-blockquote">
        <p class="md-blockquote-p">字数 ${readingTime?.words}，阅读大约需 ${Math.ceil(readingTime?.minutes)} 分钟</p>
      </blockquote>
    `
}

export function buildAdditionStyle(): string {
  return ADDITION_STYLE
}

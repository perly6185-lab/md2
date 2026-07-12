import hljs from 'highlight.js/lib/core'
import { COMMON_LANGUAGES } from '../utils/languages'

Object.entries(COMMON_LANGUAGES).forEach(([name, lang]) => {
  hljs.registerLanguage(name, lang)
})

export { hljs }

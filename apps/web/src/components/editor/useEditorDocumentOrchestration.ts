import type { Compartment } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import type { Ref, ShallowRef } from 'vue'
import type { Post } from '@/stores/post'
import { replaceDocumentWithoutHistory, resetEditorHistory } from '@md/shared/editor'
import { formatLocalDateTime } from '@/i18n/translate'
import { contentHasMath, loadMathJax, MATHJAX_READY_EVENT } from '@/lib/preview/mathjax'
import { useEditorStore } from '@/stores/editor'

const EDITOR_CHANGE_COMMIT_DELAY_MS = 300
const HISTORY_SNAPSHOT_INTERVAL_MS = 30 * 1000
const MAX_HISTORY_ENTRIES = 10

interface UseEditorDocumentOrchestrationOptions {
  codeMirrorView: ShallowRef<EditorView | null>
  historyCompartment: Compartment
  posts: Ref<Post[]>
  currentPostIndex: Ref<number>
  currentPost: Ref<Post | undefined>
  editorRefresh: () => void
}

export function useEditorDocumentOrchestration({
  codeMirrorView,
  historyCompartment,
  posts,
  currentPostIndex,
  currentPost,
  editorRefresh,
}: UseEditorDocumentOrchestrationOptions) {
  const editorStore = useEditorStore()
  let changeTimer: ReturnType<typeof setTimeout> | undefined
  let historyTimer: ReturnType<typeof setInterval> | undefined
  let postSwitchGeneration = 0
  let started = false

  function handleMathJaxReady() {
    editorRefresh()
  }

  async function preloadMathJaxIfNeeded(content: string) {
    if (!contentHasMath(content))
      return

    try {
      await loadMathJax()
    }
    catch (error) {
      console.error(error)
    }
  }

  function flushEditorContentToPostAtIndex(index: number) {
    clearTimeout(changeTimer)
    changeTimer = undefined
    if (!codeMirrorView.value || index < 0)
      return

    const value = codeMirrorView.value.state.doc.toString()
    const post = posts.value[index]
    if (!post || value === post.content)
      return

    post.updateDatetime = new Date()
    post.content = value
  }

  function commitEditorContentToPost() {
    flushEditorContentToPostAtIndex(currentPostIndex.value)
  }

  function scheduleEditorDocumentCommit() {
    clearTimeout(changeTimer)
    changeTimer = setTimeout(() => {
      changeTimer = undefined
      editorRefresh()
      commitEditorContentToPost()
    }, EDITOR_CHANGE_COMMIT_DELAY_MS)
  }

  function syncEditorToPostContent(content: string) {
    const view = codeMirrorView.value
    if (!view)
      return

    const currentContent = view.state.doc.toString()
    if (currentContent === content)
      return

    const generation = ++postSwitchGeneration
    replaceDocumentWithoutHistory(view, content)
    resetEditorHistory(view, historyCompartment)
    void preloadMathJaxIfNeeded(content).then(() => {
      if (generation !== postSwitchGeneration)
        return
      editorRefresh()
    })
  }

  watch(currentPostIndex, (newIndex, oldIndex) => {
    if (oldIndex !== undefined && oldIndex >= 0)
      flushEditorContentToPostAtIndex(oldIndex)

    const post = posts.value[newIndex]
    if (!post)
      return
    syncEditorToPostContent(post.content)
  })

  watch(
    () => currentPost.value?.content,
    (content) => {
      if (content == null)
        return
      syncEditorToPostContent(content)
    },
  )

  function startDocumentOrchestration() {
    if (started)
      return

    started = true
    window.addEventListener(MATHJAX_READY_EVENT, handleMathJaxReady)
    editorStore.registerContentFlush(commitEditorContentToPost)

    historyTimer = setInterval(() => {
      const post = posts.value[currentPostIndex.value]
      if (!post)
        return

      const previous = (post.history || [])[0]?.content
      if (previous === post.content)
        return

      post.history ??= []
      post.history.unshift({
        content: post.content,
        datetime: formatLocalDateTime(),
      })

      post.history.length = Math.min(post.history.length, MAX_HISTORY_ENTRIES)
    }, HISTORY_SNAPSHOT_INTERVAL_MS)
  }

  function stopDocumentOrchestration() {
    if (!started)
      return

    started = false
    editorStore.unregisterContentFlush()
    window.removeEventListener(MATHJAX_READY_EVENT, handleMathJaxReady)
    clearTimeout(changeTimer)
    clearInterval(historyTimer)
    changeTimer = undefined
    historyTimer = undefined
  }

  onUnmounted(() => {
    stopDocumentOrchestration()
  })

  return {
    commitEditorContentToPost,
    preloadMathJaxIfNeeded,
    scheduleEditorDocumentCommit,
    startDocumentOrchestration,
    syncEditorToPostContent,
  }
}

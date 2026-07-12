import type { Ref } from 'vue'
import type { ResizablePanel } from '@/components/ui/resizable'

type ViewMode = 'edit' | 'split' | 'preview'
type ResizablePanelInstance = InstanceType<typeof ResizablePanel>

interface UseEditorPanelResizingOptions {
  isMobile: Ref<boolean>
  isOpenPostSlider: Ref<boolean>
  isOpenRightSlider: Ref<boolean>
  isShowCssEditor: Ref<boolean>
  viewMode: Ref<ViewMode>
}

export function useEditorPanelResizing({
  isMobile,
  isOpenPostSlider,
  isOpenRightSlider,
  isShowCssEditor,
  viewMode,
}: UseEditorPanelResizingOptions) {
  const editorResizablePanelRef = ref<ResizablePanelInstance | null>(null)
  const previewResizablePanelRef = ref<ResizablePanelInstance | null>(null)
  const postSliderPanelRef = ref<ResizablePanelInstance | null>(null)
  const cssEditorPanelRef = ref<ResizablePanelInstance | null>(null)
  const rightSliderPanelRef = ref<ResizablePanelInstance | null>(null)

  const hasSidePanel = computed(() => !isMobile.value && (isOpenRightSlider.value || isShowCssEditor.value))

  const editorPanelConfig = computed(() => {
    const mode = viewMode.value
    if (mode === `preview`)
      return { min: 0, max: 0 }
    if (mode === `edit`)
      return hasSidePanel.value ? { min: 30, max: 85 } : { min: 100, max: 100 }
    if (isMobile.value)
      return { min: 30, max: 70 }
    return { min: 15, max: 85 }
  })

  const previewPanelConfig = computed(() => {
    const mode = viewMode.value
    if (mode === `edit`)
      return { min: 0, max: 0 }
    if (mode === `preview`)
      return hasSidePanel.value ? { min: 20, max: 75 } : { min: 100, max: 100 }
    if (isMobile.value)
      return { min: 30, max: 70 }
    return { min: 15, max: 85 }
  })

  function redistributePanelSizes() {
    const cssTarget = !isMobile.value && isShowCssEditor.value ? 25 : 0
    const rightTarget = !isMobile.value && isOpenRightSlider.value ? 30 : 0
    const contentSpace = 100 - cssTarget - rightTarget

    const mode = viewMode.value
    if (mode === `edit`) {
      editorResizablePanelRef.value?.resize(contentSpace)
      previewResizablePanelRef.value?.resize(0)
    }
    else if (mode === `preview`) {
      editorResizablePanelRef.value?.resize(0)
      previewResizablePanelRef.value?.resize(contentSpace)
    }
    else {
      const half = contentSpace / 2
      editorResizablePanelRef.value?.resize(half)
      previewResizablePanelRef.value?.resize(half)
    }

    cssEditorPanelRef.value?.resize(cssTarget)
    rightSliderPanelRef.value?.resize(rightTarget)
  }

  watch(viewMode, () => {
    nextTick(redistributePanelSizes)
  })

  watch(isShowCssEditor, () => {
    nextTick(redistributePanelSizes)
  })

  watch(isOpenRightSlider, () => {
    nextTick(redistributePanelSizes)
  })

  watch(isOpenPostSlider, (open) => {
    if (isMobile.value)
      return
    nextTick(() => {
      postSliderPanelRef.value?.resize(open ? 20 : 0)
    })
  })

  watch(isMobile, (mobile) => {
    if (mobile)
      postSliderPanelRef.value?.resize(0)
    else if (isOpenPostSlider.value)
      nextTick(() => postSliderPanelRef.value?.resize(20))
  })

  onMounted(() => {
    nextTick(() => {
      redistributePanelSizes()
      if (!isMobile.value && isOpenPostSlider.value)
        postSliderPanelRef.value?.resize(20)
    })
  })

  return {
    cssEditorPanelRef,
    editorPanelConfig,
    editorResizablePanelRef,
    postSliderPanelRef,
    previewPanelConfig,
    previewResizablePanelRef,
    rightSliderPanelRef,
  }
}

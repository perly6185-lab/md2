import type { ComponentPublicInstance, Ref } from 'vue'
import type { ResizablePanel } from '@/components/ui/resizable'

export type ResizablePanelTemplateRef = InstanceType<typeof ResizablePanel> | null

export function createResizablePanelRefSetter(target: Ref<ResizablePanelTemplateRef>) {
  return (panel: Element | ComponentPublicInstance | null) => {
    target.value = panel as ResizablePanelTemplateRef
  }
}

export function useCopyFeedbackState(resetDelayMs = 800) {
  const backLight = ref(false)
  const isCoping = ref(false)
  let copyEndTimer: ReturnType<typeof setTimeout> | null = null

  function startCopy() {
    backLight.value = true
    isCoping.value = true
  }

  function endCopy() {
    backLight.value = false
    if (copyEndTimer)
      clearTimeout(copyEndTimer)

    copyEndTimer = setTimeout(() => {
      isCoping.value = false
      copyEndTimer = null
    }, resetDelayMs)
  }

  onUnmounted(() => {
    if (copyEndTimer) {
      clearTimeout(copyEndTimer)
      copyEndTimer = null
    }
  })

  return {
    backLight,
    isCoping,
    startCopy,
    endCopy,
  }
}

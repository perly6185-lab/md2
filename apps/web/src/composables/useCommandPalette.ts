import type { EditorView } from '@codemirror/view'
import { ctrlSign, shiftSign } from '@md/shared/configs'
import { buildCommandPaletteCommands } from '@/composables/commandPaletteCommands'
import { useEditorDocumentActions } from '@/composables/useEditorDocumentActions'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'

export type { PaletteCommand } from '@/composables/commandPaletteCommands'

export function useCommandPalette() {
  const uiStore = useUIStore()
  const editorStore = useEditorStore()
  const { formatContent } = useEditorDocumentActions()

  function withEditor(run: (view: EditorView) => void | Promise<void>) {
    const view = editorStore.editor ? toRaw(editorStore.editor) as EditorView : null
    if (!view)
      return
    void run(view)
  }

  function buildCommands() {
    return buildCommandPaletteCommands({
      uiStore,
      editorStore,
      formatContent,
      withEditor,
    })
  }

  const paletteShortcutLabel = `${ctrlSign} ${shiftSign} P`

  return {
    buildCommands,
    paletteShortcutLabel,
  }
}

import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { useRef } from 'react'
import type { AppState as ExcalidrawAppState, BinaryFiles } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { NoteId } from '@/features/notes/domain/note'
import type { ExcalidrawScene } from '@/shared/domain/excalidraw-scene'
import type { JsonArray, JsonObject } from '@/shared/domain/json'

export type CanvasEditorProps = {
  readonly noteId: NoteId
  readonly scene: ExcalidrawScene
  readonly onChange: (scene: ExcalidrawScene) => void
}

const pickAppState = (appState: ExcalidrawAppState): JsonObject => ({
  viewBackgroundColor: appState.viewBackgroundColor,
  currentItemStrokeColor: appState.currentItemStrokeColor,
  currentItemBackgroundColor: appState.currentItemBackgroundColor,
  currentItemFillStyle: appState.currentItemFillStyle,
  currentItemStrokeWidth: appState.currentItemStrokeWidth,
  currentItemRoughness: appState.currentItemRoughness,
  gridSize: appState.gridSize,
  theme: appState.theme,
})

export function CanvasEditor({ noteId, scene, onChange }: CanvasEditorProps) {
  const lastSceneRef = useRef(JSON.stringify(scene))

  return (
    <div className="min-h-[420px] overflow-hidden rounded-[calc(var(--radius)-6px)] border border-[var(--border)] bg-white" style={{ height: 'min(640px, calc(100vh - 250px))' }}>
      <Excalidraw
        key={noteId}
        initialData={{
          elements: [...scene.elements] as unknown as readonly ExcalidrawElement[],
          appState: { ...scene.appState } as Partial<ExcalidrawAppState>,
          files: { ...scene.files } as unknown as BinaryFiles,
        }}
        onChange={(elements, appState, files) => {
          const nextScene: ExcalidrawScene = {
            elements: elements as unknown as JsonArray,
            appState: pickAppState(appState),
            files: files as unknown as JsonObject,
          }
          const serializedScene = JSON.stringify(nextScene)

          if (serializedScene !== lastSceneRef.current) {
            lastSceneRef.current = serializedScene
            onChange(nextScene)
          }
        }}
      />
    </div>
  )
}

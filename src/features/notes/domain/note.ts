import type { FolderId, TagId } from '@/features/workspace/domain/workspace'
import type { ExcalidrawScene } from '@/shared/domain/excalidraw-scene'
import { createEmptyExcalidrawScene } from '@/shared/domain/excalidraw-scene'
import type { EntityId, ISODateString } from '@/shared/domain/primitives'
import { createEntityId, nowIso, sanitizeTitle } from '@/shared/domain/primitives'

export type NoteId = EntityId<'NoteId'>

export type Note = {
  readonly id: NoteId
  readonly title: string
  readonly contentMarkdown: string
  readonly excalidraw: ExcalidrawScene
  readonly folderId: FolderId | null
  readonly tagIds: readonly TagId[]
  readonly createdAt: ISODateString
  readonly updatedAt: ISODateString
  readonly archived: boolean
}

export type NotePatch = Partial<
  Pick<Note, 'title' | 'contentMarkdown' | 'excalidraw' | 'folderId' | 'tagIds' | 'archived'>
>

export const createNote = (input: {
  readonly title: string
  readonly folderId: FolderId | null
  readonly tagIds?: readonly TagId[]
  readonly contentMarkdown?: string
}): Note => {
  const timestamp = nowIso()

  return {
    id: createEntityId<NoteId>('note'),
    title: sanitizeTitle(input.title, 'Untitled note'),
    contentMarkdown: input.contentMarkdown ?? '',
    excalidraw: createEmptyExcalidrawScene(),
    folderId: input.folderId,
    tagIds: input.tagIds ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    archived: false,
  }
}

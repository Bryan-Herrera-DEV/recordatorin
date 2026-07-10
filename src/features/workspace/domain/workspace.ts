import type { EntityId, ISODateString } from '@/shared/domain/primitives'
import { createEntityId, nowIso, normalizeTagLabel, sanitizeTitle } from '@/shared/domain/primitives'

export type FolderId = EntityId<'FolderId'>
export type TagId = EntityId<'TagId'>

export type Folder = {
  readonly id: FolderId
  readonly name: string
  readonly color: string
  readonly createdAt: ISODateString
}

export type Tag = {
  readonly id: TagId
  readonly label: string
  readonly color: string
  readonly createdAt: ISODateString
}

export const createFolder = (name: string, color = '#f7a8d8'): Folder => ({
  id: createEntityId<FolderId>('folder'),
  name: sanitizeTitle(name, 'Untitled folder'),
  color,
  createdAt: nowIso(),
})

export const createTag = (label: string, color = '#ffffff'): Tag => ({
  id: createEntityId<TagId>('tag'),
  label: normalizeTagLabel(label) || 'tag',
  color,
  createdAt: nowIso(),
})

import { lazy, Suspense, useDeferredValue, useEffect, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { FolderId, TagId } from '@/features/workspace/domain/workspace'
import type { Note } from '@/features/notes/domain/note'
import { useAppStore } from '@/app/store/app-store'
import { normalizeSearchText } from '@/shared/domain/primitives'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

const MarkdownEditor = lazy(async () => {
  const module = await import('./components/MarkdownEditor')
  return { default: module.MarkdownEditor }
})

const CanvasEditor = lazy(async () => {
  const module = await import('./components/CanvasEditor')
  return { default: module.CanvasEditor }
})

type EditorTab = 'markdown' | 'canvas'

const formatDate = (value: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

const matchesNote = (note: Note, input: {
  readonly text: string
  readonly folderId: FolderId | 'all'
  readonly tagId: TagId | 'all'
  readonly dateFrom: string
  readonly dateTo: string
}): boolean => {
  const haystack = normalizeSearchText(`${note.title} ${note.contentMarkdown}`)
  const textMatches = input.text.length === 0 || haystack.includes(normalizeSearchText(input.text))
  const folderMatches = input.folderId === 'all' || note.folderId === input.folderId
  const tagMatches = input.tagId === 'all' || note.tagIds.includes(input.tagId)
  const updatedAt = new Date(note.updatedAt).getTime()
  const fromMatches = input.dateFrom.length === 0 || updatedAt >= new Date(input.dateFrom).getTime()
  const toMatches = input.dateTo.length === 0 || updatedAt <= new Date(input.dateTo).getTime()

  return textMatches && folderMatches && tagMatches && fromMatches && toMatches && !note.archived
}

export function NotesPage() {
  const { i18n, t } = useTranslation()
  const snapshot = useAppStore((state) => state.snapshot)
  const selectedNoteId = useAppStore((state) => state.selectedNoteId)
  const filters = useAppStore((state) => state.noteFilters)
  const setFilters = useAppStore((state) => state.setNoteFilters)
  const setSelectedNoteId = useAppStore((state) => state.setSelectedNoteId)
  const createNote = useAppStore((state) => state.createNote)
  const updateNote = useAppStore((state) => state.updateNote)
  const deleteNote = useAppStore((state) => state.deleteNote)
  const [tab, setTab] = useState<EditorTab>('markdown')
  const deferredText = useDeferredValue(filters.text)

  const filteredNotes = snapshot.notes
    .filter((note) => matchesNote(note, { ...filters, text: deferredText }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const selectedNote = snapshot.notes.find((note) => note.id === selectedNoteId) ?? filteredNotes[0] ?? null

  useEffect(() => {
    if (selectedNote !== null && selectedNote.id !== selectedNoteId) {
      setSelectedNoteId(selectedNote.id)
    }
  }, [selectedNote, selectedNoteId, setSelectedNoteId])

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="flex min-h-0 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('notes')}</h1>
            <p className="text-xs opacity-65">{filteredNotes.length} items</p>
          </div>
          <Button type="button" size="sm" onClick={() => void createNote()}>
            {t('newNote')}
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
          <Input
            className="pl-9"
            placeholder={t('search')}
            value={filters.text}
            onChange={(event) => setFilters({ text: event.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.folderId}
            onChange={(event) => setFilters({ folderId: event.target.value as FolderId | 'all' })}
          >
            <option value="all">{t('allFolders')}</option>
            {snapshot.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <Select value={filters.tagId} onChange={(event) => setFilters({ tagId: event.target.value as TagId | 'all' })}>
            <option value="all">{t('allTags')}</option>
            {snapshot.tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                #{tag.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={filters.dateFrom} onChange={(event) => setFilters({ dateFrom: event.target.value })} />
          <Input type="date" value={filters.dateTo} onChange={(event) => setFilters({ dateTo: event.target.value })} />
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={`note-list-item ${note.id === selectedNote?.id ? 'is-active' : ''}`}
              onClick={() => setSelectedNoteId(note.id)}
            >
              <span className="block truncate font-semibold">{note.title}</span>
              <span className="mt-1 block truncate text-xs opacity-65">{note.contentMarkdown.replace(/[#*_>`-]/g, '').slice(0, 92)}</span>
              <span className="mt-2 block text-[11px] opacity-60">{formatDate(note.updatedAt, i18n.language)}</span>
            </button>
          ))}
        </div>
      </Card>

      {selectedNote === null ? (
        <EmptyState title={t('noNotes')} action={<Button onClick={() => void createNote()}>{t('newNote')}</Button>} />
      ) : (
        <Card className="min-h-0 overflow-hidden p-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-white/30 p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <Input
                    className="h-auto border-none bg-transparent px-0 text-3xl font-bold shadow-none focus:ring-0"
                    value={selectedNote.title}
                    onChange={(event) => void updateNote(selectedNote.id, { title: event.target.value })}
                  />
                  <div className="flex flex-wrap gap-2 text-xs opacity-70">
                    <span>{t('createdAt')}: {formatDate(selectedNote.createdAt, i18n.language)}</span>
                    <span>{t('updatedAt')}: {formatDate(selectedNote.updatedAt, i18n.language)}</span>
                    <span>{t('autosaved')}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant={tab === 'markdown' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('markdown')}>
                    {t('markdown')}
                  </Button>
                  <Button type="button" variant={tab === 'canvas' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('canvas')}>
                    {t('canvas')}
                  </Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => void deleteNote(selectedNote.id)} aria-label={t('delete')}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
                <Select
                  value={selectedNote.folderId ?? 'none'}
                  onChange={(event) =>
                    void updateNote(selectedNote.id, {
                      folderId: event.target.value === 'none' ? null : (event.target.value as FolderId),
                    })
                  }
                >
                  <option value="none">{t('folder')}</option>
                  {snapshot.folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Select>
                <div className="flex flex-wrap gap-2">
                  {snapshot.tags.map((tag) => {
                    const active = selectedNote.tagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tag-toggle ${active ? 'is-active' : ''}`}
                        onClick={() => {
                          const tagIds = active
                            ? selectedNote.tagIds.filter((tagId) => tagId !== tag.id)
                            : [...selectedNote.tagIds, tag.id]
                          void updateNote(selectedNote.id, { tagIds })
                        }}
                      >
                        #{tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <Suspense fallback={<div className="grid h-64 place-items-center opacity-70">{t('loading')}</div>}>
                {tab === 'markdown' ? (
                  <MarkdownEditor
                    value={selectedNote.contentMarkdown}
                    onChange={(contentMarkdown) => void updateNote(selectedNote.id, { contentMarkdown })}
                  />
                ) : (
                  <CanvasEditor
                    noteId={selectedNote.id}
                    scene={selectedNote.excalidraw}
                    onChange={(excalidraw) => void updateNote(selectedNote.id, { excalidraw })}
                  />
                )}
              </Suspense>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

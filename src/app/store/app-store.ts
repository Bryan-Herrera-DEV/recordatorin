import { create } from 'zustand'
import type { NoteId, NotePatch } from '@/features/notes/domain/note'
import { createNote } from '@/features/notes/domain/note'
import type { ReminderId, ReminderPatch } from '@/features/reminders/domain/reminder'
import { createReminder } from '@/features/reminders/domain/reminder'
import type { AppSettings, Locale, ThemeConfig } from '@/features/settings/domain/settings'
import { updateThemeTimestamp } from '@/features/settings/domain/settings'
import type { FolderId, TagId } from '@/features/workspace/domain/workspace'
import { createFolder, createTag } from '@/features/workspace/domain/workspace'
import { applyTheme } from '@/platform/theme/apply-theme'
import { loadSnapshotFromStorage, saveSnapshotToStorage, scheduleReminders } from '@/platform/storage/snapshot-storage'
import { nowIso, sanitizeTitle } from '@/shared/domain/primitives'
import type { AppSnapshot } from '@/shared/domain/snapshot'
import { createInitialSnapshot, ensureSnapshot, touchSnapshot } from '@/shared/domain/snapshot'
import i18n from '@/app/i18n'

type NoteFilters = {
  readonly text: string
  readonly folderId: FolderId | 'all'
  readonly tagId: TagId | 'all'
  readonly dateFrom: string
  readonly dateTo: string
}

type AppStore = {
  readonly hydrated: boolean
  readonly snapshot: AppSnapshot
  readonly selectedNoteId: NoteId | null
  readonly selectedReminderId: ReminderId | null
  readonly noteFilters: NoteFilters
  readonly hydrate: () => Promise<void>
  readonly applyExternalSnapshot: (snapshot: AppSnapshot) => void
  readonly completeOnboarding: (userName: string, locale: Locale) => Promise<void>
  readonly updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  readonly updateTheme: (theme: ThemeConfig) => Promise<void>
  readonly setSelectedNoteId: (id: NoteId | null) => void
  readonly setSelectedReminderId: (id: ReminderId | null) => void
  readonly setNoteFilters: (filters: Partial<NoteFilters>) => void
  readonly addFolder: (name: string) => Promise<void>
  readonly addTag: (label: string) => Promise<void>
  readonly createNote: () => Promise<void>
  readonly updateNote: (id: NoteId, patch: NotePatch) => Promise<void>
  readonly deleteNote: (id: NoteId) => Promise<void>
  readonly createReminder: () => Promise<void>
  readonly updateReminder: (id: ReminderId, patch: ReminderPatch) => Promise<void>
  readonly deleteReminder: (id: ReminderId) => Promise<void>
}

const initialSnapshot = createInitialSnapshot('es')

const persistSnapshot = async (snapshot: AppSnapshot): Promise<void> => {
  applyTheme(snapshot.settings.theme)
  await i18n.changeLanguage(snapshot.settings.locale)
  await saveSnapshotToStorage(snapshot)
  await scheduleReminders(snapshot.reminders, snapshot.settings.sounds)
}

const firstFolderId = (snapshot: AppSnapshot): FolderId | null => snapshot.folders[0]?.id ?? null

export const useAppStore = create<AppStore>((set, get) => ({
  hydrated: false,
  snapshot: initialSnapshot,
  selectedNoteId: initialSnapshot.notes[0]?.id ?? null,
  selectedReminderId: initialSnapshot.reminders[0]?.id ?? null,
  noteFilters: {
    text: '',
    folderId: 'all',
    tagId: 'all',
    dateFrom: '',
    dateTo: '',
  },
  hydrate: async () => {
    const stored = await loadSnapshotFromStorage()
    const snapshot = ensureSnapshot(stored, 'es')
    set({
      hydrated: true,
      snapshot,
      selectedNoteId: snapshot.notes[0]?.id ?? null,
      selectedReminderId: snapshot.reminders[0]?.id ?? null,
    })
    await persistSnapshot(snapshot)
  },
  applyExternalSnapshot: (snapshot: AppSnapshot) => {
    const nextSnapshot = ensureSnapshot(snapshot, get().snapshot.settings.locale)
    set({
      snapshot: nextSnapshot,
      selectedNoteId: nextSnapshot.notes.some((note) => note.id === get().selectedNoteId)
        ? get().selectedNoteId
        : nextSnapshot.notes[0]?.id ?? null,
      selectedReminderId: nextSnapshot.reminders.some((reminder) => reminder.id === get().selectedReminderId)
        ? get().selectedReminderId
        : nextSnapshot.reminders[0]?.id ?? null,
    })
  },
  completeOnboarding: async (userName: string, locale: Locale) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      settings: {
        ...snapshot.settings,
        onboardingCompleted: true,
        userName: sanitizeTitle(userName, 'Friend'),
        locale,
      },
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)
  },
  updateSettings: async (patch: Partial<AppSettings>) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      settings: {
        ...snapshot.settings,
        ...patch,
      },
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)

    if (patch.launchAtLogin !== undefined) {
      await window.recordatorin?.setLaunchAtLogin(patch.launchAtLogin)
    }
  },
  updateTheme: async (theme: ThemeConfig) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      settings: {
        ...snapshot.settings,
        theme: updateThemeTimestamp(theme),
      },
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)
  },
  setSelectedNoteId: (id: NoteId | null) => set({ selectedNoteId: id }),
  setSelectedReminderId: (id: ReminderId | null) => set({ selectedReminderId: id }),
  setNoteFilters: (filters: Partial<NoteFilters>) => {
    set({
      noteFilters: {
        ...get().noteFilters,
        ...filters,
      },
    })
  },
  addFolder: async (name: string) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      folders: [...snapshot.folders, createFolder(name)],
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)
  },
  addTag: async (label: string) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      tags: [...snapshot.tags, createTag(label)],
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)
  },
  createNote: async () => {
    const snapshot = get().snapshot
    const note = createNote({
      title: i18n.t('newNote'),
      folderId: firstFolderId(snapshot),
    })
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      notes: [note, ...snapshot.notes],
    })
    set({ snapshot: nextSnapshot, selectedNoteId: note.id })
    await persistSnapshot(nextSnapshot)
  },
  updateNote: async (id: NoteId, patch: NotePatch) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      notes: snapshot.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...patch,
              updatedAt: nowIso(),
            }
          : note,
      ),
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)
  },
  deleteNote: async (id: NoteId) => {
    const snapshot = get().snapshot
    const notes = snapshot.notes.filter((note) => note.id !== id)
    const nextSnapshot = touchSnapshot({ ...snapshot, notes })
    set({ snapshot: nextSnapshot, selectedNoteId: notes[0]?.id ?? null })
    await persistSnapshot(nextSnapshot)
  },
  createReminder: async () => {
    const snapshot = get().snapshot
    const reminder = createReminder({
      title: i18n.t('newReminder'),
      folderId: firstFolderId(snapshot),
    })
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      reminders: [reminder, ...snapshot.reminders],
    })
    set({ snapshot: nextSnapshot, selectedReminderId: reminder.id })
    await persistSnapshot(nextSnapshot)
  },
  updateReminder: async (id: ReminderId, patch: ReminderPatch) => {
    const snapshot = get().snapshot
    const nextSnapshot = touchSnapshot({
      ...snapshot,
      reminders: snapshot.reminders.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              ...patch,
              updatedAt: nowIso(),
            }
          : reminder,
      ),
    })
    set({ snapshot: nextSnapshot })
    await persistSnapshot(nextSnapshot)
  },
  deleteReminder: async (id: ReminderId) => {
    const snapshot = get().snapshot
    const reminders = snapshot.reminders.filter((reminder) => reminder.id !== id)
    const nextSnapshot = touchSnapshot({ ...snapshot, reminders })
    set({ snapshot: nextSnapshot, selectedReminderId: reminders[0]?.id ?? null })
    await persistSnapshot(nextSnapshot)
  },
}))

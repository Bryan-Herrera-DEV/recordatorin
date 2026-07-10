import { createNote } from '@/features/notes/domain/note'
import type { Note } from '@/features/notes/domain/note'
import { createReminder } from '@/features/reminders/domain/reminder'
import type { Reminder } from '@/features/reminders/domain/reminder'
import { createDefaultSettings } from '@/features/settings/domain/settings'
import type { AppSettings, Locale } from '@/features/settings/domain/settings'
import { createFolder, createTag } from '@/features/workspace/domain/workspace'
import type { Folder, Tag } from '@/features/workspace/domain/workspace'
import { isRecord } from '@/shared/domain/json'
import type { ISODateString } from '@/shared/domain/primitives'
import { nowIso } from '@/shared/domain/primitives'

export type AppSnapshot = {
  readonly version: 1
  readonly settings: AppSettings
  readonly folders: readonly Folder[]
  readonly tags: readonly Tag[]
  readonly notes: readonly Note[]
  readonly reminders: readonly Reminder[]
  readonly updatedAt: ISODateString
}

export const createInitialSnapshot = (locale: Locale = 'es'): AppSnapshot => {
  const personal = createFolder(locale === 'es' ? 'Crecimiento personal' : 'Personal growth', '#f7a8d8')
  const daily = createFolder(locale === 'es' ? 'Vida diaria' : 'Daily life', '#bda7ff')
  const creative = createFolder(locale === 'es' ? 'Espacio creativo' : 'Creative space', '#ffd3a8')
  const motivation = createTag('motivation', '#ffffff')
  const goals = createTag('goals', '#ffffff')
  const welcomeNote = createNote({
    title: locale === 'es' ? 'Persiguiendo sueños' : 'Chasing dreams',
    folderId: personal.id,
    tagIds: [motivation.id, goals.id],
    contentMarkdown:
      locale === 'es'
        ? '# Persiguiendo sueños\n\nEste es tu espacio local para notas, recordatorios y dibujos. Todo se guarda en tu equipo y puedes personalizar cada parte del tema.\n\n- Usa carpetas para agrupar ideas.\n- Usa tags para crear conexiones.\n- Activa recordatorios aleatorios o periódicos cuando quieras volver a una idea.'
        : '# Chasing dreams\n\nThis is your local space for notes, reminders and sketches. Everything is stored on your device and every theme detail is customizable.\n\n- Use folders to group ideas.\n- Use tags to create connections.\n- Enable random or periodic reminders when you want to revisit an idea.',
  })
  const welcomeReminder = createReminder({
    title: locale === 'es' ? 'Respira y revisa una nota' : 'Breathe and revisit a note',
    folderId: daily.id,
    tagIds: [motivation.id],
  })

  return {
    version: 1,
    settings: {
      ...createDefaultSettings(),
      locale,
    },
    folders: [personal, daily, creative],
    tags: [motivation, goals, createTag('gratitude', '#ffffff')],
    notes: [welcomeNote],
    reminders: [
      {
        ...welcomeReminder,
        descriptionMarkdown:
          locale === 'es'
            ? 'Un recordatorio suave para volver a tus ideas importantes.'
            : 'A gentle reminder to return to your important ideas.',
        schedule: {
          type: 'random',
          windowStart: '09:00',
          windowEnd: '18:30',
          timesPerDay: 1,
        },
      },
    ],
    updatedAt: nowIso(),
  }
}

export const touchSnapshot = (snapshot: AppSnapshot): AppSnapshot => ({
  ...snapshot,
  updatedAt: nowIso(),
})

export const isAppSnapshot = (value: unknown): value is AppSnapshot => {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.version === 1 &&
    isRecord(value.settings) &&
    Array.isArray(value.folders) &&
    Array.isArray(value.tags) &&
    Array.isArray(value.notes) &&
    Array.isArray(value.reminders) &&
    typeof value.updatedAt === 'string'
  )
}

export const ensureSnapshot = (snapshot: AppSnapshot | null, locale: Locale = 'es'): AppSnapshot =>
  snapshot ?? createInitialSnapshot(locale)

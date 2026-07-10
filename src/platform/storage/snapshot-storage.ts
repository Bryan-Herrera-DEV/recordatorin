import type { Reminder } from '@/features/reminders/domain/reminder'
import type { SoundSettings } from '@/features/settings/domain/settings'
import type { AppSnapshot } from '@/shared/domain/snapshot'
import { isAppSnapshot } from '@/shared/domain/snapshot'

const fallbackStorageKey = 'recordatorin.snapshot'

export const loadSnapshotFromStorage = async (): Promise<AppSnapshot | null> => {
  if (window.recordatorin) {
    return window.recordatorin.loadSnapshot()
  }

  const raw = window.localStorage.getItem(fallbackStorageKey)
  if (raw === null) {
    return null
  }

  const parsed: unknown = JSON.parse(raw)
  return isAppSnapshot(parsed) ? parsed : null
}

export const saveSnapshotToStorage = async (snapshot: AppSnapshot): Promise<void> => {
  if (window.recordatorin) {
    await window.recordatorin.saveSnapshot(snapshot)
    return
  }

  window.localStorage.setItem(fallbackStorageKey, JSON.stringify(snapshot))
}

export const scheduleReminders = async (
  reminders: readonly Reminder[],
  sounds: SoundSettings,
): Promise<void> => {
  if (window.recordatorin) {
    await window.recordatorin.scheduleReminders(reminders, sounds)
  }
}

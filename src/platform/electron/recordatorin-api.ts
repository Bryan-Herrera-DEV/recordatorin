import type { Reminder } from '@/features/reminders/domain/reminder'
import type { SoundSettings } from '@/features/settings/domain/settings'
import type { AppSnapshot } from '@/shared/domain/snapshot'

export type ReminderTriggeredPayload = {
  readonly reminderId: string
  readonly snapshot: AppSnapshot
}

export type TestNotificationPayload = {
  readonly title: string
  readonly body: string
}

export type RecordatorinApi = {
  readonly loadSnapshot: () => Promise<AppSnapshot | null>
  readonly saveSnapshot: (snapshot: AppSnapshot) => Promise<void>
  readonly scheduleReminders: (
    reminders: readonly Reminder[],
    sounds: SoundSettings,
  ) => Promise<void>
  readonly showTestNotification: (payload: TestNotificationPayload) => Promise<void>
  readonly setLaunchAtLogin: (enabled: boolean) => Promise<void>
  readonly minimizeToTray: () => Promise<void>
  readonly onReminderTriggered: (callback: (payload: ReminderTriggeredPayload) => void) => () => void
  readonly onSnapshotUpdated: (callback: (snapshot: AppSnapshot) => void) => () => void
}

declare global {
  interface Window {
    readonly recordatorin?: RecordatorinApi
  }
}

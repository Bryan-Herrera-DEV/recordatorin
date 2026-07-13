import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { Reminder } from '@/features/reminders/domain/reminder'
import type { SoundSettings } from '@/features/settings/domain/settings'
import type {
  RecordatorinApi,
  ReminderTriggeredPayload,
  TestNotificationPayload,
} from '@/platform/electron/recordatorin-api'
import type { AppSnapshot } from '@/shared/domain/snapshot'

const api: RecordatorinApi = {
  loadSnapshot: () => ipcRenderer.invoke('app:load-snapshot') as Promise<AppSnapshot | null>,
  saveSnapshot: (snapshot: AppSnapshot) => ipcRenderer.invoke('app:save-snapshot', snapshot) as Promise<void>,
  scheduleReminders: (reminders: readonly Reminder[], sounds: SoundSettings) =>
    ipcRenderer.invoke('reminders:schedule', reminders, sounds) as Promise<void>,
  showTestNotification: (payload: TestNotificationPayload) =>
    ipcRenderer.invoke('notifications:test', payload) as Promise<void>,
  setLaunchAtLogin: (enabled: boolean) => ipcRenderer.invoke('app:set-launch-at-login', enabled) as Promise<void>,
  minimizeToTray: () => ipcRenderer.invoke('app:minimize-to-tray') as Promise<void>,
  onReminderTriggered: (callback: (payload: ReminderTriggeredPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: ReminderTriggeredPayload): void => callback(payload)
    ipcRenderer.on('reminders:triggered', listener)
    return () => ipcRenderer.removeListener('reminders:triggered', listener)
  },
  onReminderNotificationClicked: (callback: (payload: ReminderTriggeredPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: ReminderTriggeredPayload): void => callback(payload)
    ipcRenderer.on('reminders:notification-clicked', listener)
    return () => ipcRenderer.removeListener('reminders:notification-clicked', listener)
  },
  onSnapshotUpdated: (callback: (snapshot: AppSnapshot) => void) => {
    const listener = (_event: IpcRendererEvent, snapshot: AppSnapshot): void => callback(snapshot)
    ipcRenderer.on('app:snapshot-updated', listener)
    return () => ipcRenderer.removeListener('app:snapshot-updated', listener)
  },
}

contextBridge.exposeInMainWorld('recordatorin', api)

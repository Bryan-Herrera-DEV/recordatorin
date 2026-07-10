import { join } from 'node:path'
import { app, BrowserWindow, Menu, nativeImage, Notification, Tray, ipcMain } from 'electron'
import type { Reminder } from '@/features/reminders/domain/reminder'
import type { SoundSettings } from '@/features/settings/domain/settings'
import type { TestNotificationPayload } from '@/platform/electron/recordatorin-api'
import type { AppSnapshot } from '@/shared/domain/snapshot'
import { SnapshotRepository } from './storage/sqlite-repository'
import { ReminderScheduler } from './notifications/reminder-scheduler'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let repository: SnapshotRepository | null = null
let scheduler: ReminderScheduler | null = null

const createTrayIcon = (): Electron.NativeImage =>
  nativeImage.createFromDataURL(
    'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f7a8d8"/><stop offset="1" stop-color="#8d5cf6"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#g)"/><path fill="white" d="M19 18h26a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H24l-8 7V21a3 3 0 0 1 3-3Zm7 12h16v-4H26v4Zm0 10h11v-4H26v4Z"/></svg>',
      ),
  )

const getRepository = (): SnapshotRepository => {
  if (repository === null) {
    repository = new SnapshotRepository(join(app.getPath('userData'), 'recordatorin.sqlite'))
  }

  return repository
}

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: 'Recordatorin',
    show: false,
    backgroundColor: '#f8c6e8',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  window.once('ready-to-show', () => window.show())
  window.on('close', (event) => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    window.hide()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

const createTray = (): void => {
  tray = new Tray(createTrayIcon())
  tray.setToolTip('Recordatorin')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Recordatorin',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        },
      },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ]),
  )
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

const registerIpc = (): void => {
  ipcMain.handle('app:load-snapshot', () => getRepository().load())
  ipcMain.handle('app:save-snapshot', (_event, snapshot: AppSnapshot) => {
    getRepository().save(snapshot)
  })
  ipcMain.handle('reminders:schedule', (_event, reminders: readonly Reminder[], sounds: SoundSettings) => {
    const snapshot = getRepository().load()
    if (snapshot !== null) {
      scheduler?.schedule(
        {
          ...snapshot,
          reminders,
        },
        sounds,
      )
    }
  })
  ipcMain.handle('notifications:test', (_event, payload: TestNotificationPayload) => {
    new Notification({ title: payload.title, body: payload.body }).show()
  })
  ipcMain.handle('app:set-launch-at-login', (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })
  ipcMain.handle('app:minimize-to-tray', () => {
    mainWindow?.hide()
  })
}

app.whenReady().then(() => {
  const repo = getRepository()
  mainWindow = createMainWindow()
  scheduler = new ReminderScheduler(repo, () => mainWindow)
  createTray()
  registerIpc()

  const snapshot = repo.load()
  if (snapshot !== null) {
    scheduler.schedule(snapshot, snapshot.settings.sounds)
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => undefined)

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }

  mainWindow.show()
})

app.on('quit', () => {
  scheduler?.clear()
  repository?.close()
})

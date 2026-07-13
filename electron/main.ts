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

const getBuildAssetPath = (fileName: string): string => join(__dirname, '../../build', fileName)

const createWindowIcon = (): Electron.NativeImage =>
  nativeImage.createFromPath(getBuildAssetPath(process.platform === 'win32' ? 'icon.ico' : 'icon.png'))

const createTrayIcon = (): Electron.NativeImage =>
  nativeImage.createFromPath(getBuildAssetPath('icon.png')).resize({ width: 16, height: 16 })

const getRepository = (): SnapshotRepository => {
  repository ??= new SnapshotRepository(join(app.getPath('userData'), 'recordatorin.sqlite'))
  return repository
}

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: 'Recordatorin',
    icon: createWindowIcon(),
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

app.setAppUserModelId('com.recordatorin.desktop')

const initializeApp = (): void => {
  const repo = getRepository()
  Menu.setApplicationMenu(null)
  mainWindow = createMainWindow()
  scheduler = new ReminderScheduler(repo, () => mainWindow)
  createTray()
  registerIpc()

  const snapshot = repo.load()
  if (snapshot !== null) {
    scheduler.schedule(snapshot, snapshot.settings.sounds)
  }
}

void app.whenReady().then(initializeApp)

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => undefined)

app.on('activate', () => {
  mainWindow ??= createMainWindow()
  mainWindow.show()
})

app.on('quit', () => {
  scheduler?.clear()
  repository?.close()
})

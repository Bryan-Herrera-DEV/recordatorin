import { join } from 'node:path'
import { app, BrowserWindow, Menu, nativeImage, Notification, Tray, ipcMain, shell } from 'electron'
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

const appDisplayName = 'Recordatorin'
const appUserModelId = 'com.recordatorin.desktop'
const toastActivatorClsid = '9f75e8c0-42f4-47e7-9a48-ff66f61d9f08'

const getBuildAssetPath = (fileName: string): string => join(__dirname, '../../build', fileName)

const createWindowIcon = (): Electron.NativeImage =>
  nativeImage.createFromPath(getBuildAssetPath(process.platform === 'win32' ? 'icon.ico' : 'icon.png'))

const createTrayIcon = (): Electron.NativeImage =>
  nativeImage.createFromPath(getBuildAssetPath('icon.png')).resize({ width: 16, height: 16 })

const showMainWindow = (): void => {
  if (mainWindow === null) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.show()
  mainWindow.focus()
}

const ensureDevelopmentWindowsShortcut = (): void => {
  if (process.platform !== 'win32' || app.isPackaged) {
    return
  }

  const shortcutPath = join(
    app.getPath('appData'),
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    `${appDisplayName}.lnk`,
  )

  shell.writeShortcutLink(shortcutPath, 'create', {
    target: process.execPath,
    args: `"${app.getAppPath()}"`,
    appUserModelId,
    description: 'Recordatorin development app',
    icon: getBuildAssetPath('icon.ico'),
    iconIndex: 0,
  })
}

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
          showMainWindow()
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
    showMainWindow()
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
    const notification = new Notification({ title: payload.title, body: payload.body, icon: getBuildAssetPath('icon.png') })
    notification.on('click', showMainWindow)
    notification.show()
  })
  ipcMain.handle('app:set-launch-at-login', (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })
  ipcMain.handle('app:minimize-to-tray', () => {
    mainWindow?.hide()
  })
}

app.setName(appDisplayName)
app.setAppUserModelId(appUserModelId)

if (process.platform === 'win32') {
  app.setToastActivatorCLSID(toastActivatorClsid)
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
}

app.on('second-instance', showMainWindow)

const initializeApp = (): void => {
  ensureDevelopmentWindowsShortcut()
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
  showMainWindow()
})

app.on('quit', () => {
  scheduler?.clear()
  repository?.close()
})

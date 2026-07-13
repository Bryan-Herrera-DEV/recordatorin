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

const appIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="18" y1="14" x2="112" y2="116" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffb7df"/>
      <stop offset="0.52" stop-color="#b983ff"/>
      <stop offset="1" stop-color="#4ecdc4"/>
    </linearGradient>
    <linearGradient id="paper" x1="34" y1="29" x2="91" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff"/>
      <stop offset="1" stop-color="#fff2fb"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="34" fill="url(#bg)"/>
  <path fill="url(#paper)" d="M36 25h48c8.8 0 16 7.2 16 16v35c0 8.8-7.2 16-16 16H62.2L38.8 111a4 4 0 0 1-6.5-3.1V41c0-8.8 7.1-16 15.7-16Z"/>
  <path fill="#7b3ff2" d="M51 48c0-3 2.4-5.5 5.5-5.5h22c3 0 5.5 2.4 5.5 5.5s-2.4 5.5-5.5 5.5h-22A5.5 5.5 0 0 1 51 48Zm0 18c0-3 2.4-5.5 5.5-5.5h29c3 0 5.5 2.4 5.5 5.5s-2.4 5.5-5.5 5.5h-29A5.5 5.5 0 0 1 51 66Zm0 18c0-3 2.4-5.5 5.5-5.5h16c3 0 5.5 2.4 5.5 5.5s-2.4 5.5-5.5 5.5h-16A5.5 5.5 0 0 1 51 84Z"/>
  <circle cx="93" cy="34" r="13" fill="#fff7fb" opacity="0.9"/>
  <path fill="#d75caa" d="M91.8 27.5a2.2 2.2 0 0 1 4.4 0v7.2c0 1.2-1 2.2-2.2 2.2h-6.5a2.2 2.2 0 1 1 0-4.4h4.3v-5Z"/>
</svg>`

const createAppIcon = (): Electron.NativeImage =>
  nativeImage.createFromDataURL(
    'data:image/svg+xml;utf8,' +
      encodeURIComponent(appIconSvg),
  )

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
    icon: createAppIcon(),
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
  tray = new Tray(createAppIcon())
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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Locale, SoundPack, ThemeColors, ThemeConfig, ThemeDensity } from '@/features/settings/domain/settings'
import { themePresets } from '@/features/settings/domain/settings'
import { useAppStore } from '@/app/store/app-store'
import { playAlertSound } from '@/platform/sound/sound-player'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

const colorFields: readonly (keyof ThemeColors)[] = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'primary',
  'primaryForeground',
  'accent',
  'muted',
  'border',
  'ring',
]

const fontOptions = [
  'Inter, ui-sans-serif, system-ui, sans-serif',
  'Aptos, Inter, ui-sans-serif, system-ui, sans-serif',
  'Georgia, Cambria, serif',
  'Nunito, Inter, ui-sans-serif, system-ui, sans-serif',
] as const

export function SettingsPage() {
  const { t } = useTranslation()
  const snapshot = useAppStore((state) => state.snapshot)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const updateTheme = useAppStore((state) => state.updateTheme)
  const addFolder = useAppStore((state) => state.addFolder)
  const addTag = useAppStore((state) => state.addTag)
  const [folderName, setFolderName] = useState('')
  const [tagName, setTagName] = useState('')

  const theme = snapshot.settings.theme

  const patchTheme = (patch: Partial<ThemeConfig>): void => {
    void updateTheme({
      ...theme,
      ...patch,
    })
  }

  const patchColors = (patch: Partial<ThemeColors>): void => {
    patchTheme({
      colors: {
        ...theme.colors,
        ...patch,
      },
    })
  }

  const handleCustomSound = (file: File | null): void => {
    if (file === null) {
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        void updateSettings({
          sounds: {
            ...snapshot.settings.sounds,
            customAlertDataUrl: reader.result,
          },
        })
      }
    })
    reader.readAsDataURL(file)
  }

  const handleTestAlert = (): void => {
    playAlertSound(snapshot.settings.sounds)
    void window.recordatorin?.showTestNotification({
      title: t('notificationTitle'),
      body: t('notificationBody'),
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Card className="space-y-5 p-5">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('settings')}</h1>
            <p className="text-sm opacity-70">{t('theme')}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              {t('yourName')}
              <Input value={snapshot.settings.userName} onChange={(event) => void updateSettings({ userName: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('language')}
              <Select value={snapshot.settings.locale} onChange={(event) => void updateSettings({ locale: event.target.value as Locale })}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </Select>
            </label>
            <label className="flex items-end gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={snapshot.settings.launchAtLogin}
                onChange={(event) => void updateSettings({ launchAtLogin: event.target.checked })}
              />
              {t('launchAtLogin')}
            </label>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">{t('themePresets')}</h2>
            <div className="flex flex-wrap gap-2">
              {themePresets.map((preset) => (
                <Button key={preset.id} type="button" variant={preset.id === theme.id ? 'primary' : 'secondary'} onClick={() => void updateTheme(preset)}>
                  {preset.name}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">{t('colors')}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {colorFields.map((field) => (
                <label key={field} className="grid gap-2 text-sm font-medium capitalize">
                  {field.replace(/[A-Z]/g, (letter) => ` ${letter.toLocaleLowerCase()}`)}
                  <div className="flex gap-2">
                    <Input type="color" className="w-14 p-1" value={theme.colors[field]} onChange={(event) => patchColors({ [field]: event.target.value })} />
                    <Input value={theme.colors[field]} onChange={(event) => patchColors({ [field]: event.target.value })} />
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              {t('typography')}
              <Select value={theme.fontSans} onChange={(event) => patchTheme({ fontSans: event.target.value })}>
                {fontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('radius')}: {theme.radius}px
              <Input type="range" min={8} max={32} value={theme.radius} onChange={(event) => patchTheme({ radius: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('blur')}: {theme.blur}px
              <Input type="range" min={0} max={32} value={theme.blur} onChange={(event) => patchTheme({ blur: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('density')}
              <Select value={theme.density} onChange={(event) => patchTheme({ density: event.target.value as ThemeDensity })}>
                <option value="comfortable">{t('comfortable')}</option>
                <option value="compact">{t('compact')}</option>
              </Select>
            </label>
          </section>
        </Card>

        <Card className="space-y-5 p-5">
          <div>
            <h2 className="text-xl font-bold">{t('sounds')}</h2>
            <p className="text-sm opacity-70">{t('customAlert')}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={snapshot.settings.sounds.enabled}
                onChange={(event) =>
                  void updateSettings({
                    sounds: {
                      ...snapshot.settings.sounds,
                      enabled: event.target.checked,
                    },
                  })
                }
              />
              {t('enableSounds')}
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('soundPack')}
              <Select
                value={snapshot.settings.sounds.pack}
                onChange={(event) =>
                  void updateSettings({
                    sounds: {
                      ...snapshot.settings.sounds,
                      pack: event.target.value as SoundPack,
                    },
                  })
                }
              >
                <option value="soft">Soft</option>
                <option value="glass">Glass</option>
                <option value="muted">Muted</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('uiVolume')}: {Math.round(snapshot.settings.sounds.uiVolume * 100)}%
              <Input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={snapshot.settings.sounds.uiVolume}
                onChange={(event) =>
                  void updateSettings({
                    sounds: {
                      ...snapshot.settings.sounds,
                      uiVolume: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('alertVolume')}: {Math.round(snapshot.settings.sounds.alertVolume * 100)}%
              <Input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={snapshot.settings.sounds.alertVolume}
                onChange={(event) =>
                  void updateSettings({
                    sounds: {
                      ...snapshot.settings.sounds,
                      alertVolume: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input type="file" accept="audio/*" className="max-w-sm" onChange={(event) => handleCustomSound(event.target.files?.[0] ?? null)} />
            <Button type="button" onClick={handleTestAlert}>
              {t('testAlert')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void window.recordatorin?.minimizeToTray()}>
              {t('minimizeToTray')}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="h-fit space-y-5 p-5">
        <h2 className="text-xl font-bold">{t('organization')}</h2>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (folderName.trim().length > 0) {
              void addFolder(folderName).then(() => setFolderName(''))
            }
          }}
        >
          <label className="grid gap-2 text-sm font-medium">
            {t('newFolder')}
            <Input value={folderName} onChange={(event) => setFolderName(event.target.value)} />
          </label>
          <Button type="submit" variant="secondary">{t('add')}</Button>
        </form>
        <div className="space-y-2">
          {snapshot.folders.map((folder) => (
            <div key={folder.id} className="flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2 text-sm">
              <span className="size-3 rounded-full" style={{ backgroundColor: folder.color }} />
              {folder.name}
            </div>
          ))}
        </div>

        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (tagName.trim().length > 0) {
              void addTag(tagName).then(() => setTagName(''))
            }
          }}
        >
          <label className="grid gap-2 text-sm font-medium">
            {t('newTag')}
            <Input value={tagName} onChange={(event) => setTagName(event.target.value)} />
          </label>
          <Button type="submit" variant="secondary">{t('add')}</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {snapshot.tags.map((tag) => (
            <span key={tag.id} className="tag-toggle is-active">
              #{tag.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}

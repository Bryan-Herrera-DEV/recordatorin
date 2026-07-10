import type { ISODateString } from '@/shared/domain/primitives'
import { nowIso } from '@/shared/domain/primitives'

export type Locale = 'en' | 'es'
export type ThemeDensity = 'comfortable' | 'compact'
export type SoundPack = 'soft' | 'glass' | 'muted'

export type ThemeColors = {
  readonly background: string
  readonly foreground: string
  readonly card: string
  readonly cardForeground: string
  readonly primary: string
  readonly primaryForeground: string
  readonly accent: string
  readonly muted: string
  readonly border: string
  readonly ring: string
}

export type ThemeConfig = {
  readonly id: string
  readonly name: string
  readonly colors: ThemeColors
  readonly fontSans: string
  readonly fontMono: string
  readonly radius: number
  readonly blur: number
  readonly density: ThemeDensity
  readonly updatedAt: ISODateString
}

export type SoundSettings = {
  readonly enabled: boolean
  readonly uiVolume: number
  readonly alertVolume: number
  readonly pack: SoundPack
  readonly customAlertDataUrl: string | null
}

export type AppSettings = {
  readonly onboardingCompleted: boolean
  readonly userName: string
  readonly locale: Locale
  readonly theme: ThemeConfig
  readonly sounds: SoundSettings
  readonly launchAtLogin: boolean
}

export const themePresets: readonly ThemeConfig[] = [
  {
    id: 'dream-glass',
    name: 'Dream Glass',
    colors: {
      background: '#f8c6e8',
      foreground: '#28162f',
      card: '#fff7fb',
      cardForeground: '#20111f',
      primary: '#c053ad',
      primaryForeground: '#ffffff',
      accent: '#f4a8ca',
      muted: '#f5d7ed',
      border: '#ffffff80',
      ring: '#d56cc5',
    },
    fontSans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontMono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace',
    radius: 22,
    blur: 24,
    density: 'comfortable',
    updatedAt: nowIso(),
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    colors: {
      background: '#191729',
      foreground: '#f7efff',
      card: '#27213b',
      cardForeground: '#fff9ff',
      primary: '#b983ff',
      primaryForeground: '#150f20',
      accent: '#5342a0',
      muted: '#312a49',
      border: '#ffffff26',
      ring: '#c6a0ff',
    },
    fontSans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontMono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace',
    radius: 18,
    blur: 18,
    density: 'comfortable',
    updatedAt: nowIso(),
  },
  {
    id: 'paper-mint',
    name: 'Paper Mint',
    colors: {
      background: '#e7f8ef',
      foreground: '#17352a',
      card: '#fbfff9',
      cardForeground: '#17352a',
      primary: '#2f9b73',
      primaryForeground: '#ffffff',
      accent: '#bdebd2',
      muted: '#dff4e8',
      border: '#ffffffa6',
      ring: '#3cb987',
    },
    fontSans: 'Aptos, Inter, ui-sans-serif, system-ui, sans-serif',
    fontMono: 'Cascadia Code, JetBrains Mono, ui-monospace, monospace',
    radius: 16,
    blur: 14,
    density: 'compact',
    updatedAt: nowIso(),
  },
]

export const createDefaultSettings = (): AppSettings => ({
  onboardingCompleted: false,
  userName: '',
  locale: 'es',
  theme: themePresets[0]!,
  sounds: {
    enabled: true,
    uiVolume: 0.18,
    alertVolume: 0.5,
    pack: 'soft',
    customAlertDataUrl: null,
  },
  launchAtLogin: false,
})

export const updateThemeTimestamp = (theme: ThemeConfig): ThemeConfig => ({
  ...theme,
  updatedAt: nowIso(),
})

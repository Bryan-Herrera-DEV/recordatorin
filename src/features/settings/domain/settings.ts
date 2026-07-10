import type { ISODateString } from '@/shared/domain/primitives'
import { nowIso } from '@/shared/domain/primitives'
import { isRecord } from '@/shared/domain/json'

export type Locale = 'en' | 'es'
export type ThemeDensity = 'comfortable' | 'compact'
export type SoundPack = 'soft' | 'glass' | 'muted' | 'aurora' | 'bell' | 'pulse' | 'wood'

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
  readonly uiPack: SoundPack
  readonly alertPack: SoundPack
  readonly customAlertDataUrl: string | null
}

export type AppSettings = {
  readonly onboardingCompleted: boolean
  readonly userName: string
  readonly locale: Locale
  readonly theme: ThemeConfig
  readonly customThemes: readonly ThemeConfig[]
  readonly sounds: SoundSettings
  readonly launchAtLogin: boolean
}

const defaultFontSans = 'Segoe UI, Aptos, Inter, ui-sans-serif, system-ui, sans-serif'
const defaultFontMono = 'Cascadia Code, JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace'

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
    fontSans: defaultFontSans,
    fontMono: defaultFontMono,
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
    fontSans: defaultFontSans,
    fontMono: defaultFontMono,
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
    fontSans: defaultFontSans,
    fontMono: defaultFontMono,
    radius: 16,
    blur: 14,
    density: 'compact',
    updatedAt: nowIso(),
  },
  {
    id: 'ocean-air',
    name: 'Ocean Air',
    colors: {
      background: '#d7f3ff',
      foreground: '#0b2b3a',
      card: '#f4fcff',
      cardForeground: '#0b2b3a',
      primary: '#147d9f',
      primaryForeground: '#ffffff',
      accent: '#8dddf0',
      muted: '#c9eef8',
      border: '#ffffffa8',
      ring: '#2499bf',
    },
    fontSans: 'Trebuchet MS, Segoe UI, ui-sans-serif, system-ui, sans-serif',
    fontMono: defaultFontMono,
    radius: 20,
    blur: 20,
    density: 'comfortable',
    updatedAt: nowIso(),
  },
  {
    id: 'sunset-focus',
    name: 'Sunset Focus',
    colors: {
      background: '#ffe0bd',
      foreground: '#3d1e14',
      card: '#fff8ef',
      cardForeground: '#32160f',
      primary: '#d75c34',
      primaryForeground: '#fff7f0',
      accent: '#ffb36f',
      muted: '#f8d4b4',
      border: '#ffffff9c',
      ring: '#ef7a43',
    },
    fontSans: 'Verdana, Segoe UI, ui-sans-serif, system-ui, sans-serif',
    fontMono: defaultFontMono,
    radius: 24,
    blur: 18,
    density: 'comfortable',
    updatedAt: nowIso(),
  },
  {
    id: 'graphite',
    name: 'Graphite',
    colors: {
      background: '#15171c',
      foreground: '#f4f6fb',
      card: '#22252d',
      cardForeground: '#ffffff',
      primary: '#93a4ff',
      primaryForeground: '#0d1020',
      accent: '#383d4a',
      muted: '#2b303a',
      border: '#ffffff24',
      ring: '#aab6ff',
    },
    fontSans: defaultFontSans,
    fontMono: defaultFontMono,
    radius: 14,
    blur: 10,
    density: 'compact',
    updatedAt: nowIso(),
  },
  {
    id: 'forest-calm',
    name: 'Forest Calm',
    colors: {
      background: '#dcebdd',
      foreground: '#18301d',
      card: '#f7fff5',
      cardForeground: '#18301d',
      primary: '#3f7c4a',
      primaryForeground: '#ffffff',
      accent: '#b6d5a8',
      muted: '#cfe3c9',
      border: '#ffffffa0',
      ring: '#4f9859',
    },
    fontSans: 'Georgia, Cambria, serif',
    fontMono: 'Courier New, ui-monospace, monospace',
    radius: 18,
    blur: 12,
    density: 'comfortable',
    updatedAt: nowIso(),
  },
]

export const createDefaultSettings = (): AppSettings => ({
  onboardingCompleted: false,
  userName: '',
  locale: 'es',
  theme: themePresets[0]!,
  customThemes: [],
  sounds: {
    enabled: true,
    uiVolume: 0.18,
    alertVolume: 0.5,
    uiPack: 'soft',
    alertPack: 'soft',
    customAlertDataUrl: null,
  },
  launchAtLogin: false,
})

export const updateThemeTimestamp = (theme: ThemeConfig): ThemeConfig => ({
  ...theme,
  updatedAt: nowIso(),
})

const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'es'
const isDensity = (value: unknown): value is ThemeDensity => value === 'comfortable' || value === 'compact'
const isSoundPack = (value: unknown): value is SoundPack =>
  value === 'soft' || value === 'glass' || value === 'muted' || value === 'aurora' || value === 'bell' || value === 'pulse' || value === 'wood'

const textOr = (value: unknown, fallback: string): string => (typeof value === 'string' && value.length > 0 ? value : fallback)
const numberOr = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)

const ensureColors = (value: unknown, fallback: ThemeColors): ThemeColors => {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    background: textOr(value.background, fallback.background),
    foreground: textOr(value.foreground, fallback.foreground),
    card: textOr(value.card, fallback.card),
    cardForeground: textOr(value.cardForeground, fallback.cardForeground),
    primary: textOr(value.primary, fallback.primary),
    primaryForeground: textOr(value.primaryForeground, fallback.primaryForeground),
    accent: textOr(value.accent, fallback.accent),
    muted: textOr(value.muted, fallback.muted),
    border: textOr(value.border, fallback.border),
    ring: textOr(value.ring, fallback.ring),
  }
}

export const ensureThemeConfig = (value: unknown, fallback: ThemeConfig = themePresets[0]!): ThemeConfig => {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    id: textOr(value.id, fallback.id),
    name: textOr(value.name, fallback.name),
    colors: ensureColors(value.colors, fallback.colors),
    fontSans: textOr(value.fontSans, fallback.fontSans),
    fontMono: textOr(value.fontMono, fallback.fontMono),
    radius: numberOr(value.radius, fallback.radius),
    blur: numberOr(value.blur, fallback.blur),
    density: isDensity(value.density) ? value.density : fallback.density,
    updatedAt: typeof value.updatedAt === 'string' ? (value.updatedAt as ISODateString) : fallback.updatedAt,
  }
}

export const ensureAppSettings = (value: unknown, locale: Locale = 'es'): AppSettings => {
  const fallback = createDefaultSettings()
  if (!isRecord(value)) {
    return { ...fallback, locale }
  }

  const rawSounds = isRecord(value.sounds) ? value.sounds : {}
  const legacyPack = isSoundPack(rawSounds.pack) ? rawSounds.pack : fallback.sounds.alertPack
  const customThemes = Array.isArray(value.customThemes)
    ? value.customThemes.map((theme) => ensureThemeConfig(theme)).filter((theme) => theme.id.startsWith('custom-'))
    : fallback.customThemes

  return {
    onboardingCompleted: typeof value.onboardingCompleted === 'boolean' ? value.onboardingCompleted : fallback.onboardingCompleted,
    userName: typeof value.userName === 'string' ? value.userName : fallback.userName,
    locale: isLocale(value.locale) ? value.locale : locale,
    theme: ensureThemeConfig(value.theme, fallback.theme),
    customThemes,
    sounds: {
      enabled: typeof rawSounds.enabled === 'boolean' ? rawSounds.enabled : fallback.sounds.enabled,
      uiVolume: numberOr(rawSounds.uiVolume, fallback.sounds.uiVolume),
      alertVolume: numberOr(rawSounds.alertVolume, fallback.sounds.alertVolume),
      uiPack: isSoundPack(rawSounds.uiPack) ? rawSounds.uiPack : legacyPack,
      alertPack: isSoundPack(rawSounds.alertPack) ? rawSounds.alertPack : legacyPack,
      customAlertDataUrl: typeof rawSounds.customAlertDataUrl === 'string' ? rawSounds.customAlertDataUrl : null,
    },
    launchAtLogin: typeof value.launchAtLogin === 'boolean' ? value.launchAtLogin : fallback.launchAtLogin,
  }
}

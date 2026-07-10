import type { ThemeColors } from '@/features/settings/domain/settings'

const fallbackPalette = ['#f7a8d8', '#bda7ff', '#ffd3a8', '#8dddf0', '#b6d5a8', '#f4a8ca'] as const

const normalizeHex = (value: string): string | null => {
  const trimmed = value.trim()
  const shortMatch = /^#([\da-f]{3})$/i.exec(trimmed)
  if (shortMatch?.[1]) {
    return `#${shortMatch[1].split('').map((part) => `${part}${part}`).join('')}`.toLowerCase()
  }

  const longMatch = /^#([\da-f]{6})/i.exec(trimmed)
  return longMatch?.[1] ? `#${longMatch[1]}`.toLowerCase() : null
}

const hexToRgb = (hex: string): readonly [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]

const rgbToHex = (red: number, green: number, blue: number): string =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`

const mixHex = (from: string, to: string, amount: number): string => {
  const [fromRed, fromGreen, fromBlue] = hexToRgb(from)
  const [toRed, toGreen, toBlue] = hexToRgb(to)
  const keep = 1 - amount

  return rgbToHex(
    fromRed * keep + toRed * amount,
    fromGreen * keep + toGreen * amount,
    fromBlue * keep + toBlue * amount,
  )
}

const uniqueColors = (colors: readonly string[]): readonly string[] => {
  const seen = new Set<string>()
  return colors.filter((color) => {
    if (seen.has(color)) {
      return false
    }

    seen.add(color)
    return true
  })
}

export const createFolderColorPalette = (colors: ThemeColors): readonly string[] => {
  const primary = normalizeHex(colors.primary) ?? fallbackPalette[0]
  const accent = normalizeHex(colors.accent) ?? fallbackPalette[1]
  const ring = normalizeHex(colors.ring) ?? fallbackPalette[2]
  const muted = normalizeHex(colors.muted) ?? fallbackPalette[3]

  return uniqueColors([
    primary,
    accent,
    ring,
    muted,
    mixHex(primary, accent, 0.5),
    mixHex(primary, '#ffffff', 0.32),
    mixHex(accent, '#ffffff', 0.26),
    mixHex(ring, '#000000', 0.18),
    ...fallbackPalette,
  ]).slice(0, 10)
}

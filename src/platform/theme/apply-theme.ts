import type { ThemeConfig } from '@/features/settings/domain/settings'

export const applyTheme = (theme: ThemeConfig): void => {
  const root = document.documentElement
  root.style.setProperty('--background', theme.colors.background)
  root.style.setProperty('--foreground', theme.colors.foreground)
  root.style.setProperty('--card', theme.colors.card)
  root.style.setProperty('--card-foreground', theme.colors.cardForeground)
  root.style.setProperty('--primary', theme.colors.primary)
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground)
  root.style.setProperty('--accent', theme.colors.accent)
  root.style.setProperty('--muted', theme.colors.muted)
  root.style.setProperty('--border', theme.colors.border)
  root.style.setProperty('--ring', theme.colors.ring)
  root.style.setProperty('--font-sans', theme.fontSans)
  root.style.setProperty('--font-mono', theme.fontMono)
  root.style.setProperty('--radius', `${theme.radius}px`)
  root.style.setProperty('--blur', `${theme.blur}px`)
  root.dataset.density = theme.density
}

import { NavLink, Outlet } from 'react-router-dom'
import { Bell, Folder, Hash, MoonStar, NotebookPen, Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/app-store'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/cn'

const navLinkClass = ({ isActive }: { readonly isActive: boolean }): string =>
  cn(
    'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition hover:bg-white/20',
    isActive ? 'bg-white/35 shadow-inner text-[var(--foreground)]' : 'text-[var(--foreground)]/75',
  )

export function AppShell() {
  const { t } = useTranslation()
  const snapshot = useAppStore((state) => state.snapshot)
  const addFolder = useAppStore((state) => state.addFolder)
  const addTag = useAppStore((state) => state.addTag)

  const handleAddFolder = (): void => {
    const name = window.prompt(t('folderPrompt'))
    if (name !== null && name.trim().length > 0) {
      void addFolder(name)
    }
  }

  const handleAddTag = (): void => {
    const label = window.prompt(t('tagPrompt'))
    if (label !== null && label.trim().length > 0) {
      void addTag(label)
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar glass-panel">
        <div className="rounded-[calc(var(--radius)-4px)] border border-white/35 bg-white/25 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[var(--primary)] text-lg font-bold text-[var(--primary-foreground)]">
              {snapshot.settings.userName.slice(0, 1).toLocaleUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {t('welcome', { name: snapshot.settings.userName })}
              </p>
              <p className="truncate text-xs opacity-65">{t('profileSubtitle')}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          <NavLink to="/notes" className={navLinkClass}>
            <NotebookPen className="size-4" /> {t('notes')}
          </NavLink>
          <NavLink to="/reminders" className={navLinkClass}>
            <Bell className="size-4" /> {t('reminders')}
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="size-4" /> {t('settings')}
          </NavLink>
        </nav>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="sidebar-heading">{t('folders')}</h2>
            <Button type="button" variant="ghost" size="icon" onClick={handleAddFolder} aria-label={t('newFolder')}>
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {snapshot.folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-sm">
                <Folder className="size-4" style={{ color: folder.color }} />
                <span className="truncate">{folder.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="sidebar-heading">{t('tags')}</h2>
            <Button type="button" variant="ghost" size="icon" onClick={handleAddTag} aria-label={t('newTag')}>
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {snapshot.tags.map((tag) => (
              <Badge key={tag.id}>
                <Hash className="mr-1 size-3" /> {tag.label}
              </Badge>
            ))}
          </div>
        </section>

        <div className="mt-auto rounded-3xl border border-white/30 bg-white/15 p-3 text-xs opacity-75">
          <MoonStar className="mb-2 size-4" />
          {snapshot.settings.theme.name}
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

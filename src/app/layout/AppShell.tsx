import { NavLink, Outlet } from 'react-router-dom'
import { Bell, Folder as FolderIcon, Hash, MoonStar, NotebookPen, Plus, Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Folder as WorkspaceFolder } from '@/features/workspace/domain/workspace'
import { createFolderColorPalette } from '@/features/workspace/domain/folder-colors'
import { FolderColorPicker } from '@/features/workspace/components/FolderColorPicker'
import { useAppStore } from '@/app/store/app-store'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
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
  const deleteFolder = useAppStore((state) => state.deleteFolder)
  const addTag = useAppStore((state) => state.addTag)
  const folderColorPalette = createFolderColorPalette(snapshot.settings.theme.colors)
  const [addingFolder, setAddingFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState(folderColorPalette[0] ?? '#f7a8d8')
  const userInitial = (snapshot.settings.userName.trim().charAt(0) || 'R').toLocaleUpperCase()

  const handleAddFolder = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (folderName.trim().length > 0) {
      void addFolder(folderName, folderColor).then(() => {
        setFolderName('')
        setAddingFolder(false)
      })
    }
  }

  const handleAddTag = (): void => {
    const label = window.prompt(t('tagPrompt'))
    if (label !== null && label.trim().length > 0) {
      void addTag(label)
    }
  }

  const handleDeleteFolder = (folder: WorkspaceFolder): void => {
    const notes = snapshot.notes.filter((note) => note.folderId === folder.id).length
    const reminders = snapshot.reminders.filter((reminder) => reminder.folderId === folder.id).length
    if (window.confirm(t('deleteFolderConfirm', { name: folder.name, notes, reminders }))) {
      void deleteFolder(folder.id)
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar glass-panel shadcn-scrollbar">
        <div className="rounded-[calc(var(--radius)-4px)] border border-white/35 bg-white/25 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--primary)] text-lg font-bold text-[var(--primary-foreground)] shadow-lg shadow-black/10" aria-label={snapshot.settings.userName}>
              {userInitial}
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
            <Button type="button" variant="ghost" size="icon" onClick={() => setAddingFolder((current) => !current)} aria-label={t('newFolder')}>
              <Plus className="size-4" />
            </Button>
          </div>
          {addingFolder ? (
            <form className="grid gap-2 rounded-2xl border border-white/30 bg-white/15 p-2" onSubmit={handleAddFolder}>
              <Input placeholder={t('folderPrompt')} value={folderName} onChange={(event) => setFolderName(event.target.value)} autoFocus />
              <FolderColorPicker
                colors={snapshot.settings.theme.colors}
                label={t('folderColor')}
                value={folderColor}
                onChange={setFolderColor}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" size="sm" variant="secondary">
                  {t('add')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAddingFolder(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : null}
          <div className="space-y-1">
            {snapshot.folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-sm hover:bg-white/15">
                <FolderIcon className="size-4 shrink-0" style={{ color: folder.color }} />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => handleDeleteFolder(folder)} aria-label={t('deleteFolder')}>
                  <Trash2 className="size-3.5" />
                </Button>
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

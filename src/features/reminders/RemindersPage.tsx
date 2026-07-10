import { Trash2 } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { FolderId, TagId } from '@/features/workspace/domain/workspace'
import type { Reminder, ReminderSchedule, ReminderStatus, Weekday } from '@/features/reminders/domain/reminder'
import { useAppStore } from '@/app/store/app-store'
import { fromDateTimeInput, toDateTimeInput, toIsoDate } from '@/shared/domain/primitives'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { EmptyState } from '@/shared/ui/empty-state'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

const MarkdownEditor = lazy(async () => {
  const module = await import('@/features/notes/components/MarkdownEditor')
  return { default: module.MarkdownEditor }
})

const weekdays: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6]

const formatSchedule = (schedule: ReminderSchedule, t: (key: string) => string): string => {
  switch (schedule.type) {
    case 'once':
      return `${t('once')} · ${new Date(schedule.dueAt).toLocaleString()}`
    case 'interval':
      return `${t('interval')} · ${schedule.everyMinutes}m`
    case 'daily':
      return `${t('daily')} · ${schedule.time}`
    case 'weekly':
      return `${t('weekly')} · ${schedule.weekday} · ${schedule.time}`
    case 'random':
      return `${t('random')} · ${schedule.windowStart}-${schedule.windowEnd}`
    default:
      return t('schedule')
  }
}

const scheduleForType = (current: ReminderSchedule, type: ReminderSchedule['type']): ReminderSchedule => {
  if (current.type === type) {
    return current
  }

  const now = new Date()
  const nowIso = toIsoDate(now)
  switch (type) {
    case 'once':
      return { type: 'once', dueAt: nowIso }
    case 'interval':
      return { type: 'interval', startAt: nowIso, everyMinutes: 60 }
    case 'daily':
      return { type: 'daily', time: '09:00' }
    case 'weekly':
      return { type: 'weekly', weekday: 1, time: '09:00' }
    case 'random':
      return { type: 'random', windowStart: '09:00', windowEnd: '18:00', timesPerDay: 1 }
    default:
      return current
  }
}

function ReminderEditor({ reminder }: { readonly reminder: Reminder }) {
  const { t } = useTranslation()
  const snapshot = useAppStore((state) => state.snapshot)
  const updateReminder = useAppStore((state) => state.updateReminder)
  const deleteReminder = useAppStore((state) => state.deleteReminder)

  const updateSchedule = (schedule: ReminderSchedule): void => {
    void updateReminder(reminder.id, { schedule, status: schedule.type === 'once' ? 'active' : reminder.status })
  }

  return (
    <Card className="min-h-0 overflow-y-auto p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Input
            className="h-auto border-none bg-transparent px-0 text-3xl font-bold shadow-none focus:ring-0"
            value={reminder.title}
            onChange={(event) => void updateReminder(reminder.id, { title: event.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            <Badge>{formatSchedule(reminder.schedule, t)}</Badge>
            <Badge>{t(reminder.status)}</Badge>
          </div>
        </div>
        <Button type="button" variant="destructive" size="icon" onClick={() => void deleteReminder(reminder.id)} aria-label={t('delete')}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          {t('status')}
          <Select
            value={reminder.status}
            onChange={(event) => void updateReminder(reminder.id, { status: event.target.value as ReminderStatus })}
          >
            <option value="active">{t('active')}</option>
            <option value="paused">{t('paused')}</option>
            <option value="done">{t('done')}</option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {t('schedule')}
          <Select value={reminder.schedule.type} onChange={(event) => updateSchedule(scheduleForType(reminder.schedule, event.target.value as ReminderSchedule['type']))}>
            <option value="once">{t('once')}</option>
            <option value="interval">{t('interval')}</option>
            <option value="daily">{t('daily')}</option>
            <option value="weekly">{t('weekly')}</option>
            <option value="random">{t('random')}</option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {t('folder')}
          <Select
            value={reminder.folderId ?? 'none'}
            onChange={(event) =>
              void updateReminder(reminder.id, {
                folderId: event.target.value === 'none' ? null : (event.target.value as FolderId),
              })
            }
          >
            <option value="none">{t('folder')}</option>
            {snapshot.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {reminder.schedule.type === 'once' ? (
          <label className="grid gap-2 text-sm font-medium">
            {t('dueAt')}
            <Input
              type="datetime-local"
              value={toDateTimeInput(reminder.schedule.dueAt)}
              onChange={(event) => {
                const dueAt = fromDateTimeInput(event.target.value)
                if (dueAt !== null) {
                  updateSchedule({ type: 'once', dueAt })
                }
              }}
            />
          </label>
        ) : null}

        {reminder.schedule.type === 'interval' ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              {t('dueAt')}
              <Input
                type="datetime-local"
                value={toDateTimeInput(reminder.schedule.startAt)}
                onChange={(event) => {
                  const startAt = fromDateTimeInput(event.target.value)
                  if (startAt !== null && reminder.schedule.type === 'interval') {
                    updateSchedule({ ...reminder.schedule, startAt })
                  }
                }}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('everyMinutes')}
              <Input
                type="number"
                min={1}
                value={reminder.schedule.everyMinutes}
                onChange={(event) => {
                  if (reminder.schedule.type === 'interval') {
                    updateSchedule({
                      type: 'interval',
                      startAt: reminder.schedule.startAt,
                      everyMinutes: Number(event.target.value) || 1,
                    })
                  }
                }}
              />
            </label>
          </>
        ) : null}

        {reminder.schedule.type === 'daily' ? (
          <label className="grid gap-2 text-sm font-medium">
            {t('time')}
            <Input
              type="time"
              value={reminder.schedule.time}
              onChange={(event) => {
                if (reminder.schedule.type === 'daily') {
                  updateSchedule({ type: 'daily', time: event.target.value })
                }
              }}
            />
          </label>
        ) : null}

        {reminder.schedule.type === 'weekly' ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              {t('weekday')}
              <Select
                value={String(reminder.schedule.weekday)}
                onChange={(event) => {
                  if (reminder.schedule.type === 'weekly') {
                    updateSchedule({
                      type: 'weekly',
                      weekday: Number(event.target.value) as Weekday,
                      time: reminder.schedule.time,
                    })
                  }
                }}
              >
                {weekdays.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {weekday}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('time')}
              <Input
                type="time"
                value={reminder.schedule.time}
                onChange={(event) => {
                  if (reminder.schedule.type === 'weekly') {
                    updateSchedule({
                      type: 'weekly',
                      weekday: reminder.schedule.weekday,
                      time: event.target.value,
                    })
                  }
                }}
              />
            </label>
          </>
        ) : null}

        {reminder.schedule.type === 'random' ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              {t('randomWindow')}
              <Input
                type="time"
                value={reminder.schedule.windowStart}
                onChange={(event) => {
                  if (reminder.schedule.type === 'random') {
                    updateSchedule({
                      type: 'random',
                      windowStart: event.target.value,
                      windowEnd: reminder.schedule.windowEnd,
                      timesPerDay: reminder.schedule.timesPerDay,
                    })
                  }
                }}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('time')}
              <Input
                type="time"
                value={reminder.schedule.windowEnd}
                onChange={(event) => {
                  if (reminder.schedule.type === 'random') {
                    updateSchedule({
                      type: 'random',
                      windowStart: reminder.schedule.windowStart,
                      windowEnd: event.target.value,
                      timesPerDay: reminder.schedule.timesPerDay,
                    })
                  }
                }}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('random')}
              <Input
                type="number"
                min={1}
                max={8}
                value={reminder.schedule.timesPerDay}
                onChange={(event) => {
                  if (reminder.schedule.type === 'random') {
                    updateSchedule({
                      type: 'random',
                      windowStart: reminder.schedule.windowStart,
                      windowEnd: reminder.schedule.windowEnd,
                      timesPerDay: Number(event.target.value) || 1,
                    })
                  }
                }}
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {snapshot.tags.map((tag) => {
          const active = reminder.tagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              className={`tag-toggle ${active ? 'is-active' : ''}`}
              onClick={() => {
                const tagIds: readonly TagId[] = active
                  ? reminder.tagIds.filter((tagId) => tagId !== tag.id)
                  : [...reminder.tagIds, tag.id]
                void updateReminder(reminder.id, { tagIds })
              }}
            >
              #{tag.label}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        <Suspense fallback={<div className="grid h-48 place-items-center opacity-70">{t('loading')}</div>}>
          <MarkdownEditor
            value={reminder.descriptionMarkdown}
            height={320}
            onChange={(descriptionMarkdown) => void updateReminder(reminder.id, { descriptionMarkdown })}
          />
        </Suspense>
      </div>
    </Card>
  )
}

export function RemindersPage() {
  const { t } = useTranslation()
  const snapshot = useAppStore((state) => state.snapshot)
  const selectedReminderId = useAppStore((state) => state.selectedReminderId)
  const setSelectedReminderId = useAppStore((state) => state.setSelectedReminderId)
  const createReminder = useAppStore((state) => state.createReminder)

  const selectedReminder = snapshot.reminders.find((reminder) => reminder.id === selectedReminderId) ?? snapshot.reminders[0] ?? null

  useEffect(() => {
    if (selectedReminder !== null && selectedReminder.id !== selectedReminderId) {
      setSelectedReminderId(selectedReminder.id)
    }
  }, [selectedReminder, selectedReminderId, setSelectedReminderId])

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="flex min-h-0 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('reminders')}</h1>
            <p className="text-xs opacity-65">{snapshot.reminders.length} items</p>
          </div>
          <Button type="button" size="sm" onClick={() => void createReminder()}>
            {t('newReminder')}
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {snapshot.reminders.map((reminder) => (
            <button
              key={reminder.id}
              type="button"
              className={`note-list-item ${reminder.id === selectedReminder?.id ? 'is-active' : ''}`}
              onClick={() => setSelectedReminderId(reminder.id)}
            >
              <span className="block truncate font-semibold">{reminder.title}</span>
              <span className="mt-1 block truncate text-xs opacity-65">{formatSchedule(reminder.schedule, t)}</span>
              <span className="mt-2 inline-flex rounded-full bg-white/25 px-2 py-0.5 text-[11px]">{t(reminder.status)}</span>
            </button>
          ))}
        </div>
      </Card>

      {selectedReminder === null ? (
        <EmptyState title={t('noReminders')} action={<Button onClick={() => void createReminder()}>{t('newReminder')}</Button>} />
      ) : (
        <ReminderEditor reminder={selectedReminder} />
      )}
    </div>
  )
}

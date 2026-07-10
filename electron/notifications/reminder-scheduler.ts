import { randomInt } from 'node:crypto'
import { BrowserWindow, Notification } from 'electron'
import type { Reminder, ReminderSchedule } from '@/features/reminders/domain/reminder'
import { isRecurringSchedule } from '@/features/reminders/domain/reminder'
import type { SoundSettings } from '@/features/settings/domain/settings'
import { nowIso, toIsoDate } from '@/shared/domain/primitives'
import type { AppSnapshot } from '@/shared/domain/snapshot'
import { touchSnapshot } from '@/shared/domain/snapshot'
import type { SnapshotRepository } from '../storage/sqlite-repository'

type TimerHandle = ReturnType<typeof setTimeout>

const maxTimeoutDelay = 2_147_000_000

const stripMarkdown = (value: string): string =>
  value
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')
    .replace(/[#>*_\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

const parseTime = (value: string): { readonly hours: number; readonly minutes: number } => {
  const [hoursText = '9', minutesText = '0'] = value.split(':')
  const hours = Number.parseInt(hoursText, 10)
  const minutes = Number.parseInt(minutesText, 10)

  return {
    hours: Number.isFinite(hours) ? Math.min(Math.max(hours, 0), 23) : 9,
    minutes: Number.isFinite(minutes) ? Math.min(Math.max(minutes, 0), 59) : 0,
  }
}

const nextDailyDate = (now: Date, time: string): Date => {
  const parsed = parseTime(time)
  const next = new Date(now)
  next.setHours(parsed.hours, parsed.minutes, 0, 0)

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

const nextWeeklyDate = (now: Date, weekday: number, time: string): Date => {
  const next = nextDailyDate(now, time)
  const daysUntilTarget = (weekday - next.getDay() + 7) % 7
  next.setDate(next.getDate() + daysUntilTarget)

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7)
  }

  return next
}

const randomDateInWindow = (now: Date, windowStart: string, windowEnd: string): Date => {
  const startTime = parseTime(windowStart)
  const endTime = parseTime(windowEnd)
  const start = new Date(now)
  const end = new Date(now)
  start.setHours(startTime.hours, startTime.minutes, 0, 0)
  end.setHours(endTime.hours, endTime.minutes, 0, 0)

  if (end.getTime() <= start.getTime()) {
    end.setDate(end.getDate() + 1)
  }

  if (end.getTime() <= now.getTime()) {
    start.setDate(start.getDate() + 1)
    end.setDate(end.getDate() + 1)
  }

  const floor = Math.max(start.getTime(), now.getTime() + 60_000)
  const span = Math.max(end.getTime() - floor, 60_000)
  return new Date(floor + randomInt(span))
}

const computeNextTrigger = (reminder: Reminder, now: Date): Date | null => {
  if (reminder.status !== 'active') {
    return null
  }

  const schedule = reminder.schedule

  switch (schedule.type) {
    case 'once': {
      if (reminder.lastTriggeredAt !== null) {
        return null
      }

      const dueAt = new Date(schedule.dueAt)
      return dueAt.getTime() <= now.getTime() ? new Date(now.getTime() + 1_000) : dueAt
    }
    case 'interval': {
      const startAt = new Date(schedule.startAt)
      const intervalMs = Math.max(schedule.everyMinutes, 1) * 60_000

      if (startAt.getTime() > now.getTime()) {
        return startAt
      }

      const elapsedIntervals = Math.floor((now.getTime() - startAt.getTime()) / intervalMs) + 1
      return new Date(startAt.getTime() + elapsedIntervals * intervalMs)
    }
    case 'daily':
      return nextDailyDate(now, schedule.time)
    case 'weekly':
      return nextWeeklyDate(now, schedule.weekday, schedule.time)
    case 'random':
      return randomDateInWindow(now, schedule.windowStart, schedule.windowEnd)
    default:
      return null
  }
}

const describeSchedule = (schedule: ReminderSchedule): string => {
  switch (schedule.type) {
    case 'once':
      return 'One-time reminder'
    case 'interval':
      return `Every ${schedule.everyMinutes} minutes`
    case 'daily':
      return `Daily at ${schedule.time}`
    case 'weekly':
      return `Weekly at ${schedule.time}`
    case 'random':
      return `Random between ${schedule.windowStart} and ${schedule.windowEnd}`
    default:
      return 'Reminder'
  }
}

export class ReminderScheduler {
  readonly #repository: SnapshotRepository
  readonly #getWindow: () => BrowserWindow | null
  readonly #timers = new Map<string, TimerHandle>()
  #sounds: SoundSettings | null = null

  constructor(repository: SnapshotRepository, getWindow: () => BrowserWindow | null) {
    this.#repository = repository
    this.#getWindow = getWindow
  }

  schedule(snapshot: AppSnapshot, sounds: SoundSettings): void {
    this.clear()
    this.#sounds = sounds

    for (const reminder of snapshot.reminders) {
      this.#scheduleReminder(reminder)
    }
  }

  clear(): void {
    for (const timer of this.#timers.values()) {
      clearTimeout(timer)
    }

    this.#timers.clear()
  }

  #scheduleReminder(reminder: Reminder): void {
    const nextTrigger = computeNextTrigger(reminder, new Date())
    if (nextTrigger === null) {
      return
    }

    const delay = Math.min(Math.max(nextTrigger.getTime() - Date.now(), 1_000), maxTimeoutDelay)
    const timer = setTimeout(() => this.#trigger(reminder.id), delay)
    this.#timers.set(reminder.id, timer)
  }

  #trigger(reminderId: string): void {
    this.#timers.delete(reminderId)

    const snapshot = this.#repository.load()
    if (snapshot === null) {
      return
    }

    const reminder = snapshot.reminders.find((item) => item.id === reminderId)
    if (reminder === undefined || reminder.status !== 'active') {
      return
    }

    const body = stripMarkdown(reminder.descriptionMarkdown) || describeSchedule(reminder.schedule)
    new Notification({
      title: reminder.title,
      body,
      silent: this.#sounds?.enabled === false,
    }).show()

    const nextReminder: Reminder = {
      ...reminder,
      status: isRecurringSchedule(reminder.schedule) ? 'active' : 'done',
      lastTriggeredAt: nowIso(),
      updatedAt: nowIso(),
    }

    const nextSnapshot = touchSnapshot({
      ...snapshot,
      reminders: snapshot.reminders.map((item) => (item.id === reminder.id ? nextReminder : item)),
    })

    this.#repository.save(nextSnapshot)
    this.#getWindow()?.webContents.send('reminders:triggered', {
      reminderId: reminder.id,
      snapshot: nextSnapshot,
    })
    this.#getWindow()?.webContents.send('app:snapshot-updated', nextSnapshot)

    if (isRecurringSchedule(nextReminder.schedule)) {
      this.#scheduleReminder({
        ...nextReminder,
        lastTriggeredAt: toIsoDate(new Date()),
      })
    }
  }
}

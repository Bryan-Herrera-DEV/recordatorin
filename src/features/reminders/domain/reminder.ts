import type { FolderId, TagId } from '@/features/workspace/domain/workspace'
import type { EntityId, ISODateString } from '@/shared/domain/primitives'
import { createEntityId, nowIso, sanitizeTitle } from '@/shared/domain/primitives'

export type ReminderId = EntityId<'ReminderId'>
export type ReminderStatus = 'active' | 'paused' | 'done'
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type ReminderSchedule =
  | {
      readonly type: 'once'
      readonly dueAt: ISODateString
    }
  | {
      readonly type: 'interval'
      readonly startAt: ISODateString
      readonly everyMinutes: number
    }
  | {
      readonly type: 'daily'
      readonly time: string
    }
  | {
      readonly type: 'weekly'
      readonly weekday: Weekday
      readonly time: string
    }
  | {
      readonly type: 'random'
      readonly windowStart: string
      readonly windowEnd: string
      readonly timesPerDay: number
    }

export type Reminder = {
  readonly id: ReminderId
  readonly title: string
  readonly descriptionMarkdown: string
  readonly schedule: ReminderSchedule
  readonly status: ReminderStatus
  readonly folderId: FolderId | null
  readonly tagIds: readonly TagId[]
  readonly createdAt: ISODateString
  readonly updatedAt: ISODateString
  readonly lastTriggeredAt: ISODateString | null
}

export type ReminderPatch = Partial<
  Pick<
    Reminder,
    'title' | 'descriptionMarkdown' | 'schedule' | 'status' | 'folderId' | 'tagIds' | 'lastTriggeredAt'
  >
>

export const createReminder = (input: {
  readonly title: string
  readonly folderId: FolderId | null
  readonly tagIds?: readonly TagId[]
}): Reminder => {
  const timestamp = nowIso()

  return {
    id: createEntityId<ReminderId>('reminder'),
    title: sanitizeTitle(input.title, 'Untitled reminder'),
    descriptionMarkdown: '',
    schedule: {
      type: 'once',
      dueAt: timestamp,
    },
    status: 'active',
    folderId: input.folderId,
    tagIds: input.tagIds ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastTriggeredAt: null,
  }
}

export const isRecurringSchedule = (schedule: ReminderSchedule): boolean =>
  schedule.type !== 'once'

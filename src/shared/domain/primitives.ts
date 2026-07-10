import { nanoid } from 'nanoid'

export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}

export type ISODateString = Brand<string, 'ISODateString'>
export type EntityId<TScope extends string> = Brand<string, TScope>

export const nowIso = (): ISODateString => new Date().toISOString() as ISODateString

export const toIsoDate = (date: Date): ISODateString => date.toISOString() as ISODateString

export const fromDateTimeInput = (value: string): ISODateString | null => {
  if (value.trim().length === 0) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : toIsoDate(date)
}

export const toDateTimeInput = (value: ISODateString | null): string => {
  if (value === null) {
    return ''
  }

  return value.slice(0, 16)
}

export const createEntityId = <TId extends string>(prefix: string): TId =>
  `${prefix}_${nanoid(12)}` as TId

export const sanitizeTitle = (value: string, fallback: string): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return trimmed.length > 0 ? trimmed.slice(0, 120) : fallback
}

export const normalizeSearchText = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const normalizeTagLabel = (value: string): string =>
  value
    .trim()
    .replace(/^#/, '')
    .replace(/\s+/g, '-')
    .toLocaleLowerCase()
    .slice(0, 40)

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

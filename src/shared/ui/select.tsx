import { Check, ChevronDown } from 'lucide-react'
import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

type SelectOption = {
  readonly value: string
  readonly label: string
  readonly disabled: boolean
}

const optionText = (value: ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map(optionText).join('')
  }

  if (isValidElement<{ readonly children?: ReactNode }>(value)) {
    return optionText(value.props.children)
  }

  return ''
}

const readOptions = (children: ReactNode): readonly SelectOption[] =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ readonly children?: ReactNode; readonly disabled?: boolean; readonly value?: string | number }>(child)) {
      return []
    }

    const label = optionText(child.props.children)
    return [
      {
        value: child.props.value === undefined ? label : String(child.props.value),
        label,
        disabled: child.props.disabled === true,
      },
    ]
  })

export function Select({ className, children, disabled, onChange, value, defaultValue, id, ...props }: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const options = readOptions(children)
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(() => String(defaultValue ?? options[0]?.value ?? ''))
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedValue = value === undefined ? internalValue : String(value)
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const closeOnOutsideClick = (event: PointerEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  const chooseOption = (nextValue: string): void => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }

    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen((current) => !current)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative w-full min-w-0', className)}>
      <select
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={selectedValue}
        onChange={(event) => chooseOption(event.target.value)}
        {...props}
      >
        {children}
      </select>

      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-controls={`${selectId}-listbox`}
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] px-3 py-2 text-left text-sm text-[var(--foreground)] shadow-sm outline-none transition hover:bg-[color-mix(in_srgb,var(--card)_88%,transparent)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{selectedOption?.label ?? ''}</span>
        <ChevronDown className={cn('size-4 shrink-0 opacity-60 transition', open ? 'rotate-180' : '')} />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full min-w-40 overflow-hidden rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] p-1 text-[var(--card-foreground)] shadow-2xl shadow-black/15 backdrop-blur-xl">
          <div id={`${selectId}-listbox`} role="listbox" className="shadcn-scrollbar max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === selectedValue}
                disabled={option.disabled}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 rounded-[calc(var(--radius)-12px)] px-2 py-2 text-left text-sm outline-none transition hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] focus:bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] disabled:pointer-events-none disabled:opacity-45',
                  option.value === selectedValue ? 'bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-[var(--foreground)]' : '',
                )}
                onClick={() => chooseOption(option.value)}
              >
                <Check className={cn('size-4 shrink-0', option.value === selectedValue ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

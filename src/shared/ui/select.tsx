import { Check, ChevronDown } from 'lucide-react'
import { Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, KeyboardEvent, ReactNode, SelectHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

type SelectOption = {
  readonly value: string
  readonly label: string
  readonly disabled: boolean
}

type MenuPosition = {
  readonly bottom?: number
  readonly left: number
  readonly maxHeight: number
  readonly placement: 'bottom' | 'top'
  readonly top?: number
  readonly width: number
}

const menuGap = 8
const viewportMargin = 8
const menuZIndex = 2_147_483_647

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
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedValue = value === undefined ? internalValue : String(value)
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0]

  const calculateMenuPosition = useCallback((): MenuPosition | null => {
    const trigger = buttonRef.current
    if (trigger === null || typeof window === 'undefined') {
      return null
    }

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const desiredHeight = Math.min(256, Math.max(48, options.length * 38 + 8))
    const availableBelow = viewportHeight - rect.bottom - viewportMargin - menuGap
    const availableAbove = rect.top - viewportMargin - menuGap
    const placement: MenuPosition['placement'] = desiredHeight > availableBelow && availableAbove > availableBelow ? 'top' : 'bottom'
    const availableHeight = placement === 'top' ? availableAbove : availableBelow
    const maxHeight = Math.max(48, Math.min(desiredHeight, availableHeight))
    const width = Math.min(Math.max(rect.width, 160), Math.max(160, viewportWidth - viewportMargin * 2))
    const left = Math.min(Math.max(rect.left, viewportMargin), Math.max(viewportMargin, viewportWidth - width - viewportMargin))

    if (placement === 'top') {
      return {
        bottom: viewportHeight - rect.top + menuGap,
        left,
        maxHeight,
        placement,
        width,
      }
    }

    return {
      left,
      maxHeight,
      placement,
      top: rect.bottom + menuGap,
      width,
    }
  }, [options.length])

  const toggleOpen = (): void => {
    if (open) {
      setOpen(false)
      return
    }

    setMenuPosition(calculateMenuPosition())
    setOpen(true)
  }

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const closeOnOutsideClick = (event: PointerEvent): void => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) === true || menuRef.current?.contains(target) === true) {
        return
      }

      setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      return undefined
    }

    const updatePosition = (): void => {
      setMenuPosition(calculateMenuPosition())
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [calculateMenuPosition, open])

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
      toggleOpen()
    }
  }

  const menuStyle: CSSProperties | undefined = menuPosition === null
    ? undefined
    : {
        bottom: menuPosition.bottom,
        left: menuPosition.left,
        top: menuPosition.top,
        width: menuPosition.width,
        zIndex: menuZIndex,
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
        ref={buttonRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-controls={`${selectId}-listbox`}
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] px-3 py-2 text-left text-sm text-[var(--foreground)] shadow-sm outline-none transition hover:bg-[color-mix(in_srgb,var(--card)_88%,transparent)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{selectedOption?.label ?? ''}</span>
        <ChevronDown className={cn('size-4 shrink-0 opacity-60 transition', open ? 'rotate-180' : '')} />
      </button>

      {open && menuPosition !== null ? createPortal(
        <div
          ref={menuRef}
          className="fixed min-w-40 overflow-hidden rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] p-1 text-[var(--card-foreground)] shadow-2xl shadow-black/15 backdrop-blur-xl"
          style={menuStyle}
        >
          <div id={`${selectId}-listbox`} role="listbox" className="shadcn-scrollbar overflow-y-auto" style={{ maxHeight: menuPosition.maxHeight }}>
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
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type HelpHintProps = {
  readonly label: string
  readonly children: ReactNode
  readonly className?: string
}

export function HelpHint({ label, children, className }: HelpHintProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)

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

  return (
    <span ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="grid size-5 place-items-center rounded-full border border-[var(--border)] bg-white/25 text-[11px] font-black leading-none text-[var(--foreground)] shadow-sm transition hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40"
        onClick={(event) => {
          event.preventDefault()
          setOpen((current) => !current)
        }}
      >
        ?
      </button>
      {open ? (
        <span className="absolute left-1/2 top-7 z-50 block w-64 -translate-x-1/2 rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_96%,transparent)] p-3 text-left text-xs font-medium leading-5 text-[var(--card-foreground)] shadow-2xl shadow-black/15 backdrop-blur-xl">
          {children}
        </span>
      ) : null}
    </span>
  )
}

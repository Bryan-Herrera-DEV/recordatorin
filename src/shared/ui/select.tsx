import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <select
        className="flex min-h-10 w-full min-w-0 appearance-none items-center rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_72%,transparent)] px-3 py-2 pr-10 text-left text-sm text-[var(--foreground)] shadow-sm outline-none transition hover:bg-[color-mix(in_srgb,var(--card)_88%,transparent)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-60" />
    </div>
  )
}

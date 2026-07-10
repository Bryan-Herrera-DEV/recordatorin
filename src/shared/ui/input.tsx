import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-white/45 px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30',
        className,
      )}
      {...props}
    />
  )
}

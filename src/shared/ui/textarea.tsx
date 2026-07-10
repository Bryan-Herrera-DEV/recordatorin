import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type TextareaProps = Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full resize-y rounded-[calc(var(--radius)-8px)] border border-[var(--border)] bg-white/45 px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30',
        className,
      )}
      {...props}
    />
  )
}

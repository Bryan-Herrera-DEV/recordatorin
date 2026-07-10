import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type BadgeProps = HTMLAttributes<HTMLSpanElement>

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/35 bg-white/25 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]',
        className,
      )}
      {...props}
    />
  )
}

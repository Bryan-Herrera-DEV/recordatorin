import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('glass-panel rounded-[var(--radius)] p-4', className)} {...props} />
}

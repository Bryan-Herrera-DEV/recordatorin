import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type ScrollAreaProps = Readonly<HTMLAttributes<HTMLDivElement>>

export function ScrollArea({ className, ...props }: ScrollAreaProps) {
  return <div className={cn('shadcn-scrollbar min-h-0 overflow-y-auto', className)} {...props} />
}

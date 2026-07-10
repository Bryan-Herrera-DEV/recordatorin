import type { ReactNode } from 'react'
import { Card } from './card'

export type EmptyStateProps = {
  readonly title: string
  readonly description?: string
  readonly action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="grid min-h-56 place-items-center text-center">
      <div className="max-w-sm space-y-3">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
        {description ? <p className="text-sm opacity-70">{description}</p> : null}
        {action}
      </div>
    </Card>
  )
}

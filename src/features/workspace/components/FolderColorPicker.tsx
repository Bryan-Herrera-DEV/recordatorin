import type { ThemeColors } from '@/features/settings/domain/settings'
import { createFolderColorPalette } from '@/features/workspace/domain/folder-colors'
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/ui/input'

export type FolderColorPickerProps = {
  readonly colors: ThemeColors
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly className?: string
}

export function FolderColorPicker({ className, colors, label, onChange, value }: FolderColorPickerProps) {
  const palette = createFolderColorPalette(colors)

  return (
    <div className={cn('grid gap-2 text-sm font-medium', className)}>
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <Input type="color" className="size-10 shrink-0 p-1" value={value} onChange={(event) => onChange(event.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {palette.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${label} ${color}`}
              className={cn(
                'size-7 rounded-full border border-white/45 shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40',
                color === value ? 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-transparent' : '',
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

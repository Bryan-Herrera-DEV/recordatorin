import type { ButtonHTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-[calc(var(--radius)-6px)] text-center text-sm font-medium leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-black/10 hover:brightness-105',
        secondary: 'glass-panel text-[var(--foreground)] hover:bg-white/35',
        ghost: 'text-[var(--foreground)] hover:bg-white/20',
        destructive: 'bg-rose-500 text-white hover:bg-rose-600',
      },
      size: {
        sm: 'min-h-8 px-3 py-1.5',
        md: 'min-h-10 px-4 py-2',
        lg: 'min-h-12 px-5 py-2.5 text-base',
        icon: 'size-10 shrink-0 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

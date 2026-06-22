import React from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "outline" | "ghost"
  asChild?: boolean
}

function Button({ className, variant = "default", asChild, children, ...props }: ButtonProps) {
  const base =
    'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'

  const variants: Record<string, string> = {
    default: 'h-8 gap-1.5 px-2.5 bg-primary text-primary-foreground',
    outline: 'h-8 gap-1.5 px-2.5 border-border bg-background',
    ghost: 'h-8 gap-1.5 px-2.5',
  }

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement
    return React.cloneElement(child, {
      ...props,
      className: cn(base, variants[variant], className, child.props.className),
    })
  }

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

export { Button }

import { QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  iconSize = 20,
}: {
  className?: string
  iconSize?: number
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <QrCode size={iconSize} aria-hidden="true" />
      </span>
      <span className="text-foreground">
        Asist<span className="text-primary">QR</span>
      </span>
    </span>
  )
}

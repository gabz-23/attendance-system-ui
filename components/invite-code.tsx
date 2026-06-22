"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

export function InviteCode({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn("flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2", className)}>
      <code className="font-mono text-sm font-semibold tracking-widest text-foreground">{code}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Código copiado" : "Copiar código de invitación"}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-primary"
      >
        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
      </button>
    </div>
  )
}

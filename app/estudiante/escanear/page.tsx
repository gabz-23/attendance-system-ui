"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function ScanPage() {
  const [tab, setTab] = useState("camera")

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Escanear QR</h1>
        <p className="mb-6 text-sm text-muted-foreground">Marca tu asistencia escaneando el código de tu profesor</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="camera" className="flex-1">
              Cámara
            </TabsTrigger>
            <TabsTrigger value="success" className="flex-1">
              Éxito
            </TabsTrigger>
            <TabsTrigger value="error" className="flex-1">
              Error
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera">
            <CameraState />
          </TabsContent>
          <TabsContent value="success">
            <SuccessState />
          </TabsContent>
          <TabsContent value="error">
            <ErrorState />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function CameraState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[300px] w-full overflow-hidden rounded-xl bg-[oklch(0.22_0.01_160)]">
        {/* Scanning frame */}
        <div className="absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-0 top-0 size-8 rounded-tl-lg border-l-4 border-t-4 border-primary" />
          <span className="absolute right-0 top-0 size-8 rounded-tr-lg border-r-4 border-t-4 border-primary" />
          <span className="absolute bottom-0 left-0 size-8 rounded-bl-lg border-b-4 border-l-4 border-primary" />
          <span className="absolute bottom-0 right-0 size-8 rounded-br-lg border-b-4 border-r-4 border-primary" />
          <span className="absolute inset-x-0 h-0.5 animate-scan-line bg-primary shadow-[0_0_8px_2px_var(--primary)]" />
        </div>
        <p className="absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white/80">
          Apunta la cámara al código QR
        </p>
      </div>

      <p className="text-sm text-muted-foreground">Asegúrate de tener buena iluminación</p>

      <Button asChild variant="ghost" className="w-full">
        <Link href="/estudiante">Cancelar</Link>
      </Button>
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-20 animate-pop-in items-center justify-center rounded-full bg-primary/10">
        <Check className="size-10 text-primary" strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-bold text-foreground">¡Asistencia registrada!</h2>
      <p className="text-lg font-medium text-foreground">Matemáticas II</p>
      <p className="text-sm text-muted-foreground">Hoy, 7:03 AM</p>
      <Button asChild className="mt-4 w-full">
        <Link href="/estudiante">Volver a mis aulas</Link>
      </Button>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-20 animate-pop-in items-center justify-center rounded-full bg-destructive/10">
        <X className="size-10 text-destructive" strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-bold text-foreground">No se pudo registrar</h2>
      <p className="text-pretty text-sm text-muted-foreground">Este código QR ha expirado</p>
      <div className="mt-4 flex w-full flex-col gap-2">
        <Button>Intentar de nuevo</Button>
        <Button asChild variant="ghost">
          <Link href="/estudiante">Volver a mis aulas</Link>
        </Button>
      </div>
    </div>
  )
}

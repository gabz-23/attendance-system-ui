"use client"

import { useState, useCallback, useRef, useEffect, Suspense, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, X, RefreshCw, Loader2 } from "lucide-react"
import QrScanner from "qr-scanner"
import { TopNav } from "@/components/top-nav"
import { Button } from "@/components/ui/button"

type ScanResult = "scanning" | "success" | "error"

interface SuccessData {
  subject: string
  name: string
  time: string
}

function parseQrUrl(data: string, fallbackClassroom?: string | null) {
  try {
    const url = new URL(data, window.location.origin)
    if (!url.pathname.includes("/estudiante/escanear")) return null

    const session = url.searchParams.get("session")
    const classroom = url.searchParams.get("classroom") ?? fallbackClassroom ?? null
    if (!session || !classroom) return null

    const t = url.searchParams.get("t")
    const exp = url.searchParams.get("exp")
    return {
      session,
      classroom,
      t: t ? Number(t) : undefined,
      exp: exp !== null && exp !== "" ? Number(exp) : undefined,
    }
  } catch {
    return null
  }
}

function cameraErrorMessage(err: unknown) {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  if (message.includes("NotAllowedError") || message.includes("Permission denied")) {
    return "Permiso de cámara denegado. Activa la cámara en los ajustes de tu navegador e inténtalo de nuevo."
  }
  if (message.includes("NotFoundError")) {
    return "No se encontró ninguna cámara en este dispositivo."
  }
  if (message.includes("NotReadableError")) {
    return "La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo."
  }
  return "No se pudo acceder a la cámara. Verifica que el sitio tenga permiso de cámara."
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanShell />}>
      <ScanPageContent />
    </Suspense>
  )
}

function ScanShell({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Escanear QR</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Marca tu asistencia escaneando el código de tu profesor
        </p>
        {children}
      </main>
    </div>
  )
}

function ScanPageContent() {
  const searchParams = useSearchParams()
  const prefilledClassroom = searchParams.get("classroom")

  const [result, setResult] = useState<ScanResult>("scanning")
  const [errorMessage, setErrorMessage] = useState("")
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  const handleScanSuccess = useCallback((data: SuccessData) => {
    setSuccessData(data)
    setResult("success")
  }, [])

  const handleScanError = useCallback((message: string) => {
    setErrorMessage(message)
    setResult("error")
  }, [])

  const handleRetry = useCallback(() => {
    setResult("scanning")
    setErrorMessage("")
    setSuccessData(null)
  }, [])

  return (
    <ScanShell>
      {result === "scanning" && (
        <CameraState
          prefilledClassroom={prefilledClassroom}
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />
      )}
      {result === "success" && successData && (
        <SuccessState data={successData} onScanAgain={handleRetry} />
      )}
      {result === "error" && <ErrorState message={errorMessage} onRetry={handleRetry} />}
    </ScanShell>
  )
}

function CameraState({
  prefilledClassroom,
  onScanSuccess,
  onScanError,
}: {
  prefilledClassroom: string | null
  onScanSuccess: (data: SuccessData) => void
  onScanError: (message: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const handlingRef = useRef(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let qrScanner: QrScanner

    const handleDecode = async (result: QrScanner.ScanResult) => {
      if (handlingRef.current) return
      const parsed = parseQrUrl(result.data, prefilledClassroom)
      if (!parsed) return

      handlingRef.current = true
      setProcessing(true)
      qrScanner.stop()

      try {
        const res = await fetch("/api/attendance/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: parsed.session,
            classroom: parsed.classroom,
            t: parsed.t,
            exp: parsed.exp,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json.error ?? "No se pudo registrar la asistencia.")
        }
        onScanSuccess({
          subject: json.classroom?.subject ?? "",
          name: json.classroom?.name ?? "",
          time: json.time ?? "",
        })
      } catch (e) {
        onScanError(e instanceof Error ? e.message : "No se pudo registrar la asistencia.")
      }
    }

    try {
      qrScanner = new QrScanner(video, handleDecode, {
        preferredCamera: "environment",
        highlightScanRegion: false,
        maxScansPerSecond: 5,
      })
    } catch {
      onScanError(cameraErrorMessage(null))
      return
    }

    const handleLoadedMetadata = () => setCameraReady(true)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)

    qrScanner.start().catch((err) => {
      console.error("Camera error:", err)
      onScanError(cameraErrorMessage(err))
    })

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      qrScanner.stop()
      qrScanner.destroy()
    }
  }, [prefilledClassroom, onScanSuccess, onScanError])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[300px] w-full overflow-hidden rounded-xl bg-[oklch(0.22_0.01_160)]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 size-full object-cover"
        />

        {!cameraReady && !processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-white/70" />
            <p className="text-sm font-medium text-white/80">Preparando cámara...</p>
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
            <Loader2 className="size-8 animate-spin text-white" />
            <p className="text-sm font-medium text-white">Registrando asistencia...</p>
          </div>
        )}

        {/* Scanning frame */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-48 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-0 top-0 size-8 rounded-tl-lg border-l-4 border-t-4 border-primary" />
          <span className="absolute right-0 top-0 size-8 rounded-tr-lg border-r-4 border-t-4 border-primary" />
          <span className="absolute bottom-0 left-0 size-8 rounded-bl-lg border-b-4 border-l-4 border-primary" />
          <span className="absolute bottom-0 right-0 size-8 rounded-br-lg border-b-4 border-r-4 border-primary" />
          <span className="absolute inset-x-0 h-0.5 animate-scan-line bg-primary shadow-[0_0_8px_2px_var(--primary)]" />
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white/80">
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

function SuccessState({ data, onScanAgain }: { data: SuccessData; onScanAgain: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-20 animate-pop-in items-center justify-center rounded-full bg-primary/10">
        <Check className="size-10 text-primary" strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-bold text-foreground">¡Asistencia registrada!</h2>
      <p className="text-lg font-medium text-foreground">{data.subject}</p>
      <p className="text-sm text-muted-foreground">{data.name}</p>
      <p className="text-sm text-muted-foreground">Hoy, {formatTime(data.time)}</p>
      <div className="mt-4 flex w-full flex-col gap-2">
        <Button onClick={onScanAgain} variant="outline">
          <RefreshCw className="size-4" />
          Escanear otro QR
        </Button>
        <Button asChild>
          <Link href="/estudiante">Volver a mis aulas</Link>
        </Button>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-20 animate-pop-in items-center justify-center rounded-full bg-destructive/10">
        <X className="size-10 text-destructive" strokeWidth={3} />
      </div>
      <h2 className="text-2xl font-bold text-foreground">No se pudo registrar</h2>
      <p className="text-pretty text-sm text-muted-foreground">{message}</p>
      <div className="mt-4 flex w-full flex-col gap-2">
        <Button onClick={onRetry}>
          <RefreshCw className="size-4" />
          Intentar de nuevo
        </Button>
        <Button asChild variant="ghost">
          <Link href="/estudiante">Volver a mis aulas</Link>
        </Button>
      </div>
    </div>
  )
}

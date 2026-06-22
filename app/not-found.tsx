import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <main className="mx-auto flex max-w-md flex-col items-center px-4 text-center">
        <p className="text-8xl font-bold text-muted-foreground/20">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
        </Button>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { LogOut, User } from "lucide-react"
import { Logo } from "@/components/logo"
import { useRole } from "@/components/role-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function TopNav() {
  const { user } = useRole()
  const home = user?.role === "professor" ? "/profesor" : "/estudiante"
  const roleLabel = user?.role === "professor" ? "Profesor" : "Estudiante"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href={home} aria-label="Ir al inicio">
          <Logo />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                {user ? initials(user.name) : <User className="size-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-foreground">{user?.name ?? "..."}</span>
              <span className="block text-xs leading-tight text-muted-foreground">{roleLabel}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="block text-sm font-medium text-foreground">{user?.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/perfil" />}>
              <User className="size-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<a href="/api/auth/signout" />}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

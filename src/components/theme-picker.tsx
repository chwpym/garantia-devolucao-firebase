"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Palette, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themes = [
  { id: "light", name: "Claro", icon: Sun, color: "bg-white" },
  { id: "dark", name: "Escuro", icon: Moon, color: "bg-slate-950" },
  { id: "tokyo", name: "Tokyo Night", icon: Palette, color: "bg-[#1a1b26]" },
  { id: "ayu", name: "Ayu Dark", icon: Palette, color: "bg-[#0d1017]" },
  { id: "dracula", name: "Dracula", icon: Palette, color: "bg-[#282a36]" },
]

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Palette className="h-5 w-5 opacity-50" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5 rotate-0 scale-100 transition-all" />
          <span className="sr-only">Escolher tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Temas Disponíveis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              theme === t.id && "bg-accent text-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full border", t.color)} />
              <span>{t.name}</span>
            </div>
            {theme === t.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

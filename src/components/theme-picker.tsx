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
  {
    id: "light",
    name: "Manhã Tempestuosa",
    subtitle: "Claro • Azul Ardósia",
    group: "light",
    icon: Sun,
    bgHex: "#F2F6FA",
    primaryHex: "#3D5266",
  },
  {
    id: "salt",
    name: "Sal & Pimenta",
    subtitle: "Claro • Minimalista",
    group: "light",
    icon: Sun,
    bgHex: "#FFFFFF",
    primaryHex: "#2B2B30",
  },
  {
    id: "dark",
    name: "Tempestade Noturna",
    subtitle: "Escuro • Azul Céu",
    group: "dark",
    icon: Moon,
    bgHex: "#161E27",
    primaryHex: "#82B9F0",
  },
  {
    id: "pepper",
    name: "Pimenta Preta (Onyx)",
    subtitle: "Escuro • Grafite Matte",
    group: "dark",
    icon: Moon,
    bgHex: "#161618",
    primaryHex: "#D4D4D8",
  },
  {
    id: "dracula",
    name: "Dracula",
    subtitle: "Escuro • Lavanda Suave",
    group: "dark",
    icon: Palette,
    bgHex: "#272935",
    primaryHex: "#9E8CFC",
  },
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
        <Button variant="ghost" size="icon" className="relative" title="Escolher tema visual">
          <Palette className="h-5 w-5 rotate-0 scale-100 transition-all" />
          <span className="sr-only">Escolher tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Temas Claros
        </DropdownMenuLabel>
        {themes
          .filter((t) => t.group === "light")
          .map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer py-2",
                theme === t.id && "bg-accent text-accent-foreground font-medium"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full border border-border shadow-xs flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${t.bgHex} 50%, ${t.primaryHex} 50%)`,
                  }}
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.subtitle}</span>
                </div>
              </div>
              {theme === t.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Temas Escuros
        </DropdownMenuLabel>
        {themes
          .filter((t) => t.group === "dark")
          .map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex items-center justify-between cursor-pointer py-2",
                theme === t.id && "bg-accent text-accent-foreground font-medium"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full border border-border shadow-xs flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${t.bgHex} 50%, ${t.primaryHex} 50%)`,
                  }}
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.subtitle}</span>
                </div>
              </div>
              {theme === t.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

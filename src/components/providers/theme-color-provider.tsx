"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

export type ThemeColor = "zinc" | "red" | "blue" | "green" | "orange"

interface ThemeColorContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined)

// Define the OKLCH values for different themes (Light and Dark)
// based on standard Tailwind/Shadcn colors.
const colorPresets = {
  zinc: {
    light: { primary: "0.205 0 0" }, // black-ish
    dark: { primary: "0.985 0 0" }, // white-ish
  },
  red: {
    light: { primary: "0.577 0.245 27.325" },
    dark: { primary: "0.6 0.2 25" },
  },
  blue: {
    light: { primary: "0.45 0.15 250" },
    dark: { primary: "0.6 0.15 250" },
  },
  green: {
    light: { primary: "0.5 0.15 150" },
    dark: { primary: "0.6 0.15 150" },
  },
  orange: {
    light: { primary: "0.68 0.19 45" },
    dark: { primary: "0.72 0.17 45" },
  }
}

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>("orange")
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    // Load from localStorage on mount
    const savedColor = localStorage.getItem("theme-color") as ThemeColor
    if (savedColor && Object.keys(colorPresets).includes(savedColor)) {
      setThemeColorState(savedColor)
    }
  }, [])

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color)
    localStorage.setItem("theme-color", color)
  }

  useEffect(() => {
    const root = document.documentElement
    const isDark = resolvedTheme === "dark"
    
    // Apply the color
    const preset = colorPresets[themeColor]
    if (preset) {
      const modeData = isDark ? preset.dark : preset.light
      // Shadcn uses --primary for the main brand color
      root.style.setProperty("--primary", `oklch(${modeData.primary})`)
      root.style.setProperty("--primary-foreground", "oklch(1 0 0)")
      
      // Optionally also set --sidebar-primary for the sidebar specifically
      root.style.setProperty("--sidebar-primary", `oklch(${modeData.primary})`)
      root.style.setProperty("--sidebar-primary-foreground", "oklch(1 0 0)")
    }
  }, [themeColor, resolvedTheme])

  return (
    <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeColorContext.Provider>
  )
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext)
  if (context === undefined) {
    throw new Error("useThemeColor must be used within a ThemeColorProvider")
  }
  return context
}

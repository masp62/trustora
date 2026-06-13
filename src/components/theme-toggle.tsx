"use client";

import { Palette } from "lucide-react";

import { useTheme, type Theme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes: { value: Theme; label: string }[] = [
  { value: "tropical", label: "Clean & Tropical" },
  { value: "ocean", label: "Ocean & Sand" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-700 hover:bg-gray-100"
          aria-label="Switch color theme"
        >
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onSelect={() => setTheme(t.value)}
            className={`cursor-pointer ${theme === t.value ? "font-semibold" : ""}`}
          >
            {t.label}
            {theme === t.value && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="테마 변경">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun /> 라이트
          {theme === "light" && <Check className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon /> 다크
          {theme === "dark" && <Check className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop /> 시스템
          {theme === "system" && <Check className="ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

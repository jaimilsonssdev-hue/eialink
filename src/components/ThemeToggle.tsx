import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type InterfaceTheme = "light" | "dark";

const STORAGE_KEY = "eialink-interface-theme";

function getInitialTheme(): InterfaceTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: InterfaceTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.interfaceTheme = theme;
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#09080d" : "#f6f7fb");
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<InterfaceTheme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? "Usar modo escuro" : "Usar modo claro";

  return (
    <button
      type="button"
      className={`interface-theme-toggle ${compact ? "is-compact" : ""}`}
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      <span className="interface-theme-toggle-icon" aria-hidden="true">
        {theme === "dark" ? <Moon /> : <Sun />}
      </span>
      {!compact && <span>{theme === "dark" ? "Escuro" : "Claro"}</span>}
    </button>
  );
}

import type { ThemeTokens } from "../types";
export const defaultTheme: ThemeTokens = {
  colors: {
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#6b3fff",
  },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" },
  radius: { sm: "8px", md: "12px", lg: "20px", full: "999px" },
  shadows: {
    sm: "0 1px 2px rgb(15 23 42 / 8%)",
    md: "0 8px 20px rgb(15 23 42 / 12%)",
    lg: "0 20px 40px rgb(15 23 42 / 16%)",
  },
  typography: { fontFamily: "inherit", headingSize: "1.5rem", bodySize: "1rem" },
  iconStyle: "rounded",
};

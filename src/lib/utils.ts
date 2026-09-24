import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePrice(price: unknown): number | null {
  if (price === null || price === undefined || price === "") return null;
  if (typeof price === "number") {
    return isNaN(price) ? null : price;
  }
  if (typeof price === "string") {
    const clean = price.replace(/[^\d.,]/g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function formatPrice(price: unknown, fallback: string | null = null): string | null {
  const num = parsePrice(price);
  if (num === null) return fallback;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
}

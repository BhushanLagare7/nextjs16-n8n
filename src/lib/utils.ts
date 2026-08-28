import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names, resolving Tailwind conflicts intelligently.
 * Combines clsx (conditional classes) with tailwind-merge (dedupe/override).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

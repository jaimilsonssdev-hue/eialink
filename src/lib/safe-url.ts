/**
 * User supplied links are rendered on public pages. Only allow schemes that
 * browsers can safely navigate to; this blocks javascript:, data: and other
 * executable protocols even if invalid legacy data exists in the database.
 */
export function safeExternalUrl(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

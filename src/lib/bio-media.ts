import { supabase } from "@/integrations/supabase/client";

const BIO_MEDIA_MARKERS = [
  "/storage/v1/object/public/bio-media/",
  "/storage/v1/object/sign/bio-media/",
];

export function bioMediaPath(value?: string | null): string | null {
  if (!value) return null;
  for (const marker of BIO_MEDIA_MARKERS) {
    const markerIndex = value.indexOf(marker);
    if (markerIndex >= 0) {
      const encodedPath = value.slice(markerIndex + marker.length).split("?")[0];
      try {
        return decodeURIComponent(encodedPath);
      } catch {
        return encodedPath;
      }
    }
  }
  return null;
}

export async function resolveBioMediaUrl(value?: string | null): Promise<string | null> {
  const path = bioMediaPath(value);
  if (!path) return value ?? null;

  const { data, error } = await supabase.storage.from("bio-media").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
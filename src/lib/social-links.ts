import { z } from "zod";
import { safeExternalUrl } from "@/lib/safe-url";

export const SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
  "youtube",
  "website",
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

const instagramHandle = /^@?[a-zA-Z0-9._]{1,30}$/;
const socialLinkValue = z
  .string()
  .trim()
  .max(500, "Cada link social pode ter no máximo 500 caracteres.")
  .refine((value) => Boolean(safeExternalUrl(value)), "Use um endereço iniciado por https://.");

export const socialLinksSchema = z
  .object({
    instagram: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => instagramHandle.test(value) || Boolean(safeExternalUrl(value)),
        "Informe um @usuário do Instagram ou um endereço iniciado por https://.",
      )
      .optional(),
    facebook: socialLinkValue.optional(),
    tiktok: socialLinkValue.optional(),
    linkedin: socialLinkValue.optional(),
    youtube: socialLinkValue.optional(),
    website: socialLinkValue.optional(),
  })
  .passthrough();


export function parseSocialLinks(value: unknown) {
  return socialLinksSchema.safeParse(value);
}

export function socialHref(network: SocialNetwork, value: string) {
  const trimmed = value.trim();
  if (network === "instagram" && instagramHandle.test(trimmed)) {
    return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
  }
  return safeExternalUrl(trimmed);
}

export function socialEntries(value: unknown, legacyInstagram?: string | null) {
  const parsed = parseSocialLinks(value);
  const socialLinks = parsed.success ? parsed.data : {};
  const instagram = socialLinks.instagram || legacyInstagram || undefined;
  return SOCIAL_NETWORKS.flatMap((network) => {
    const raw = network === "instagram" ? instagram : socialLinks[network];
    const href = raw ? socialHref(network, raw) : null;
    return href ? [{ network, href }] : [];
  });
}

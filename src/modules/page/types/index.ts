export type PageProfile = {
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  instagram: string | null;
};
export type PageAppearance = {
  theme: string;
  coverUrl: string | null;
  coverPosition: string;
  coverFit: string;
  coverOverlay: boolean;
  coverOverlayOpacity: number;
};
export type PageSettings = {
  slug: string;
  published: boolean;
  whatsapp: string | null;
  pixKey: string | null;
};

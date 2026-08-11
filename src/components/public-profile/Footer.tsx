import { Sparkles } from "lucide-react";
import { useShowEialinkBranding } from "./BrandingContext";

export function Footer() {
  const showBranding = useShowEialinkBranding();
  if (!showBranding) return null;
  return (
    <footer className="public-profile-footer">
      <a href="/" className="inline-flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> Criado com EIA Digital
      </a>
    </footer>
  );
}

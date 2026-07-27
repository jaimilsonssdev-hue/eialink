import { Instagram } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PublicBio, TrackEvent } from "./types";

interface ProfileHeaderProps {
  bio: PublicBio;
  onTrack: TrackEvent;
}

export function ProfileHeader({ bio, onTrack }: ProfileHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const instagram = bio.instagram?.replace("@", "");

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;
    const checkOverflow = () => setCanExpand(element.scrollHeight > element.clientHeight + 1);
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [bio.description]);

  return (
    <header className="public-profile-header">
      <div className="public-profile-avatar-wrap">
        {bio.avatar_url ? (
          <img
            src={bio.avatar_url}
            alt={bio.display_name}
            className="public-profile-avatar"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div
            className="public-profile-avatar public-profile-avatar-fallback"
            aria-label={bio.display_name}
          >
            {bio.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <h1 className="public-profile-name">{bio.display_name}</h1>

      {bio.description && (
        <div className="mx-auto mt-2 max-w-lg">
          <p
            ref={descriptionRef}
            className={
              expanded
                ? "public-profile-description"
                : "public-profile-description public-profile-description-clamped"
            }
          >
            {bio.description}
          </p>
          {canExpand && (
            <button
              type="button"
              className="public-profile-more"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </div>
      )}

      {instagram && (
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onTrack("instagram_click")}
          className="public-profile-instagram"
        >
          <Instagram className="h-4 w-4" /> @{instagram}
        </a>
      )}
    </header>
  );
}

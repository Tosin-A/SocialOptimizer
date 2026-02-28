import { SiTiktok, SiInstagram, SiYoutube, SiFacebook } from "react-icons/si";
import type { IconType } from "react-icons";

const PLATFORM_ICON_MAP: Record<string, { icon: IconType; color: string }> = {
  tiktok:    { icon: SiTiktok,    color: "#25F4EE" },
  instagram: { icon: SiInstagram, color: "#E4405F" },
  youtube:   { icon: SiYoutube,   color: "#FF0000" },
  facebook:  { icon: SiFacebook,  color: "#1877F2" },
};

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
}

export default function PlatformIcon({ platform, size = 18, className }: PlatformIconProps) {
  const entry = PLATFORM_ICON_MAP[platform];
  if (!entry) {
    return <span className={className} style={{ fontSize: size, lineHeight: 1 }}>&#x1F310;</span>;
  }
  const Icon = entry.icon;
  return <Icon size={size} color={entry.color} className={className} />;
}

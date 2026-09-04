import { Globe, Newspaper } from "lucide-react";

export interface PlatformStyle {
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  containerBg: string;
}

export const PLATFORM_CONFIG: Record<string, PlatformStyle> = {
  twitter: {
    label: "Twitter",
    color: "#1DA1F2",
    badgeBg: "bg-[#1DA1F2]/10 dark:bg-[#1DA1F2]/15",
    badgeBorder: "border-[#1DA1F2]/30 hover:border-[#1DA1F2]/50",
    badgeText: "text-[#1DA1F2]",
    containerBg: "bg-[#1DA1F2]/15 text-[#1DA1F2] border-[#1DA1F2]/25",
  },
  reddit: {
    label: "Reddit",
    color: "#FF4500",
    badgeBg: "bg-[#FF4500]/10 dark:bg-[#FF4500]/15",
    badgeBorder: "border-[#FF4500]/30 hover:border-[#FF4500]/50",
    badgeText: "text-[#FF4500]",
    containerBg: "bg-[#FF4500]/15 text-[#FF4500] border-[#FF4500]/25",
  },
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    badgeBg: "bg-[#FF0000]/10 dark:bg-[#FF0000]/15",
    badgeBorder: "border-[#FF0000]/30 hover:border-[#FF0000]/50",
    badgeText: "text-[#FF0000]",
    containerBg: "bg-[#FF0000]/15 text-[#FF0000] border-[#FF0000]/25",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    badgeBg: "bg-[#0A66C2]/10 dark:bg-[#0A66C2]/15",
    badgeBorder: "border-[#0A66C2]/30 hover:border-[#0A66C2]/50",
    badgeText: "text-[#0A66C2]",
    containerBg: "bg-[#0A66C2]/15 text-[#0A66C2] border-[#0A66C2]/25",
  },
  medium: {
    label: "Medium",
    color: "#00AB6C",
    badgeBg: "bg-[#00AB6C]/10 dark:bg-[#00AB6C]/15",
    badgeBorder: "border-[#00AB6C]/30 hover:border-[#00AB6C]/50",
    badgeText: "text-[#00AB6C]",
    containerBg: "bg-[#00AB6C]/15 text-[#00AB6C] border-[#00AB6C]/25",
  },
  tumblr: {
    label: "Tumblr",
    color: "#35465C",
    badgeBg: "bg-[#35465C]/15 dark:bg-[#35465C]/25",
    badgeBorder: "border-[#35465C]/30 hover:border-[#35465C]/50",
    badgeText: "text-[#35465C] dark:text-zinc-300",
    containerBg: "bg-[#35465C]/20 text-[#35465C] dark:text-zinc-200 border-[#35465C]/30",
  },
  news: {
    label: "News",
    color: "#6366F1",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    badgeBorder: "border-indigo-500/30 hover:border-indigo-500/50",
    badgeText: "text-indigo-600 dark:text-indigo-400",
    containerBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
  },
};

const DEFAULT_STYLE: PlatformStyle = {
  label: "Web",
  color: "#64748B",
  badgeBg: "bg-muted",
  badgeBorder: "border-border",
  badgeText: "text-muted-foreground",
  containerBg: "bg-muted text-muted-foreground border-border",
};

export function getPlatformStyle(platform: string): PlatformStyle {
  return PLATFORM_CONFIG[(platform || "").toLowerCase()] || { ...DEFAULT_STYLE, label: platform || "Web" };
}

export function platformLabel(platform: string): string {
  return getPlatformStyle(platform).label;
}

/* ──────────────────── Authentic Platform SVG Logos ──────────────────── */

export function TwitterLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" />
    </svg>
  );
}

export function YoutubeLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
    </svg>
  );
}

export function RedditLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="12" fill="#FF4500" />
      <path
        d="M12 4.2c-4.3 0-7.8 2.7-7.8 6 0 1.8 1 3.4 2.6 4.5-.1.5-.5 1.7-1.4 2.6-.2.2-.1.5.1.5 1.3.1 2.7-.4 3.7-1.1.9.3 1.8.4 2.8.4 4.3 0 7.8-2.7 7.8-6s-3.5-6.9-7.8-6.9zm-3.2 7.2c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm6.4 0c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm-6.2 2.7c.9.8 2 1.2 3 1.2s2.1-.4 3-1.2c.2-.2.5-.2.7 0 .2.2.2.5 0 .7-1.1 1-2.4 1.5-3.7 1.5s-2.6-.5-3.7-1.5c-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function LinkedinLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        d="M19 19h-3.14v-4.92c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V19H9.2V8.84h3.01v1.39h.04c.42-.8 1.45-1.64 2.98-1.64 3.19 0 3.78 2.1 3.78 4.83V19zM6.73 7.45a1.82 1.82 0 1 1 0-3.64 1.82 1.82 0 0 1 0 3.64zM8.3 19H5.16V8.84H8.3V19z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function MediumLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#00AB6C">
      <circle cx="6.5" cy="12" r="5" />
      <ellipse cx="15" cy="12" rx="2.8" ry="4.8" />
      <ellipse cx="21" cy="12" rx="1.2" ry="4.4" />
    </svg>
  );
}

/* ──────────────────── Platform Icon Dispatcher ──────────────────── */

export function renderPlatformIcon(platform: string, className = "h-4 w-4") {
  const p = (platform || "").toLowerCase();
  switch (p) {
    case "twitter":
      return <TwitterLogo className={`${className} text-[#1DA1F2]`} />;
    case "youtube":
      return <YoutubeLogo className={className} />;
    case "reddit":
      return <RedditLogo className={className} />;
    case "linkedin":
      return <LinkedinLogo className={className} />;
    case "medium":
      return <MediumLogo className={className} />;
    case "news":
      return <Newspaper className={`${className} text-indigo-500 dark:text-indigo-400`} />;
    default:
      return <Globe className={`${className} text-muted-foreground`} />;
  }
}

/* ──────────────────── Reusable Natural Platform Badge ──────────────────── */

export function PlatformBadge({
  platform,
  showLabel = true,
  size = "md",
  className = "",
}: {
  platform: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const style = getPlatformStyle(platform);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5 rounded-md",
    md: "px-2.5 py-1 text-xs gap-2 rounded-lg",
    lg: "px-3.5 py-1.5 text-sm gap-2.5 rounded-xl",
  }[size];

  const iconSizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold border backdrop-blur-sm transition-all shadow-sm ${style.badgeBg} ${style.badgeBorder} ${style.badgeText} ${sizeClasses} ${className}`}
    >
      {renderPlatformIcon(platform, iconSizeClasses)}
      {showLabel && <span>{style.label}</span>}
    </span>
  );
}

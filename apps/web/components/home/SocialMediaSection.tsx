import { Facebook, Instagram, Twitter, Youtube, Linkedin, Music, Send, ArrowUpRight } from "lucide-react";

// Homepage "Follow us" section — driven entirely by Admin → Settings →
// Social Media (GET /api/public/social-media, which only returns platforms
// with a valid http(s) URL). Renders nothing until at least one link is set
// or when marketing turns the section off there.
export interface SocialMediaData {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  telegram?: string;
  homepageSection?: { enabled?: boolean; title?: string; subtitle?: string };
}

const PLATFORMS = [
  { key: "facebook", label: "Facebook", Icon: Facebook, color: "#1877F2" },
  { key: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C" },
  { key: "youtube", label: "YouTube", Icon: Youtube, color: "#FF0000" },
  { key: "tiktok", label: "TikTok", Icon: Music, color: "#111111" },
  { key: "telegram", label: "Telegram", Icon: Send, color: "#229ED9" },
  { key: "twitter", label: "X (Twitter)", Icon: Twitter, color: "#111111" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2" },
] as const;

// "https://facebook.com/geelyethiopia" → "@geelyethiopia"; falls back to
// the bare host for URLs without a usable path segment.
function handleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segment = u.pathname.split("/").filter(Boolean).pop();
    if (!segment) return u.hostname.replace(/^www\./, "");
    return segment.startsWith("@") ? segment : `@${segment}`;
  } catch {
    return url;
  }
}

export default function SocialMediaSection({ data }: { data: SocialMediaData | null }) {
  if (!data || data.homepageSection?.enabled === false) return null;
  const links = PLATFORMS.filter((p) => typeof data[p.key] === "string" && data[p.key]);
  if (links.length === 0) return null;

  const title = data.homepageSection?.title?.trim() || "Follow Geely Ethiopia";
  const subtitle = data.homepageSection?.subtitle?.trim();

  return (
    <section className="bg-white dark:bg-midnight py-[70px] transition-colors" aria-labelledby="social-media-heading">
      <div className="page-container">
        <div className="mb-9 max-w-[560px]">
          <h2 id="social-media-heading" className="disp text-[30px] text-navy dark:text-ice font-bold">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-steel dark:text-steel-light leading-relaxed">{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {links.map(({ key, label, Icon, color }) => {
            const url = data[key] as string;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-3 rounded-lg border border-line dark:border-midnight-line bg-ice/40 dark:bg-midnight-surface p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:border-active-blue"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-steel transition group-hover:text-active-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-navy dark:text-ice">{label}</p>
                  <p className="truncate text-[12.5px] text-steel dark:text-steel-light">{handleFromUrl(url)}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

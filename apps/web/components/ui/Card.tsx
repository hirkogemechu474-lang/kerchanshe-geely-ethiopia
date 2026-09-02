import Link from "next/link";
import type { ReactNode } from "react";

type CardVariant = "boxed" | "media";

interface CardProps {
  variant?: CardVariant;
  hover?: boolean;
  href?: string;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  boxed:
    "rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface overflow-hidden",
  media: "rounded-2xl overflow-hidden group",
};

const BOXED_HOVER_CLASSES =
  "transition-all duration-300 hover:border-active-blue hover:shadow-[0_16px_40px_rgba(11,37,69,0.10)]";

/**
 * Shared card shell standardizing on the brand guideline's rounded-2xl
 * radius. `boxed` is the bordered/surfaced card used for vehicle/article
 * grids; `media` is the borderless editorial variant (image-led sections
 * that intentionally have no card chrome, e.g. ModelsShowcase).
 */
export default function Card({
  variant = "boxed",
  hover = true,
  href,
  className = "",
  children,
}: CardProps) {
  const classes = `${VARIANT_CLASSES[variant]} ${
    variant === "boxed" && hover ? BOXED_HOVER_CLASSES : ""
  } ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}

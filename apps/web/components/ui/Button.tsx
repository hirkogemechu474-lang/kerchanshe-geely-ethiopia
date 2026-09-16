import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "solid" | "outline";
type ButtonTone = "light" | "dark";
type ButtonSize = "sm" | "md" | "lg";

interface SharedProps {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    target?: string;
    rel?: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold transition-colors duration-200 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-active-blue focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs px-5 py-2.5 min-h-[2.5rem]",
  md: "text-sm px-7 py-3.5 min-h-[3rem]",
  lg: "text-sm md:text-base px-8 py-4 min-h-[3.25rem]",
};

function variantClasses(variant: ButtonVariant, tone: ButtonTone): string {
  if (variant === "solid") {
    return "bg-black text-white hover:bg-active-blue";
  }
  if (tone === "dark") {
    return "bg-transparent text-white border-2 border-white hover:bg-active-blue hover:border-active-blue";
  }
  return "bg-transparent text-black border-2 border-black hover:bg-active-blue hover:text-white hover:border-active-blue";
}

/**
 * Geely Auto Global brand button: exactly two styles per the brand
 * guideline — `solid` (black, hovers to Active Blue) and `outline`
 * (transparent + border, hovers to Active Blue). `tone` picks the outline
 * border/text color so it stays visible on light vs. dark/photo surfaces —
 * the guideline's own mockup only shows the dark-surface case. No rounded
 * corners — the guideline's button mockups are sharp rectangles.
 */
export default function Button({
  variant = "solid",
  tone = "light",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE_CLASSES} ${SIZE_CLASSES[size]} ${variantClasses(variant, tone)} ${className}`.trim();

  if ("href" in rest && rest.href) {
    const { href, target, rel, ...anchorRest } = rest as ButtonAsLink;
    return (
      <Link href={href} target={target} rel={rel} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}

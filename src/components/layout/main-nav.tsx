"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function MainNav({
  className,
  onNavigate,
  "aria-label": ariaLabel = "주요 내비게이션",
}: {
  className?: string;
  onNavigate?: () => void;
  "aria-label"?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className={cn("flex items-center gap-6 text-sm", className)}>
      {siteConfig.nav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors hover:text-foreground",
              active ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

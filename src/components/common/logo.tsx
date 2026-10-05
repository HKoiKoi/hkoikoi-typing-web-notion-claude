import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2 font-semibold"
    >
      {/* 원형 프레임 안에서 중앙의 "h" 마크가 보이도록 확대 크롭 */}
      <span className="size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Image
          src="/logo.png"
          alt=""
          width={32}
          height={32}
          priority
          className="size-full scale-150 object-cover"
        />
      </span>
      <span className="truncate">{siteConfig.name}</span>
    </Link>
  );
}

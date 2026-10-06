import { cn } from "@/lib/utils";

/**
 * 한지 스킨 장식 SVG (직접 그린 문양). 모두 aria-hidden이며 글자 뒤 배경에는 쓰지 않는다.
 * 색은 스킨 토큰(--skin-accent, --skin-accent-2)을 따라 라이트/다크에 맞춰진다.
 */

/** 단청 모서리 문양. 기본 방향은 좌상단이고 회전 클래스로 네 모서리에 쓴다. */
export function HanjiCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-8 shrink-0", className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 30V2h28" stroke="var(--skin-accent)" strokeWidth="2" />
      <path d="M7 30V7h23" stroke="var(--skin-accent-2)" strokeWidth="1" />
      <circle cx="7" cy="7" r="3" fill="var(--skin-accent-2)" />
      <path d="M13 13h5M13 13v5" stroke="var(--skin-accent)" strokeWidth="1.5" />
    </svg>
  );
}

/** 상서구름 구분선 문양. 좌우 대칭이며 가운데 마름모를 둔다. */
export function HanjiCloud({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 24"
      aria-hidden="true"
      focusable="false"
      className={cn("h-6 w-30 shrink-0", className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M4 18H44C36 18 36 7 44 7C50 7 52 13 48 13C45 13 45 10 47 10"
        stroke="var(--skin-accent)"
        strokeWidth="1.5"
      />
      <path
        d="M116 18H76C84 18 84 7 76 7C70 7 68 13 72 13C75 13 75 10 73 10"
        stroke="var(--skin-accent)"
        strokeWidth="1.5"
      />
      <path d="M60 6L66 12L60 18L54 12Z" fill="var(--skin-accent-2)" />
    </svg>
  );
}

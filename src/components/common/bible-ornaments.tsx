import { cn } from "@/lib/utils";

/**
 * 성경책 스킨 장식 SVG (직접 그린 문양). 모두 aria-hidden이며 글자 뒤 배경에는 쓰지 않는다.
 * 색은 스킨 토큰(--skin-accent 금박, --skin-accent-2 가죽 갈색)만 쓰므로 라이트/다크에 맞춰진다.
 */

/** 금박 모서리 문양. 기본 방향은 좌상단이고 회전 클래스로 네 모서리에 쓴다. */
export function BibleCorner({ className }: { className?: string }) {
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
      <path d="M6 30V6h24" stroke="var(--skin-accent)" strokeWidth="0.75" />
      <path d="M10 10L14 14L10 18L6 14Z" fill="var(--skin-accent-2)" />
      <path d="M20 6h4M6 20v4" stroke="var(--skin-accent)" strokeWidth="1.5" />
    </svg>
  );
}

/** 십자가 구분선 문양. 좌우에 가는 선, 가운데 십자가, 양끝 마름모를 둔다. */
export function BibleCross({ className }: { className?: string }) {
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
      <path d="M12 12H50M70 12H108" stroke="var(--skin-accent)" strokeWidth="1" />
      <path d="M60 3V21M53 9H67" stroke="var(--skin-accent)" strokeWidth="2" />
      <path d="M60 7V11M57 9H63" stroke="var(--skin-accent-2)" strokeWidth="1" />
      <path d="M6 12L9 9L12 12L9 15Z" fill="var(--skin-accent-2)" />
      <path d="M108 12L111 9L114 12L111 15Z" fill="var(--skin-accent-2)" />
    </svg>
  );
}

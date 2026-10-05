"use client";

import { useSearchParams } from "next/navigation";

/**
 * 예문 목록 필터 영역 자리표시자.
 * URL 쿼리(`useSearchParams`)를 읽으므로 호출하는 쪽에서 반드시 <Suspense>로 감싼다.
 */
export function PassageFilter() {
  const searchParams = useSearchParams();
  const language = searchParams.get("lang");

  return (
    <div
      role="search"
      aria-label="예문 필터"
      data-lang={language ?? "all"}
      className="mb-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
    >
      필터 영역 (언어·난이도 필터가 이곳에 표시됩니다)
    </div>
  );
}

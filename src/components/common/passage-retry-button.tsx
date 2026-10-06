"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * 오류·빈 상태 화면의 재조회 버튼('다시 시도', '다시 확인'). 서버 컴포넌트를 다시 렌더해 재조회한다.
 * 재조회 중에는 비활성화해 연타로 refresh가 중복되지 않게 한다.
 */
export function PassageRetryButton({
  label = "다시 시도",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {isPending ? "확인 중..." : label}
    </Button>
  );
}

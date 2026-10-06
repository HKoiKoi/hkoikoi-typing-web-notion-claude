"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * 오류·빈 상태 화면의 재조회 버튼('다시 시도', '다시 확인'). 서버 컴포넌트를 다시 렌더해 재조회한다.
 * 재조회 중에는 연타로 refresh가 중복되지 않게 막는다. `disabled`를 쓰면 키보드 포커스가 body로 빠지므로
 * `aria-disabled`와 클릭 무시로 막고, 진행·실패 결과는 화면에 보이지 않는 `role="status"`로 알린다.
 * 재조회가 성공하면 화면이 바뀌며 이 컴포넌트는 사라진다.
 */
export function PassageRetryButton({
  label = "다시 시도",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attempted, setAttempted] = useState(false);

  const status = isPending
    ? "다시 확인하는 중입니다"
    : attempted
      ? "다시 확인했지만 아직 불러오지 못했습니다"
      : "";

  function retry() {
    if (isPending) return;
    setAttempted(true);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-disabled={isPending}
        aria-busy={isPending}
        className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        onClick={retry}
      >
        {isPending ? "확인 중..." : label}
      </Button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}

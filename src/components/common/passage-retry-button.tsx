"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/** 일시 오류 화면의 '다시 시도' 버튼. 서버 컴포넌트를 다시 렌더해 목록을 재조회한다. */
export function PassageRetryButton() {
  const router = useRouter();
  return (
    <Button type="button" variant="outline" onClick={() => router.refresh()}>
      다시 시도
    </Button>
  );
}

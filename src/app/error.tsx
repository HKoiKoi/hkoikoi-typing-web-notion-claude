"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";

/**
 * 예상 밖 오류 전용 최후 방어선. 노션 오류는 각 화면이 PassageErrorState로 처리한다.
 * error.message는 분기·표시하지 않고 로그로만 남긴다. retry는 재조회 후 다시 렌더한다(reset은 쓰지 않음).
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
      <p className="text-muted-foreground">
        예상하지 못한 오류가 발생했습니다. 다시 시도하거나 예문 목록으로 이동해
        주세요.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>다시 시도</Button>
        <Button asChild variant="outline">
          <Link href="/">예문 목록으로</Link>
        </Button>
      </div>
    </Container>
  );
}

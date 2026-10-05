"use client";

import { useEffect } from "react";

import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";

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
      <h2 className="text-2xl font-bold">문제가 발생했습니다</h2>
      <Button onClick={() => retry()}>다시 시도</Button>
    </Container>
  );
}

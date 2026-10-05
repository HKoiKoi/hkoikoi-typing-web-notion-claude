import Link from "next/link";

import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold">404</p>
      <p className="text-muted-foreground">페이지를 찾을 수 없습니다.</p>
      <Button asChild>
        <Link href="/">홈으로</Link>
      </Button>
    </Container>
  );
}

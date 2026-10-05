import Link from "next/link";

import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-2xl font-bold">예문을 찾을 수 없습니다</p>
      <p className="text-muted-foreground">
        삭제되었거나 존재하지 않는 예문입니다.
      </p>
      <Button asChild>
        <Link href="/">예문 목록으로</Link>
      </Button>
    </Container>
  );
}

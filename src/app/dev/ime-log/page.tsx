import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";

import { ImeLogLab } from "./_components/ime-log-lab";

// 개발 전용 페이지. 프로덕션 빌드/서버에서는 404로 처리한다.
export default function ImeLogPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="pb-16">
      <PageHeader
        title="IME 로그 (개발 전용)"
        description="한글 IME 이벤트 순서와 조합 중 Enter 보류(pendingEnter) 동작을 브라우저별로 기록합니다."
      />
      <ImeLogLab />
    </Container>
  );
}

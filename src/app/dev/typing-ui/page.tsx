// 임시 개발용 화면: 타이핑 화면·결과 뷰·오류 4종 정적 UI 상태 전환 확인용. Task 018에서 제거한다.
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";

import { TypingUiDemo } from "./_components/typing-ui-demo";

export default function TypingUiDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="pb-16">
      <PageHeader
        title="타이핑 UI 미리보기"
        description="임시 개발용 화면입니다. 더미 상태로 타이핑·결과·오류 화면을 전환합니다."
      />
      <TypingUiDemo />
    </Container>
  );
}

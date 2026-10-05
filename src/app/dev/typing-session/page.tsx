// 임시 개발용 화면: 타이핑 세션 reducer 검증과 useTypingSession 훅 데모. Task 018에서 제거한다.
// 프로덕션 빌드에서의 notFound() 동작은 Task 018에서 /dev/* 와 함께 재확인한다.
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";

import { LabResults } from "../typing-lab/_components/lab-results";
import { TypingSessionDemo } from "./_components/typing-session-demo";
import { runSessionCases } from "./cases";

export default function TypingSessionDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-10 pb-16">
      <PageHeader
        title="타이핑 세션 검증"
        description="임시 개발용 화면입니다. 세션 reducer의 케이스별 기대값과 useTypingSession 훅 데모입니다."
      />
      <TypingSessionDemo />
      <LabResults results={runSessionCases()} />
    </Container>
  );
}

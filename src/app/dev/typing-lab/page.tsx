// 임시 개발용 화면: 판정·정규화·지표 순수 함수 검증. Task 018에서 제거한다.
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";

import { runLabCases } from "./cases";
import { LabResults } from "./_components/lab-results";

export default function TypingLabDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="pb-16">
      <PageHeader
        title="타이핑 순수 함수 검증"
        description="임시 개발용 화면입니다. 판정·정규화·지표 순수 함수의 케이스별 기대값과 실제 결과를 비교합니다."
      />
      <LabResults results={runLabCases()} />
    </Container>
  );
}

import { Suspense } from "react";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";

import { PassageListSection } from "./_components/passage-list-section";
import { PassageListSkeleton } from "./_components/passage-list-skeleton";

export default function Home() {
  return (
    <Container className="pb-16">
      <PageHeader
        title="예문 목록"
        description="노션 데이터베이스에 등록한 예문을 골라 타이핑을 연습하세요."
      />
      <Suspense fallback={<PassageListSkeleton />}>
        <PassageListSection />
      </Suspense>
    </Container>
  );
}

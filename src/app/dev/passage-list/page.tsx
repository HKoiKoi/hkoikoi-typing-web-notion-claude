// 임시 개발용 화면: 예문 0건 EmptyState 확인용. Task 018에서 제거한다.
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";

import { PassageBrowser } from "../../_components/passage-browser";
import { PassageListSkeleton } from "../../_components/passage-list-skeleton";

export default function PassageListDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="pb-16">
      <PageHeader
        title="예문 목록 (빈 상태)"
        description="임시 개발용 화면입니다. 예문이 0건일 때의 목록을 확인합니다."
      />
      <Suspense fallback={<PassageListSkeleton />}>
        <PassageBrowser passages={[]} />
      </Suspense>
    </Container>
  );
}

import { Container } from "@/components/common/container";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

/** 예문 연습 화면 자리표시자. params를 await 하므로 <Suspense> 안에서 렌더해야 한다. */
export async function PassagePlaceholder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container className="pb-16">
      <PageHeader title="예문 연습" description={`예문 ID: ${decodeURIComponent(id)}`} />
      <EmptyState
        title="연습 화면 준비 중입니다"
        description="노션 연동 후 이곳에서 타이핑 연습을 할 수 있습니다."
      />
    </Container>
  );
}

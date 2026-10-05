import { Container } from "@/components/common/container";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export default function Home() {
  return (
    <Container className="pb-16">
      <PageHeader
        title="예문 목록"
        description="노션 데이터베이스에 등록한 예문을 골라 타이핑을 연습하세요."
      />
      <EmptyState
        title="아직 불러온 예문이 없습니다"
        description="노션 연동 후 이곳에 예문이 표시됩니다."
      />
    </Container>
  );
}

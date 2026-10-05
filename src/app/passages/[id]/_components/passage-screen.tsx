import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";
import { getMockPassages } from "@/lib/mock/passages";

import { TypingScreen } from "./typing-screen";

/** 예문 연습 화면. params를 await 하므로 <Suspense> 안에서 렌더해야 한다. (더미 데이터: Task 012에서 노션 본문으로 교체) */
export async function PassageScreen({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const passage = getMockPassages().find((p) => p.id === decodeURIComponent(id));
  if (!passage) notFound();

  return (
    <Container className="pb-16">
      <PageHeader title={passage.title} description={`${passage.category} · ${passage.lines.length}줄`} />
      <TypingScreen passage={passage} />
    </Container>
  );
}

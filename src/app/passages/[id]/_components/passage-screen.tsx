import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";
import { PassageErrorState } from "@/components/common/passage-error-state";
import { PassageRetryButton } from "@/components/common/passage-retry-button";
import { Button } from "@/components/ui/button";
import {
  buildFilterQuery,
  filterPassages,
  getNextPassageId,
  parseFilter,
  sortPassages,
  type SearchParamsLike,
} from "@/lib/passages/filter";
import { loadPassage, loadPassageSummaries } from "@/lib/passages/load";

import { TypingScreen } from "./typing-screen";

/** 깨진 % 인코딩이면 URIError가 나므로 실패 시 원문을 쓴다. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** searchParams 객체를 parseFilter 입력 형태로 바꾼다. 값이 배열이면 첫 값만 쓴다. */
function toSearchParamsLike(
  searchParams: Record<string, string | string[] | undefined>,
): SearchParamsLike {
  return {
    get(name) {
      const value = searchParams[name];
      return (Array.isArray(value) ? value[0] : value) ?? null;
    },
  };
}

/** 예문 연습 화면. params/searchParams를 await 하므로 <Suspense> 안에서 렌더해야 한다. */
export async function PassageScreen({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 오류·폴백 결과가 정적 프리렌더에 박제되지 않도록 요청 시점에 실행한다.
  await connection();
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams]);
  const result = await loadPassage(safeDecode(id));

  if (!result.ok) {
    switch (result.kind) {
      case "notFound":
        notFound();
      case "empty":
        return (
          <PassageErrorState
            kind="empty"
            description="노션 Lines DB에 이 예문의 줄을 추가하세요"
            action={
              <Button asChild variant="outline">
                <Link href="/">예문 목록으로</Link>
              </Button>
            }
          />
        );
      case "transient":
        return (
          <PassageErrorState kind="transient" action={<PassageRetryButton />} />
        );
      case "config":
        return <PassageErrorState kind="config" />;
    }
  }

  const passage = result.data;
  const filter = parseFilter(toSearchParamsLike(rawSearchParams));
  const query = buildFilterQuery(filter);
  const listHref = `/${query}`;

  // 다음 예문: 목록 화면과 같은 필터·정렬 기준. 목록 조회가 실패하면(마지막 성공값 없음) 목록으로 보낸다.
  let nextHref = listHref;
  const summaries = await loadPassageSummaries();
  if (summaries.ok) {
    const nextId = getNextPassageId(
      sortPassages(filterPassages(summaries.data, filter)),
      passage.id,
    );
    if (nextId) nextHref = `/passages/${nextId}${query}`;
  }

  return (
    <Container className="pb-16">
      <PageHeader
        title={passage.title}
        description={`${passage.category} · ${passage.lines.length}줄`}
      />
      <TypingScreen passage={passage} nextHref={nextHref} listHref={listHref} />
    </Container>
  );
}

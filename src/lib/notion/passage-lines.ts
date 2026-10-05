import "server-only";

import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";

import type { Line } from "@/types/passage";

import { getDataSourceIds, getNotionClient } from "./client";
import { mapLineRows } from "./lines-mapper";

const LINE_PROPERTY_NAMES = ["Text", "Line Number", "Label"];

/**
 * 예문 한 편의 줄(Line[]) 캐시 조회. 반환은 직렬화 가능한 plain 객체뿐이다.
 * 실패는 catch하지 않고 throw한다(오류 결과를 반환하면 캐시되기 때문).
 */
export async function getPassageLinesCached(
  passageId: string,
): Promise<Line[]> {
  "use cache";
  // 캐시 미스 때만 실행되는 로그(캐시 적중 시에는 본문이 실행되지 않는다)
  console.info(`[notion] 줄 조회 passage=${passageId}`);

  // ROADMAP에는 revalidate 300만 적혀 있으나, 프리렌더 제외 하한(stale>=30초, expire>=300초)을
  // 지키기 위해 목록(getPassageSummariesCached)과 같이 stale 30, expire 600을 함께 지정한다.
  cacheLife({ stale: 30, revalidate: 300, expire: 600 });
  // 결정: 개별 태그(passage-<id>)와 목록 태그(passages)를 함께 붙인다.
  // F008 새로고침 버튼이 revalidateTag('passages') 한 번으로 목록과 모든 줄 캐시를 갱신할 수 있게 하고,
  // 특정 예문만 갱신할 때는 passage-<id>를 쓴다.
  cacheTag(`passage-${passageId}`, "passages");

  const { linesDataSourceId } = getDataSourceIds();
  const notion = getNotionClient();
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    ...buildLinesQuery(linesDataSourceId, passageId),
  });
  return mapLineRows(results.filter(isFullPage));
}

function buildLinesQuery(linesDataSourceId: string, passageId: string) {
  return {
    data_source_id: linesDataSourceId,
    filter: { property: "Passage", relation: { contains: passageId } },
    sorts: [{ property: "Line Number", direction: "ascending" as const }],
    filter_properties: LINE_PROPERTY_NAMES,
  };
}

/**
 * 줄 DB 스키마 점검용 캐시 없는 조회(1건). 프로퍼티 이름·타입이 어긋나면 노션이 validation_error 등으로
 * 거부하므로, 호출측(load.ts)이 error.code로 config/transient를 가를 수 있다. 실패는 throw한다.
 */
export async function probePassageLinesQuery(passageId: string): Promise<void> {
  const { linesDataSourceId } = getDataSourceIds();
  await getNotionClient().dataSources.query({
    ...buildLinesQuery(linesDataSourceId, passageId),
    page_size: 1,
  });
}

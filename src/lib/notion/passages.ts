import "server-only";

import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";

import type { PassageSummary } from "@/types/passage";

import { getDataSourceIds, getNotionClient } from "./client";
import { mapPassageRows } from "./mappers";

const PASSAGE_PROPERTY_NAMES = [
  "Title",
  "Language",
  "Category",
  "Order",
  "Difficulty",
  "Tags",
  "Enabled",
];

/**
 * 예문 목록(PassageSummary[]) 캐시 조회. 서버 필터 없이 전체를 수집한 뒤 매핑한다.
 * 반환은 직렬화 가능한 plain 객체뿐이며 SDK 객체/토큰은 포함하지 않는다.
 * 실패는 catch하지 않고 throw한다(오류 결과를 반환하면 캐시되기 때문).
 */
export async function getPassageSummariesCached(): Promise<PassageSummary[]> {
  "use cache";
  // revalidate 300초(5분)를 쓰되, 프리렌더 제외 하한(stale>=30초, expire>=5분=300초)을
  // 지키기 위해 stale 30, expire 600으로 둔다.
  cacheLife({ stale: 30, revalidate: 300, expire: 600 });
  cacheTag("passages");

  const { passagesDataSourceId } = getDataSourceIds();
  const notion = getNotionClient();
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: passagesDataSourceId,
    filter_properties: PASSAGE_PROPERTY_NAMES,
  });
  return mapPassageRows(results.filter(isFullPage));
}

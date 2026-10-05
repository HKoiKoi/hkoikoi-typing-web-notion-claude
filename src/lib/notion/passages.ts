import "server-only";

import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";

import type { PassageSummary } from "@/types/passage";

import { getDataSourceIds, getNotionClient } from "./client";
import { countCall } from "./dev-probe";
import { mapPassageRows } from "./mappers";

// 정식 경로: getPassageSummariesCached (dev-probe 비의존).
// 아래 PassageRowProbe/getPassageRowsCached/queryPassageRowsUncached 및 스파이크 헬퍼는
// /dev/notion-cache, probe/route.ts가 참조하는 Task 005 스파이크 코드다. (Task 018 제거)

export type PassageRowProbe = {
  id: string;
  title: string;
  language: string | null;
  category: string | null;
  order: number | null;
  difficulty: string | null;
  tags: string[];
  enabled: boolean | null;
  lastEditedTime: string;
  inTrash: boolean;
};

type PropertyValue = PageObjectResponse["properties"][string];

const PASSAGE_PROPERTY_NAMES = [
  "Title",
  "Language",
  "Category",
  "Order",
  "Difficulty",
  "Tags",
  "Enabled",
];

// 프로퍼티를 이름으로 찾고 타입이 다르면 null을 반환하는 접근 헬퍼
function getTitle(prop: PropertyValue | undefined): string {
  return prop?.type === "title"
    ? prop.title.map((t) => t.plain_text).join("")
    : "";
}

function getSelectName(prop: PropertyValue | undefined): string | null {
  return prop?.type === "select" ? (prop.select?.name ?? null) : null;
}

function getNumber(prop: PropertyValue | undefined): number | null {
  return prop?.type === "number" ? prop.number : null;
}

function getMultiSelectNames(prop: PropertyValue | undefined): string[] {
  return prop?.type === "multi_select"
    ? prop.multi_select.map((o) => o.name)
    : [];
}

function getCheckbox(prop: PropertyValue | undefined): boolean | null {
  return prop?.type === "checkbox" ? prop.checkbox : null;
}

function toPassageRowProbe(page: PageObjectResponse): PassageRowProbe {
  const p = page.properties;
  return {
    id: page.id,
    title: getTitle(p["Title"]),
    language: getSelectName(p["Language"]),
    category: getSelectName(p["Category"]),
    order: getNumber(p["Order"]),
    difficulty: getSelectName(p["Difficulty"]),
    tags: getMultiSelectNames(p["Tags"]),
    enabled: getCheckbox(p["Enabled"]),
    lastEditedTime: page.last_edited_time,
    inTrash: page.in_trash,
  };
}

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

/**
 * (Task 018 제거) 스파이크용 예문 목록 캐시 조회. 서버 필터 없이 전체를 수집한다(PRD 6장).
 * cacheLife: stale<30초 또는 expire<5분이면 프리렌더에서 제외되므로 이 값을 유지한다.
 * 실패는 그대로 throw한다(오류 결과를 반환하면 캐시되기 때문).
 */
export async function getPassageRowsCached(): Promise<{
  rows: PassageRowProbe[];
  fetchedAt: string;
  callCount: number;
}> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  cacheTag("passages");

  const { passagesDataSourceId } = getDataSourceIds();
  const notion = getNotionClient();
  const callCount = countCall("passages");
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: passagesDataSourceId,
    filter_properties: PASSAGE_PROPERTY_NAMES,
  });
  return {
    rows: results.filter(isFullPage).map(toPassageRowProbe),
    fetchedAt: new Date().toISOString(),
    callCount,
  };
}

/**
 * (Task 018 제거) 검증용 비캐시 조회. page_size를 줄여 100건 초과 수집을 검증하거나,
 * filterProperties에 이름/ID 배열을 넣어 비교할 수 있다.
 */
export async function queryPassageRowsUncached(options: {
  pageSize?: number;
  filterProperties?: string[];
}): Promise<{ rows: PassageRowProbe[]; requestCount: number }> {
  const { passagesDataSourceId } = getDataSourceIds();
  const notion = getNotionClient();
  let requestCount = 0;
  countCall("passages-uncached");
  const results = await collectPaginatedAPI(
    (args: Parameters<typeof notion.dataSources.query>[0]) => {
      requestCount += 1;
      return notion.dataSources.query(args);
    },
    {
      data_source_id: passagesDataSourceId,
      filter_properties: options.filterProperties ?? PASSAGE_PROPERTY_NAMES,
      ...(options.pageSize !== undefined && { page_size: options.pageSize }),
    },
  );
  return {
    rows: results.filter(isFullPage).map(toPassageRowProbe),
    requestCount,
  };
}

import "server-only";

import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { cacheLife, cacheTag } from "next/cache";

import { getDataSourceIds, getNotionClient } from "./client";
import { countCall } from "./dev-probe";

// 스파이크용 최소 직렬화(Task 005). 정식 mappers는 Task 011에서 만든다.

export type LineRowProbe = {
  id: string;
  text: string;
  lineNumber: number | null;
  label: string;
  inTrash: boolean;
};

type PropertyValue = PageObjectResponse["properties"][string];

const LINE_PROPERTY_NAMES = ["Text", "Line Number", "Label"];

// title/rich_text는 plain_text를 이어 붙인다. 타입이 다르면 빈 문자열
function getPlainText(prop: PropertyValue | undefined): string {
  if (prop?.type === "title") {
    return prop.title.map((t) => t.plain_text).join("");
  }
  if (prop?.type === "rich_text") {
    return prop.rich_text.map((t) => t.plain_text).join("");
  }
  return "";
}

function getNumber(prop: PropertyValue | undefined): number | null {
  return prop?.type === "number" ? prop.number : null;
}

function toLineRowProbe(page: PageObjectResponse): LineRowProbe {
  const p = page.properties;
  return {
    id: page.id,
    text: getPlainText(p["Text"]),
    lineNumber: getNumber(p["Line Number"]),
    label: getPlainText(p["Label"]),
    inTrash: page.in_trash,
  };
}

/**
 * 예문 한 건의 줄 목록 캐시 조회.
 * cacheLife: stale<30초 또는 expire<5분이면 프리렌더에서 제외되므로 이 값을 유지한다.
 * 실패는 그대로 throw한다(오류 결과를 반환하면 캐시되기 때문).
 */
export async function getLinesCached(passageId: string): Promise<{
  lines: LineRowProbe[];
  fetchedAt: string;
  callCount: number;
}> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  cacheTag(`passage-${passageId}`);

  const { linesDataSourceId } = getDataSourceIds();
  const notion = getNotionClient();
  const callCount = countCall("lines");
  const results = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: linesDataSourceId,
    filter: { property: "Passage", relation: { contains: passageId } },
    sorts: [{ property: "Line Number", direction: "ascending" }],
    filter_properties: LINE_PROPERTY_NAMES,
  });
  return {
    lines: results.filter(isFullPage).map(toLineRowProbe),
    fetchedAt: new Date().toISOString(),
    callCount,
  };
}

/** 검증용 비캐시 조회. page_size와 filter_properties(이름/ID)를 바꿔 비교할 수 있다. */
export async function queryLinesUncached(
  passageId: string,
  options?: { pageSize?: number; filterProperties?: string[] },
): Promise<{ lines: LineRowProbe[]; requestCount: number }> {
  const { linesDataSourceId } = getDataSourceIds();
  const notion = getNotionClient();
  let requestCount = 0;
  countCall("lines-uncached");
  const results = await collectPaginatedAPI(
    (args: Parameters<typeof notion.dataSources.query>[0]) => {
      requestCount += 1;
      return notion.dataSources.query(args);
    },
    {
      data_source_id: linesDataSourceId,
      filter: { property: "Passage", relation: { contains: passageId } },
      sorts: [{ property: "Line Number", direction: "ascending" }],
      filter_properties: options?.filterProperties ?? LINE_PROPERTY_NAMES,
      ...(options?.pageSize !== undefined && { page_size: options.pageSize }),
    },
  );
  return {
    lines: results.filter(isFullPage).map(toLineRowProbe),
    requestCount,
  };
}

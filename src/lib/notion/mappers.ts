import "server-only";

import type { PageObjectResponse } from "@notionhq/client";

import { resolveSkin } from "@/lib/passages/skin";
import type { Difficulty, Language, PassageSummary } from "@/types/passage";

// Passages 행(PageObjectResponse) -> PassageSummary 매핑 (Task 011-1, PRD 5장 매핑 규칙).
//
// 규칙 요약
// - 프로퍼티는 이름으로 접근하고, 삭제 여부는 `in_trash`만 사용한다.
// - 건너뜀(null): in_trash / Title 비어 있음 또는 title 타입 아님 /
//   Language가 select가 아니거나 ko·en 외 값 / Enabled가 checkbox이고 false.
// - Enabled 프로퍼티가 없거나 checkbox가 아니면 전부 사용한다.
// - Theme(select)는 resolveSkin으로 skin을 정한다. 속성이 없거나 타입이 달라도 행은 제외하지 않고 로그도 남기지 않는다.
// - 기본값: Category 없음 "기타", Difficulty는 Easy|Medium|Hard 외 미지정, Tags 빈 배열.
// - 정렬은 하지 않는다(정렬은 filter.ts 소관).
// - 로그에는 행 id와 사유 코드만 남기고 프로퍼티 값·제목은 출력하지 않는다.

type PropertyValue = PageObjectResponse["properties"][string];

const DEFAULT_CATEGORY = "기타";
const DIFFICULTIES: readonly Difficulty[] = ["Easy", "Medium", "Hard"];

type SkipReason = "empty-title" | "invalid-language";

// 프로퍼티를 이름으로 찾고 타입이 다르면 빈 값을 반환하는 접근 헬퍼
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

function warnSkip(id: string, reason: SkipReason): void {
  console.warn(`[notion-mapper] 행 건너뜀 id=${id} reason=${reason}`);
}

function toLanguage(value: string | null): Language | null {
  return value === "ko" || value === "en" ? value : null;
}

function toDifficulty(value: string | null): Difficulty | undefined {
  return DIFFICULTIES.find((d) => d === value);
}

/** 한 행을 PassageSummary로 변환한다. 제외 대상이면 null. */
export function toPassageSummary(
  page: PageObjectResponse,
): PassageSummary | null {
  // 삭제된 행은 조용히 제외
  if (page.in_trash) return null;

  const p = page.properties;

  // Enabled가 checkbox이고 false면 정상 제외(로그 없음). 프로퍼티가 없거나 다른 타입이면 포함
  if (getCheckbox(p["Enabled"]) === false) return null;

  const title = getTitle(p["Title"]).trim();
  if (title === "") {
    warnSkip(page.id, "empty-title");
    return null;
  }

  const language = toLanguage(getSelectName(p["Language"]));
  if (language === null) {
    warnSkip(page.id, "invalid-language");
    return null;
  }

  const order = getNumber(p["Order"]);
  const difficulty = toDifficulty(getSelectName(p["Difficulty"]));

  return {
    id: page.id,
    title,
    language,
    category: getSelectName(p["Category"])?.trim() || DEFAULT_CATEGORY,
    ...(order !== null && { order }),
    ...(difficulty !== undefined && { difficulty }),
    tags: getMultiSelectNames(p["Tags"]),
    skin: resolveSkin(getSelectName(p["Theme"])),
  };
}

/** 행 배열을 매핑하고 제외된 행(null)을 제거한다. 정렬하지 않는다. */
export function mapPassageRows(pages: PageObjectResponse[]): PassageSummary[] {
  return pages.flatMap((page) => {
    const summary = toPassageSummary(page);
    return summary === null ? [] : [summary];
  });
}

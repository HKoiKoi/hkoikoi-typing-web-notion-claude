import "server-only";

import type { PageObjectResponse } from "@notionhq/client";

import { normalizeLine } from "@/lib/typing/normalize";
import type { Line } from "@/types/passage";

// Lines 행(PageObjectResponse) -> Line 매핑 (Task 012-1, PRD 5장/7.2).
//
// 규칙 요약
// - in_trash 행은 조용히 제외(로그 없음).
// - Text(title) plain text를 이어 붙여 normalizeLine, 빈 문자열이면 empty-text로 건너뜀.
// - Line Number가 number가 아니거나 null이면 missing-line-number로 건너뜀.
// - Label(rich_text)은 normalizeLine 후 비면 label 필드를 넣지 않는다.
// - 결과는 Line Number 기준 안정 정렬. 같은 번호는 duplicate-line-number 경고 후 응답 순서 유지.
// - 로그에는 행 id와 사유 코드만 남기고 본문·라벨은 출력하지 않는다.

type PropertyValue = PageObjectResponse["properties"][string];

type SkipReason = "empty-text" | "missing-line-number";

// 아래 헬퍼는 mappers.ts와 같은 패턴이다(중복 허용).
function getTitle(prop: PropertyValue | undefined): string {
  return prop?.type === "title"
    ? prop.title.map((t) => t.plain_text).join("")
    : "";
}

function getRichText(prop: PropertyValue | undefined): string {
  return prop?.type === "rich_text"
    ? prop.rich_text.map((t) => t.plain_text).join("")
    : "";
}

function getNumber(prop: PropertyValue | undefined): number | null {
  return prop?.type === "number" ? prop.number : null;
}

function warnSkip(id: string, reason: SkipReason): void {
  console.warn(`[notion-lines-mapper] 행 건너뜀 id=${id} reason=${reason}`);
}

type NumberedLine = { id: string; lineNumber: number; line: Line };

function toNumberedLine(page: PageObjectResponse): NumberedLine | null {
  // 삭제된 행은 조용히 제외
  if (page.in_trash) return null;

  const p = page.properties;

  const text = normalizeLine(getTitle(p["Text"]));
  if (text === "") {
    warnSkip(page.id, "empty-text");
    return null;
  }

  const lineNumber = getNumber(p["Line Number"]);
  if (lineNumber === null) {
    warnSkip(page.id, "missing-line-number");
    return null;
  }

  const label = normalizeLine(getRichText(p["Label"]));
  return {
    id: page.id,
    lineNumber,
    line: { text, ...(label !== "" && { label }) },
  };
}

/** 행 배열을 매핑하고 Line Number 기준으로 안정 정렬한다. */
export function mapLineRows(pages: PageObjectResponse[]): Line[] {
  const numbered = pages.flatMap((page) => {
    const item = toNumberedLine(page);
    return item === null ? [] : [item];
  });

  // Array.prototype.sort는 안정 정렬이므로 같은 번호는 응답 순서가 유지된다.
  numbered.sort((a, b) => a.lineNumber - b.lineNumber);

  for (let i = 1; i < numbered.length; i++) {
    if (numbered[i].lineNumber === numbered[i - 1].lineNumber) {
      console.warn(
        `[notion-lines-mapper] 경고 id=${numbered[i].id} reason=duplicate-line-number`,
      );
    }
  }

  return numbered.map((item) => item.line);
}

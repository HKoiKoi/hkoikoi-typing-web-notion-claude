// 예문 목록 필터/정렬/다음 예문 시그니처 (PRD 6장 190행, D7). Task 008에서 구현.
// 순수 함수 모듈: React/Next/노션 SDK에 의존하지 않는다.

import type {
  Difficulty,
  Language,
  PassageFilter,
  PassageSummary,
} from "@/types/passage";

/** URLSearchParams / Next ReadonlyURLSearchParams가 구조적으로 만족하는 최소 형태 */
export type SearchParamsLike = {
  get(name: string): string | null;
};

const LANGUAGES: readonly Language[] = ["ko", "en"];
const DIFFICULTIES: readonly Difficulty[] = ["Easy", "Medium", "Hard"];

function readParam(searchParams: SearchParamsLike, key: string): string | undefined {
  const value = searchParams.get(key);
  if (value === null || value.trim() === "") return undefined;
  return value;
}

/**
 * URL 쿼리(`?category=&lang=&difficulty=&tag=`)를 PassageFilter로 변환한다.
 * 입력: SearchParamsLike. 출력: PassageFilter.
 * 엣지: 키가 없거나 빈 문자열이면 undefined. lang/difficulty가 허용 값(ko|en, Easy|Medium|Hard) 밖이면 undefined.
 * category/tag는 임의 문자열을 허용한다(존재하지 않는 값은 필터 결과 0건으로 처리).
 */
export function parseFilter(searchParams: SearchParamsLike): PassageFilter {
  const lang = readParam(searchParams, "lang");
  const difficulty = readParam(searchParams, "difficulty");

  return {
    category: readParam(searchParams, "category"),
    lang: LANGUAGES.find((value) => value === lang),
    difficulty: DIFFICULTIES.find((value) => value === difficulty),
    tag: readParam(searchParams, "tag"),
  };
}

/**
 * 필터 조건에 맞는 예문만 반환한다(AND 결합, 원본 배열은 변경하지 않는다).
 * 입력: passages, filter. 출력: 조건에 맞는 PassageSummary[].
 * 엣지: 정의되지 않은 조건은 무시, 모든 조건이 비면 전체 반환. tag는 tags 배열에 포함 여부로 판단한다.
 */
export function filterPassages(
  passages: readonly PassageSummary[],
  filter: PassageFilter,
): PassageSummary[] {
  return passages.filter(
    (passage) =>
      (filter.category === undefined || passage.category === filter.category) &&
      (filter.lang === undefined || passage.language === filter.lang) &&
      (filter.difficulty === undefined ||
        passage.difficulty === filter.difficulty) &&
      (filter.tag === undefined || passage.tags.includes(filter.tag)),
  );
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "ko");
}

/**
 * 분류(Category) -> 순서(Order) -> 제목(Title) 순으로 정렬한 새 배열을 반환한다(PRD 6장).
 * 엣지: Order가 없으면 Title로 비교한다. 원본 배열은 변경하지 않는다.
 * Order가 있는 항목을 없는 항목보다 앞에 두고, 마지막에 id로 비교해 결과를 결정적으로 만든다.
 */
export function sortPassages(
  passages: readonly PassageSummary[],
): PassageSummary[] {
  return [...passages].sort((a, b) => {
    const byCategory = compareText(a.category, b.category);
    if (byCategory !== 0) return byCategory;

    if (a.order !== undefined && b.order !== undefined) {
      if (a.order !== b.order) return a.order - b.order;
    } else if (a.order !== undefined) {
      return -1;
    } else if (b.order !== undefined) {
      return 1;
    }

    const byTitle = compareText(a.title, b.title);
    if (byTitle !== 0) return byTitle;

    return compareText(a.id, b.id);
  });
}

/**
 * 현재 예문 다음 예문의 id를 반환한다(F007, D7).
 * 입력: passages(호출측이 이미 필터·정렬한 목록), currentId.
 * 출력: 다음 예문 id. currentId가 마지막이거나 목록에 없으면 null.
 */
export function getNextPassageId(
  passages: readonly PassageSummary[],
  currentId: string,
): string | null {
  const index = passages.findIndex((passage) => passage.id === currentId);
  if (index === -1) return null;
  return passages[index + 1]?.id ?? null;
}

/**
 * 값이 있는 조건만 `?category=&lang=&difficulty=&tag=` 형태로 직렬화한다.
 * 조건이 하나도 없으면 빈 문자열을 반환한다.
 */
export function buildFilterQuery(filter: PassageFilter): string {
  const params = new URLSearchParams();
  if (filter.category) params.set("category", filter.category);
  if (filter.lang) params.set("lang", filter.lang);
  if (filter.difficulty) params.set("difficulty", filter.difficulty);
  if (filter.tag) params.set("tag", filter.tag);

  const query = params.toString();
  return query === "" ? "" : `?${query}`;
}

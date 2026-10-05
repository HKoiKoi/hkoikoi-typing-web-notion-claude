// 예문 목록 필터/정렬/다음 예문 시그니처 (PRD 6장 190행, D7). 구현은 Task 008.
// 순수 함수 모듈: React/Next/노션 SDK에 의존하지 않는다.
// 참고: `declare function`은 isolatedModules에서 값으로 export할 수 없어 throw 스텁으로 둔다.
/* eslint-disable @typescript-eslint/no-unused-vars -- 구현 전 스텁이라 매개변수가 미사용이다. 구현 Task에서 이 줄을 제거한다. (`_` 접두사는 이 프로젝트 lint에서 경고가 해소되지 않음) */

import type { PassageFilter, PassageSummary } from "@/types/passage";

/** URLSearchParams / Next ReadonlyURLSearchParams가 구조적으로 만족하는 최소 형태 */
export type SearchParamsLike = {
  get(name: string): string | null;
};

/**
 * URL 쿼리(`?category=&lang=&difficulty=&tag=`)를 PassageFilter로 변환한다.
 * 입력: SearchParamsLike. 출력: PassageFilter.
 * 엣지: 키가 없거나 빈 문자열이면 undefined. lang/difficulty가 허용 값(ko|en, Easy|Medium|Hard) 밖이면 undefined.
 * category/tag는 임의 문자열을 허용한다(존재하지 않는 값은 필터 결과 0건으로 처리).
 */
export function parseFilter(_searchParams: SearchParamsLike): PassageFilter {
  throw new Error("Task 008에서 구현");
}

/**
 * 필터 조건에 맞는 예문만 반환한다(AND 결합, 원본 배열은 변경하지 않는다).
 * 입력: passages, filter. 출력: 조건에 맞는 PassageSummary[].
 * 엣지: 정의되지 않은 조건은 무시, 모든 조건이 비면 전체 반환. tag는 tags 배열에 포함 여부로 판단한다.
 */
export function filterPassages(
  _passages: readonly PassageSummary[],
  _filter: PassageFilter,
): PassageSummary[] {
  throw new Error("Task 008에서 구현");
}

/**
 * 분류(Category) -> 순서(Order) -> 제목(Title) 순으로 정렬한 새 배열을 반환한다(PRD 6장).
 * 엣지: Order가 없으면 Title로 비교한다. 원본 배열은 변경하지 않는다.
 */
export function sortPassages(
  _passages: readonly PassageSummary[],
): PassageSummary[] {
  throw new Error("Task 008에서 구현");
}

/**
 * 현재 예문 다음 예문의 id를 반환한다(F007, D7).
 * 입력: passages(호출측이 이미 필터·정렬한 목록), currentId.
 * 출력: 다음 예문 id. currentId가 마지막이거나 목록에 없으면 null.
 */
export function getNextPassageId(
  _passages: readonly PassageSummary[],
  _currentId: string,
): string | null {
  throw new Error("Task 008에서 구현");
}

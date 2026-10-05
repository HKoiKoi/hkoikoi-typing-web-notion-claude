// 입력 길이 제한 (PRD 7.5).
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.

import { toCodePoints } from "./normalize";

/**
 * 입력을 target 길이(코드 포인트 기준)로 잘라낸다 (PRD 7.5).
 * 입력: input(입력창 값), target(현재 줄). 출력: 길이가 target 이하인 문자열.
 * 주의: **조합 중에는 호출 금지(호출측 책임)**. 조합 중 value를 바꾸면 IME 조합이 끊기거나
 * 글자가 중복된다(D10). `compositionend` 이후에만 적용하고, 조합 중 초과분은 judgeLine의 extra로 표시만 한다.
 * 엣지: input이 target보다 짧거나 같으면 그대로 반환한다(NFC 정규화는 적용된다).
 */
export function truncateToLine(input: string, target: string): string {
  return toCodePoints(input)
    .slice(0, toCodePoints(target).length)
    .join("");
}

// 현재 줄 판정 (PRD 7.1/7.4/7.5).
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.

import type { CharState, LineJudgement } from "@/types/typing";

import { toCodePoints } from "./normalize";

/** judgeLine 옵션 */
export type JudgeLineOptions = {
  /** IME 조합 중 여부. true이면 입력의 마지막 글자를 composing으로 중립 표시한다. */
  composing: boolean;
};

/**
 * 입력이 줄 전체와 정확히 일치하는지 (NFC + 코드 포인트 단위, 대소문자·특수문자 그대로 비교).
 * 조합 여부는 보지 않는다. 조합 중 제외는 judgeLine의 matches가 처리한다.
 */
export function isLineComplete(target: string, input: string): boolean {
  const t = toCodePoints(target);
  const i = toCodePoints(input);
  return t.length === i.length && t.every((ch, idx) => ch === i[idx]);
}

/**
 * 현재 줄 하나에 대해 입력 전체를 매번 재계산해 판정한다 (PRD 7.1/7.4/7.5/7.8).
 * 입력: target(정규화된 줄 텍스트), input(입력창 값 전체), options.composing.
 * 출력: 글자별 상태와 줄 일치 여부(LineJudgement).
 * 규칙
 * - 확정 구간(조합 중이면 마지막 글자 제외)은 즉시 correct/incorrect 판정.
 *   불일치한 글자의 target 또는 input 쪽이 공백이면 incorrectSpace.
 * - 조합 중인 마지막 글자는 composing(incorrect 사용 금지).
 * - 입력 위치 다음 글자는 current, 나머지는 pending. target을 넘는 입력은 extra(조합 중이어도 extra 우선).
 * - 비교는 NFC + 코드 포인트 단위, 대소문자·스마트 따옴표는 그대로 비교.
 * - matches는 조합 중이 아닐 때만 true가 될 수 있다.
 * 엣지: 빈 입력은 첫 글자 current / 나머지 pending. 조합 중 값 변경은 호출측이 하지 않는다(D10).
 */
export function judgeLine(
  target: string,
  input: string,
  options: JudgeLineOptions,
): LineJudgement {
  const t = toCodePoints(target);
  const i = toCodePoints(input);
  const length = Math.max(t.length, i.length);
  const states: CharState[] = [];

  for (let idx = 0; idx < length; idx += 1) {
    if (idx >= t.length) {
      states.push("extra");
    } else if (idx < i.length) {
      if (options.composing && idx === i.length - 1) {
        states.push("composing");
      } else if (i[idx] === t[idx]) {
        states.push("correct");
      } else if (i[idx] === " " || t[idx] === " ") {
        states.push("incorrectSpace");
      } else {
        states.push("incorrect");
      }
    } else if (idx === i.length) {
      states.push("current");
    } else {
      states.push("pending");
    }
  }

  return {
    states,
    matches: !options.composing && isLineComplete(target, input),
  };
}

// 현재 줄 판정 시그니처 (PRD 7.1/7.4/7.5). 구현은 Task 010.
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.
// 참고: `declare function`은 isolatedModules에서 값으로 export할 수 없어 throw 스텁으로 둔다.
/* eslint-disable @typescript-eslint/no-unused-vars -- 구현 전 스텁이라 매개변수가 미사용이다. 구현 Task에서 이 줄을 제거한다. (`_` 접두사는 이 프로젝트 lint에서 경고가 해소되지 않음) */

import type { LineJudgement } from "@/types/typing";

/** judgeLine 옵션 */
export type JudgeLineOptions = {
  /** IME 조합 중 여부. true이면 입력의 마지막 글자를 composing으로 중립 표시한다. */
  composing: boolean;
};

/**
 * 현재 줄 하나에 대해 입력 전체를 매번 재계산해 판정한다 (PRD 7.1/7.4/7.5/7.8).
 * 입력: target(정규화된 줄 텍스트), input(입력창 값 전체), options.composing.
 * 출력: 글자별 상태와 줄 일치 여부(LineJudgement).
 * 규칙
 * - 확정 구간(조합 중이면 마지막 글자 제외)은 즉시 correct/incorrect 판정, 틀린 공백은 incorrectSpace.
 * - 조합 중인 마지막 글자는 composing(incorrect 사용 금지).
 * - 입력 위치 다음 글자는 current, 나머지는 pending. target을 넘는 입력은 extra.
 * - 비교는 NFC + 코드 포인트 단위, 대소문자·스마트 따옴표는 그대로 비교한다.
 * 엣지: 빈 입력은 첫 글자 current / 나머지 pending. 조합 중 값 변경은 호출측이 하지 않는다(D10).
 */
export function judgeLine(
  _target: string,
  _input: string,
  _options: JudgeLineOptions,
): LineJudgement {
  throw new Error("Task 010에서 구현");
}

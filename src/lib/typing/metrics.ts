// 누적 집계와 지표 계산 시그니처 (PRD 7.6). 구현은 Task 010.
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.
// 참고: `declare function`은 isolatedModules에서 값으로 export할 수 없어 throw 스텁으로 둔다.
/* eslint-disable @typescript-eslint/no-unused-vars -- 구현 전 스텁이라 매개변수가 미사용이다. 구현 Task에서 이 줄을 제거한다. (`_` 접두사는 이 프로젝트 lint에서 경고가 해소되지 않음) */

import type { TypingMetrics, TypingStats } from "@/types/typing";

/** computeMetrics 입력 */
export type ComputeMetricsInput = {
  /** 전체 줄 글자 수(라벨·줄 사이 Enter 제외) */
  totalChars: number;
  /** 누적 입력 글자 수 */
  typed: number;
  /** 누적 오타 수 */
  mistakes: number;
  /** 첫 입력 ~ 마지막 줄 Enter까지의 경과 시간(ms) */
  elapsedMs: number;
};

/**
 * 확정 문자열의 차이로만 입력 수와 오타 수를 누적한다 (PRD 7.6 집계 명세).
 * 입력: prev(이전 누적), prevConfirmed(이전 확정 문자열), nextConfirmed(새 확정 문자열), target(현재 줄).
 * 출력: 새 TypingStats(prev는 변경하지 않는다).
 * 규칙
 * - 새로 추가·변경된 위치의 글자만 typed에 더하고, target과 다르면 mistakes에도 더한다.
 * - 같은 위치의 같은 글자는 중복 집계하지 않는다. 같은 문자열을 다시 전달하면 결과는 불변이다.
 * - 백스페이스 후 재입력은 새 입력으로 센다. 음절마다 compositionend가 온다고 가정하지 않는다.
 * 엣지: 한 번에 2글자 이상 확정돼도 차이만큼 정확히 집계한다.
 */
export function accumulateStats(
  _prev: TypingStats,
  _prevConfirmed: string,
  _nextConfirmed: string,
  _target: string,
): TypingStats {
  throw new Error("Task 010에서 구현");
}

/**
 * 정확도/CPM/WPM을 계산한다 (PRD 7.6).
 * 입력: ComputeMetricsInput. 출력: { accuracy, cpm, wpm }.
 * 식: 정확도 = (1 - mistakes / typed) * 100, CPM = totalChars / 분, WPM = (totalChars / 5) / 분.
 * 엣지: elapsedMs 0 이하이면 cpm/wpm은 0(NaN/Infinity 금지), typed 0이면 0으로 나누지 않고 정의한 기본값을 쓴다.
 */
export function computeMetrics(_input: ComputeMetricsInput): TypingMetrics {
  throw new Error("Task 010에서 구현");
}

// 누적 집계와 지표 계산 (PRD 7.6).
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.

import type { TypingMetrics, TypingStats } from "@/types/typing";

import { toCodePoints } from "./normalize";

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
 * - 두 확정 문자열의 공통 접두 이후 위치(새로 추가·변경된 위치)의 글자만 typed에 더하고,
 *   target과 다르면(target 범위를 넘는 글자 포함) mistakes에도 더한다.
 * - 같은 위치의 같은 글자는 중복 집계하지 않는다. 같은 문자열을 다시 전달하면 결과는 불변이다.
 * - 백스페이스로 짧아지기만 하면 불변이고, 이후 재입력은 새 입력으로 센다.
 *   음절마다 compositionend가 온다고 가정하지 않는다.
 * 엣지: 한 번에 2글자 이상 확정돼도 차이만큼 정확히 집계한다.
 */
export function accumulateStats(
  prev: TypingStats,
  prevConfirmed: string,
  nextConfirmed: string,
  target: string,
): TypingStats {
  const before = toCodePoints(prevConfirmed);
  const after = toCodePoints(nextConfirmed);
  const goal = toCodePoints(target);

  let common = 0;
  while (
    common < before.length &&
    common < after.length &&
    before[common] === after[common]
  ) {
    common += 1;
  }

  let typed = prev.typed;
  let mistakes = prev.mistakes;
  for (let idx = common; idx < after.length; idx += 1) {
    typed += 1;
    if (after[idx] !== goal[idx]) mistakes += 1;
  }
  return { typed, mistakes };
}

/**
 * 정확도/CPM/WPM을 계산한다 (PRD 7.6).
 * 입력: ComputeMetricsInput. 출력: { accuracy, cpm, wpm }. 반올림은 표시 계층의 책임이다.
 * 식: 정확도 = (1 - mistakes / typed) * 100, CPM = totalChars / 분, WPM = (totalChars / 5) / 분.
 * 엣지: elapsedMs가 0 이하이거나 유한하지 않으면 cpm/wpm은 0(NaN/Infinity 금지).
 *       typed가 0 이하이면 0으로 나누지 않고 정확도 기본값 100을 쓴다(오타가 아직 없음). 정확도는 0~100으로 제한한다.
 */
export function computeMetrics({
  totalChars,
  typed,
  mistakes,
  elapsedMs,
}: ComputeMetricsInput): TypingMetrics {
  const accuracy =
    typed > 0
      ? Math.min(100, Math.max(0, (1 - mistakes / typed) * 100))
      : 100;

  const minutes = elapsedMs / 60000;
  const hasTime = Number.isFinite(minutes) && minutes > 0;
  const cpm = hasTime ? totalChars / minutes : 0;
  const wpm = hasTime ? totalChars / 5 / minutes : 0;

  return {
    accuracy,
    cpm: Number.isFinite(cpm) ? cpm : 0,
    wpm: Number.isFinite(wpm) ? wpm : 0,
  };
}

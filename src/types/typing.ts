// 타이핑 판정/지표 타입 (PRD 7장, 5장 TypingResult). Task 006.
// 세부 필드는 Task 010(순수 함수 구현)에서 조정될 수 있다.
// React/DOM/Next에 의존하지 않는다.

/**
 * 글자 하나의 판정 상태 (PRD 7.1/7.2/7.4/7.5).
 * - correct / incorrect: 확정 구간의 일치 / 불일치
 * - incorrectSpace: 틀린 공백 (배경색으로 구분, 7.2-4)
 * - pending: 아직 입력하지 않은 글자
 * - current: 다음에 입력할 위치(커서)
 * - composing: 조합 중인 마지막 글자 (중립 표시, 틀림 색 금지, 7.4)
 * - extra: 줄 길이를 넘는 초과 입력 (7.5)
 */
export type CharState =
  | "correct"
  | "incorrect"
  | "incorrectSpace"
  | "pending"
  | "current"
  | "composing"
  | "extra";

/**
 * 현재 줄 하나에 대한 판정 결과 (PRD 7.1/7.3/7.4/7.5).
 * 세부 필드는 Task 010에서 조정될 수 있다.
 */
export type LineJudgement = {
  /**
   * 표시용 글자별 상태. 줄 글자 수만큼 + 초과 입력(extra)만큼의 길이를 가진다.
   * 코드 포인트 단위(7.1).
   */
  states: CharState[];
  /**
   * 입력이 줄 전체와 정확히 일치하는지 (Enter 전환 조건, 7.3/7.7).
   * 조합 중이면 확정되지 않았으므로 false가 될 수 있다.
   */
  matches: boolean;
};

/**
 * 누적 집계 값 (PRD 7.6 "집계 명세"). 전체 줄을 합산한다.
 * 세부 필드는 Task 010에서 조정될 수 있다.
 */
export type TypingStats = {
  /** 누적 입력 글자 수(확정된 글자만, 백스페이스 후 재입력도 새 입력으로 계산) */
  typed: number;
  /** 누적 오타 수(글자가 확정될 때 줄과 다르면 +1) */
  mistakes: number;
};

/** 지표 계산 결과 (PRD 7.6). */
export type TypingMetrics = {
  /** 정확도(%) = (1 - mistakes / typed) * 100 */
  accuracy: number;
  /** 타수(음절/분) */
  cpm: number;
  /** (글자 수 / 5) / 분 */
  wpm: number;
};

/** 타이핑 진행 상태. */
export type TypingStatus = "idle" | "typing" | "finished";

/** 결과 요약 (PRD 5장). F011에서만 localStorage에 저장한다. */
export type TypingResult = {
  passageId: string;
  accuracy: number;
  elapsedMs: number;
  cpm: number;
  wpm: number;
  mistakes: number;
  lineCount: number;
};

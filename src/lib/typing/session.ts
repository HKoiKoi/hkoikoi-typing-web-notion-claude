// 타이핑 세션 reducer (PRD 7.3 줄 전환, 7.4 한글 조합, 7.5 입력 길이, 7.6 집계, 7.7 백스페이스/오류 정책).
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다. 시간(performance.now 값)은 이벤트로 주입받는다.

import type { TypingStats, TypingStatus } from "@/types/typing";

import { isLineComplete } from "./judge";
import { accumulateStats } from "./metrics";
import {
  initialPendingEnterState,
  stepPendingEnter,
  type PendingEnterAction,
  type PendingEnterState,
} from "./pending-enter";
import { truncateToLine } from "./truncate";

/** 세션 전체 상태. 입력 버퍼는 현재 줄 하나에 대한 것이다(PRD 7.3). */
export type TypingSessionState = {
  status: TypingStatus;
  /** 현재 줄 인덱스. finished여도 마지막 줄 인덱스를 유지한다. */
  lineIndex: number;
  /** 입력창 값(controlled). 조합 중에는 onChange 값을 그대로 반영한다(D10). */
  buffer: string;
  /** 마지막으로 집계에 반영한 확정 문자열(accumulateStats의 prevConfirmed) */
  lastConfirmed: string;
  /** 완료한 줄의 확정 입력 */
  committedPerLine: string[];
  /** 조합/Enter 보류 상태(pending-enter.ts 재사용) */
  pending: PendingEnterState;
  /** 첫 입력 시각(ms). 입력 전에는 null */
  startedAt: number | null;
  /** 마지막 줄 일치 Enter 시각(ms). 종료 전에는 null */
  finishedAt: number | null;
  /** 전체 줄 누적 집계 */
  acc: TypingStats;
  /** 불일치 Enter 횟수. 값이 바뀌면 화면이 짧은 강조(shake)를 재생한다. */
  rejectSeq: number;
  /** 불일치 Enter 이후 입력이 바뀌기 전까지 true("줄이 일치하지 않습니다" 표시용) */
  mismatch: boolean;
  /** 마지막 줄 전환(advance) 시각(ms). 전환 직후 따라오는 Enter를 거르는 데 쓴다. 전환 전에는 null */
  lastAdvanceAt: number | null;
};

/**
 * 줄 전환 직후 이 시간 안에 입력창이 빈 채로 오는 비조합 Enter는 같은 Enter 입력의 잔여 keydown으로 보고 무시한다.
 * 이벤트 순서(IME 구현 차이)와 무관하게 오판(reject)을 막기 위한 안전망이다(PRD 7.3).
 */
export const STRAY_ENTER_WINDOW_MS = 300;

/** reducer 입력 이벤트. now는 호출측이 performance.now()로 읽어 넣는다. */
export type TypingSessionEvent =
  | {
      kind: "input";
      value: string;
      /** 입력 이벤트의 isComposing */
      composing: boolean;
      now: number;
    }
  | { kind: "compositionstart" }
  | { kind: "compositionend"; value: string; now: number }
  | {
      kind: "keydown-enter";
      /** `isComposing || keyCode === 229` */
      composingFlag: boolean;
      value: string;
      now: number;
      /** 키를 누르고 있어 반복 발생한 keydown(`e.repeat`). 반복 Enter는 판정하지 않는다. */
      repeat?: boolean;
    }
  | { kind: "keyup-enter" }
  | { kind: "reset" };

export function createInitialSessionState(): TypingSessionState {
  return {
    status: "idle",
    lineIndex: 0,
    buffer: "",
    lastConfirmed: "",
    committedPerLine: [],
    pending: initialPendingEnterState,
    startedAt: null,
    finishedAt: null,
    acc: { typed: 0, mistakes: 0 },
    rejectSeq: 0,
    mismatch: false,
    lastAdvanceAt: null,
  };
}

/** 입력창에는 줄바꿈이 들어가지 않는다(PRD 7.3). */
function stripNewlines(value: string): string {
  return value.replace(/[\r\n]+/g, "");
}

/** 첫 비어 있지 않은 입력에서 타이머를 시작한다(PRD 7.6). */
function startIfNeeded(
  state: TypingSessionState,
  value: string,
  now: number,
): Pick<TypingSessionState, "status" | "startedAt"> {
  if (state.status === "idle" && value !== "") {
    return { status: "typing", startedAt: now };
  }
  return { status: state.status, startedAt: state.startedAt };
}

/** 확정 문자열을 반영한다: 길이 초과분을 자르고(조합 중이 아닐 때만 호출) 차이만큼 집계한다. */
function confirm(
  state: TypingSessionState,
  value: string,
  target: string,
  now: number,
): TypingSessionState {
  const next = truncateToLine(stripNewlines(value), target);
  return {
    ...state,
    ...startIfNeeded(state, next, now),
    buffer: next,
    lastConfirmed: next,
    mismatch: false,
    acc: accumulateStats(state.acc, state.lastConfirmed, next, target),
  };
}

/** advance는 다음 줄 또는 종료, reject는 불일치 신호. 보류 상태(suppressEnter 포함)는 건드리지 않는다. */
function applyAction(
  state: TypingSessionState,
  action: PendingEnterAction,
  lineCount: number,
  now: number,
): TypingSessionState {
  if (action === "reject") {
    return { ...state, rejectSeq: state.rejectSeq + 1, mismatch: true };
  }
  if (action === "advance") {
    const committedPerLine = [...state.committedPerLine, state.buffer];
    if (state.lineIndex >= lineCount - 1) {
      return {
        ...state,
        status: "finished",
        buffer: "",
        lastConfirmed: "",
        committedPerLine,
        finishedAt: now,
        mismatch: false,
        lastAdvanceAt: now,
      };
    }
    return {
      ...state,
      lineIndex: state.lineIndex + 1,
      buffer: "",
      lastConfirmed: "",
      committedPerLine,
      mismatch: false,
      lastAdvanceAt: now,
    };
  }
  return state;
}

/**
 * 세션 reducer.
 * - 조합 중 input은 buffer만 갱신한다(집계·진행도·truncate 금지, D10).
 * - 조합이 아닌 input(영어 포함)은 truncate 후 차이만큼 집계한다.
 * - compositionend는 확정 값을 반영한 뒤 보류된 Enter를 그 값으로 판정한다.
 * - Enter는 줄 전체 일치일 때만 이동하고 불일치면 rejectSeq만 올린다.
 * - finished 이후에는 reset 외의 이벤트를 무시한다.
 */
export function sessionReducer(
  state: TypingSessionState,
  event: TypingSessionEvent,
  lines: readonly string[],
): TypingSessionState {
  if (event.kind === "reset") return createInitialSessionState();
  if (state.status === "finished") return state;

  const target = lines[state.lineIndex] ?? "";

  switch (event.kind) {
    case "input": {
      const value = stripNewlines(event.value);
      if (event.composing) {
        return {
          ...state,
          ...startIfNeeded(state, value, event.now),
          buffer: value,
          mismatch: false,
        };
      }
      return confirm(state, value, target, event.now);
    }

    case "compositionstart":
      return {
        ...state,
        pending: stepPendingEnter(state.pending, event).state,
      };

    case "compositionend": {
      const confirmed = confirm(state, event.value, target, event.now);
      const result = stepPendingEnter(state.pending, {
        kind: "compositionend",
        matches: isLineComplete(target, confirmed.buffer),
      });
      return applyAction(
        { ...confirmed, pending: result.state },
        result.action,
        lines.length,
        event.now,
      );
    }

    case "keydown-enter": {
      // 키를 누르고 있어 반복되는 Enter는 한 번의 입력으로 본다(첫 keydown만 판정).
      if (event.repeat) return state;
      const value = stripNewlines(event.value);
      const result = stepPendingEnter(state.pending, {
        kind: "keydown-enter",
        composingFlag: event.composingFlag,
        matches: isLineComplete(target, value),
      });
      // 줄 전환 직후 빈 입력창에 오는 비조합 Enter는 잔여 keydown이므로 오판(reject)으로 처리하지 않는다.
      const strayAfterAdvance =
        result.action === "reject" &&
        !event.composingFlag &&
        value === "" &&
        state.lastAdvanceAt !== null &&
        event.now - state.lastAdvanceAt < STRAY_ENTER_WINDOW_MS;
      return applyAction(
        { ...state, pending: result.state },
        strayAfterAdvance ? "none" : result.action,
        lines.length,
        event.now,
      );
    }

    case "keyup-enter":
      return {
        ...state,
        pending: stepPendingEnter(state.pending, event).state,
      };
  }
}

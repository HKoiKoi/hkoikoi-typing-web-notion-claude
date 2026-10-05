"use client";

import { useReducer, useRef } from "react";

import { judgeLine } from "@/lib/typing/judge";
import {
  createInitialSessionState,
  sessionReducer,
  type TypingSessionEvent,
  type TypingSessionState,
} from "@/lib/typing/session";
import type { Line } from "@/types/passage";
import type { LineJudgement } from "@/types/typing";

// 타이핑 입력 엔진 훅 (PRD 7.3~7.7, 결정 D10).
// 이벤트 → TypingSessionEvent 변환과 DOM 부수효과(preventDefault, beforeinput 차단, 포커스)만 맡고,
// 상태 전이는 순수 reducer(@/lib/typing/session)에 위임한다.
// 입력은 controlled를 유지하며 조합 중에는 onChange 값을 그대로 반영한다(조합 중 value 변경 금지).
// 화면 연결(TypingScreen)은 Task 014에서 한다.

// 붙여넣기·드롭·줄바꿈 입력은 beforeinput에서 차단한다(PRD 7.3/7.5).
const BLOCKED_INPUT_TYPES = new Set([
  "insertFromPaste",
  "insertFromDrop",
  "insertLineBreak",
  "insertParagraph",
]);

export type UseTypingSessionResult = {
  state: TypingSessionState;
  /** IME 조합 중 여부 */
  isComposing: boolean;
  /** 조합 중 Enter가 보류된 상태 */
  pendingEnter: boolean;
  /** 현재 줄 글자별 판정(조합 중 마지막 글자는 composing) */
  currentJudgement: LineJudgement;
  /** 불일치 Enter 후 입력이 바뀌기 전까지 true */
  mismatch: boolean;
  /** 불일치 Enter마다 바뀌는 값. key로 쓰면 강조 효과를 다시 재생할 수 있다. */
  shakeKey: number;
  /** 시작~현재(종료됐으면 종료 시각)까지의 ms. 시작 전이면 0. now는 호출측이 performance.now()로 넘겨도 된다. */
  getElapsedMs: (now?: number) => number;
  /** 입력/타이머/줄 위치 전체 초기화 */
  reset: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  focusInput: () => void;
  /** 숨은 input에 펼쳐 쓰는 props */
  inputProps: {
    ref: (el: HTMLInputElement | null) => (() => void) | void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCompositionStart: () => void;
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent<HTMLInputElement>) => void;
    "aria-label": string;
    autoComplete: "off";
    autoCorrect: "off";
    autoCapitalize: "off";
    spellCheck: false;
  };
};

export function useTypingSession(lines: Line[]): UseTypingSessionResult {
  const texts = lines.map((line) => line.text);
  const [state, dispatch] = useReducer(
    (current: TypingSessionState, event: TypingSessionEvent) =>
      sessionReducer(current, event, texts),
    undefined,
    createInitialSessionState,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력창은 줄마다 다른 DOM으로 다시 마운트되므로, 요소가 붙을 때마다 beforeinput 차단을 건다(콜백 ref).
  function attachInput(el: HTMLInputElement | null) {
    inputRef.current = el;
    if (!el) return;
    const handler = (e: InputEvent) => {
      if (BLOCKED_INPUT_TYPES.has(e.inputType)) e.preventDefault();
    };
    el.addEventListener("beforeinput", handler);
    return () => {
      el.removeEventListener("beforeinput", handler);
      if (inputRef.current === el) inputRef.current = null;
    };
  }

  const isComposing = state.pending.composing;
  const currentJudgement = judgeLine(texts[state.lineIndex] ?? "", state.buffer, {
    composing: isComposing,
  });

  function reset() {
    dispatch({ kind: "reset" });
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  function getElapsedMs(now: number = performance.now()) {
    if (state.startedAt === null) return 0;
    return Math.max(0, (state.finishedAt ?? now) - state.startedAt);
  }

  const inputProps: UseTypingSessionResult["inputProps"] = {
    ref: attachInput,
    value: state.buffer,
    onChange: (e) =>
      dispatch({
        kind: "input",
        value: e.target.value,
        composing: (e.nativeEvent as InputEvent).isComposing === true,
        now: performance.now(),
      }),
    onCompositionStart: () => dispatch({ kind: "compositionstart" }),
    onCompositionEnd: (e) =>
      dispatch({
        kind: "compositionend",
        value: e.currentTarget.value,
        now: performance.now(),
      }),
    onKeyDown: (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dispatch({ kind: "reset" });
        return;
      }
      if (e.key !== "Enter") return;
      // 조합 중이든 아니든 줄바꿈 문자가 입력창에 들어가지 않게 한다.
      e.preventDefault();
      dispatch({
        kind: "keydown-enter",
        composingFlag: e.nativeEvent.isComposing || e.keyCode === 229,
        value: e.currentTarget.value,
        now: performance.now(),
        repeat: e.repeat,
      });
    },
    onKeyUp: (e) => {
      if (e.key === "Enter") dispatch({ kind: "keyup-enter" });
    },
    onPaste: (e) => e.preventDefault(),
    onDrop: (e) => e.preventDefault(),
    "aria-label": "타이핑 입력",
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
  };

  return {
    state,
    isComposing,
    pendingEnter: state.pending.pendingEnter,
    currentJudgement,
    mismatch: state.mismatch,
    shakeKey: state.rejectSeq,
    getElapsedMs,
    reset,
    inputRef,
    focusInput,
    inputProps,
  };
}

// 조합 중 Enter 보류(pendingEnter) 순수 reducer (PRD 7.3/7.4).
// React/Next/DOM 전역에 의존하지 않는다. preventDefault 등 부수효과는 호출측 책임이다.

/** 입력 요소의 IME 조합/Enter 보류 상태 */
export type PendingEnterState = {
  composing: boolean;
  pendingEnter: boolean;
  // 보류된 Enter를 compositionend에서 판정한 직후, Chrome(mac)이 보내는 두 번째 Enter keydown을 무시하기 위한 표식
  suppressEnter: boolean;
};

export const initialPendingEnterState: PendingEnterState = {
  composing: false,
  pendingEnter: false,
  suppressEnter: false,
};

/**
 * reducer 입력 이벤트.
 * - matches: 호출측이 확정된 value 기준으로 줄 일치 여부를 계산해 주입한다.
 * - composingFlag: `isComposing || keyCode === 229`
 */
export type PendingEnterEvent =
  | { kind: "compositionstart" }
  | { kind: "compositionend"; matches: boolean }
  | { kind: "keydown-enter"; composingFlag: boolean; matches: boolean }
  | { kind: "keyup-enter" }
  | { kind: "input" };

/** advance: 다음 줄로 이동 / reject: 불일치 표시 / none: 아무 동작 없음 */
export type PendingEnterAction = "advance" | "reject" | "none";

export type PendingEnterResult = {
  state: PendingEnterState;
  action: PendingEnterAction;
};

function judge(matches: boolean): PendingEnterAction {
  return matches ? "advance" : "reject";
}

export function stepPendingEnter(
  state: PendingEnterState,
  event: PendingEnterEvent,
): PendingEnterResult {
  switch (event.kind) {
    case "compositionstart":
      return {
        state: { ...state, composing: true, suppressEnter: false },
        action: "none",
      };

    case "compositionend": {
      // 보류된 Enter가 있으면 확정 값으로 판정한다. 없으면(Safari형 등) 판정하지 않는다.
      // Chrome(mac)은 이어서 비조합 Enter keydown을 한 번 더 보내므로 그 Enter를 무시하도록 표시한다.
      const action = state.pendingEnter ? judge(event.matches) : "none";
      return {
        state: {
          composing: false,
          pendingEnter: false,
          suppressEnter: state.pendingEnter,
        },
        action,
      };
    }

    case "keydown-enter":
      if (event.composingFlag) {
        // 조합 중 Enter: 보류만 기록한다(호출측이 preventDefault).
        return {
          state: { ...state, pendingEnter: true, suppressEnter: false },
          action: "none",
        };
      }
      if (state.suppressEnter) {
        // 같은 Enter 입력의 두 번째 keydown: 판정하지 않는다.
        return { state: { ...state, suppressEnter: false }, action: "none" };
      }
      // 비조합 Enter: 즉시 판정. 남아 있던 보류는 해제해 중복 advance를 막는다.
      return {
        state: { ...state, pendingEnter: false },
        action: judge(event.matches),
      };

    case "keyup-enter":
      // 물리 Enter를 뗐으므로 무시 표식을 해제한다.
      return { state: { ...state, suppressEnter: false }, action: "none" };

    case "input":
      return { state, action: "none" };
  }
}

/** 이벤트 배열을 순서대로 재생해 최종 상태와 advance 횟수를 반환한다. */
export function replayScenario(
  events: readonly PendingEnterEvent[],
  initial: PendingEnterState = initialPendingEnterState,
): { state: PendingEnterState; advanceCount: number; rejectCount: number } {
  let state = initial;
  let advanceCount = 0;
  let rejectCount = 0;
  for (const event of events) {
    const result = stepPendingEnter(state, event);
    state = result.state;
    if (result.action === "advance") advanceCount += 1;
    if (result.action === "reject") rejectCount += 1;
  }
  return { state, advanceCount, rejectCount };
}

export type PendingEnterScenario = {
  name: string;
  events: readonly PendingEnterEvent[];
  expectedAdvanceCount: number;
  expectedRejectCount: number;
};

/** 브라우저별 이벤트 순서 재생용 시나리오 (matches는 true로 고정) */
export const pendingEnterScenarios: readonly PendingEnterScenario[] = [
  {
    name: "Chrome형 (조합 중 Enter → compositionend)",
    events: [
      { kind: "compositionstart" },
      { kind: "keydown-enter", composingFlag: true, matches: true },
      { kind: "compositionend", matches: true },
    ],
    expectedAdvanceCount: 1,
    expectedRejectCount: 0,
  },
  {
    name: "Chrome(mac) 실측형 (조합 중 Enter → compositionend → 두 번째 Enter, 입력창은 비워짐)",
    events: [
      { kind: "compositionstart" },
      { kind: "keydown-enter", composingFlag: true, matches: true },
      { kind: "compositionend", matches: true },
      { kind: "keydown-enter", composingFlag: false, matches: false },
      { kind: "keyup-enter" },
    ],
    expectedAdvanceCount: 1,
    expectedRejectCount: 0,
  },
  {
    name: "Safari형 (compositionend → Enter)",
    events: [
      { kind: "compositionstart" },
      { kind: "compositionend", matches: true },
      { kind: "keydown-enter", composingFlag: false, matches: true },
    ],
    expectedAdvanceCount: 1,
    expectedRejectCount: 0,
  },
  {
    name: "영어 (조합 없음)",
    events: [{ kind: "keydown-enter", composingFlag: false, matches: true }],
    expectedAdvanceCount: 1,
    expectedRejectCount: 0,
  },
];

// 임시 개발용 검증 케이스: 타이핑 세션 reducer 기대값 표. Task 018에서 제거한다.
// 기대값(expected)은 구현 결과가 아니라 docs/PRD.md 7.3~7.7과 ROADMAP Task 013 체크리스트에서 직접 썼다.

import {
  createInitialSessionState,
  sessionReducer,
  type TypingSessionEvent,
  type TypingSessionState,
} from "@/lib/typing/session";

import type { LabCase, LabResult } from "../typing-lab/cases";

type Event = TypingSessionEvent;

function run(lines: string[], events: Event[]): TypingSessionState {
  return events.reduce(
    (state, event) => sessionReducer(state, event, lines),
    createInitialSessionState(),
  );
}

// 입력 이벤트 축약 헬퍼
const typeText = (value: string, now = 0): Event => ({
  kind: "input",
  value,
  composing: false,
  now,
});
const typeComposing = (value: string, now = 0): Event => ({
  kind: "input",
  value,
  composing: true,
  now,
});
const compStart: Event = { kind: "compositionstart" };
const compEnd = (value: string, now = 0): Event => ({
  kind: "compositionend",
  value,
  now,
});
const enter = (value: string, composingFlag = false, now = 0): Event => ({
  kind: "keydown-enter",
  composingFlag,
  value,
  now,
});
const enterUp: Event = { kind: "keyup-enter" };

// 비교에 쓰는 필드만 골라낸다.
function view(state: TypingSessionState) {
  return {
    status: state.status,
    lineIndex: state.lineIndex,
    buffer: state.buffer,
    acc: state.acc,
    rejectSeq: state.rejectSeq,
  };
}

const TWO = ["닭이", "b"];

export const sessionCases: LabCase[] = [
  // 줄 전환 (PRD 7.3)
  {
    group: "줄 전환",
    name: "Chrome형: 조합 중 Enter → compositionend, 전환 1회",
    actual: view(
      run(TWO, [
        compStart,
        typeComposing("닭"),
        typeComposing("닭이"),
        enter("닭이", true),
        compEnd("닭이"),
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "줄 전환",
    name: "Chrome(mac) 실측형: 두 번째 Enter는 무시되어 오판(reject) 없음",
    actual: view(
      run(TWO, [
        compStart,
        typeComposing("닭이"),
        enter("닭이", true),
        compEnd("닭이"),
        enter("", false),
        enterUp,
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "줄 전환",
    name: "compositionend 선행형: compositionend가 먼저 오고 Enter, 전환 1회",
    actual: view(
      run(TWO, [
        compStart,
        typeComposing("닭이"),
        compEnd("닭이"),
        enter("닭이", false),
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "줄 전환",
    name: "영어: 조합 없이 Enter 즉시 전환, 입력 버퍼 비워짐",
    actual: view(run(["ab", "c"], [typeText("a"), typeText("ab"), enter("ab")])),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "줄 전환",
    name: "조합 중 Enter + 불일치 확정: 이동 없이 reject 1회(두 번째 Enter 무시)",
    actual: view(
      run(["가나", "b"], [
        compStart,
        typeComposing("가"),
        enter("가", true),
        compEnd("가"),
        enter("가", false),
        enterUp,
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "가",
      acc: { typed: 1, mistakes: 0 },
      rejectSeq: 1,
    },
  },
  // 오류 정책 (PRD 7.3/7.7)
  {
    group: "오류 정책",
    name: "틀린 글자 후 Enter: 이동 없음, reject 1회, mismatch 표시",
    actual: (() => {
      const s = run(["ab", "c"], [typeText("ax"), enter("ax")]);
      return { ...view(s), mismatch: s.mismatch };
    })(),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "ax",
      acc: { typed: 2, mistakes: 1 },
      rejectSeq: 1,
      mismatch: true,
    },
  },
  {
    group: "오류 정책",
    name: "일부만 입력하고 Enter: 이동 없음",
    actual: view(run(["ab", "c"], [typeText("a"), enter("a")])),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "a",
      acc: { typed: 1, mistakes: 0 },
      rejectSeq: 1,
    },
  },
  {
    group: "오류 정책",
    name: "틀린 글자 → 백스페이스 수정 → Enter 이동, 재입력도 입력 수로 집계",
    actual: view(
      run(["ab", "c"], [
        typeText("ax"),
        typeText("a"),
        typeText("ab"),
        enter("ab"),
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 3, mistakes: 1 },
      rejectSeq: 0,
    },
  },
  {
    group: "오류 정책",
    name: "입력이 바뀌면 mismatch 해제",
    actual: run(["ab"], [typeText("ax"), enter("ax"), typeText("a")]).mismatch,
    expected: false,
  },
  // 한글 조합 (PRD 7.4)
  {
    group: "한글 조합",
    name: "조합 중 input: buffer만 갱신, 입력 수·오타 수 불변",
    actual: view(run(["닭이"], [compStart, typeComposing("닭")])),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "닭",
      acc: { typed: 0, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "한글 조합",
    name: "compositionend 후 확정 글자로 집계 갱신",
    actual: view(run(["닭이"], [compStart, typeComposing("닭"), compEnd("닭")])),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "닭",
      acc: { typed: 1, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "한글 조합",
    name: "확정 후 틀린 글자는 오타 1",
    actual: view(run(["닭이"], [compStart, typeComposing("닮"), compEnd("닮")]))
      .acc,
    expected: { typed: 1, mistakes: 1 },
  },
  // 입력 제한 (PRD 7.5)
  {
    group: "입력 제한",
    name: "조합 중 초과 입력: value 강제 변경 없음",
    actual: run(["가"], [compStart, typeComposing("가나")]).buffer,
    expected: "가나",
  },
  {
    group: "입력 제한",
    name: "조합 확정 후 초과분 잘림, 집계는 잘린 글자만",
    actual: view(run(["가"], [compStart, typeComposing("가나"), compEnd("가나")])),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "가",
      acc: { typed: 1, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "입력 제한",
    name: "비조합(영어) 초과 입력은 즉시 잘림",
    actual: view(run(["ab"], [typeText("abcd")])),
    expected: {
      status: "typing",
      lineIndex: 0,
      buffer: "ab",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "입력 제한",
    name: "줄바꿈 문자는 입력되지 않음",
    actual: run(["ab"], [typeText("a\nb")]).buffer,
    expected: "ab",
  },
  {
    group: "입력 제한",
    name: "첫 줄에서 빈 입력(백스페이스) 반복: 줄 위치 유지",
    actual: view(run(["ab", "c"], [typeText(""), typeText(""), typeText("")])),
    expected: {
      status: "idle",
      lineIndex: 0,
      buffer: "",
      acc: { typed: 0, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  // 집계 (PRD 7.6)
  {
    group: "집계",
    name: "같은 확정 값 재전달: 입력 수 불변",
    actual: run(["ab"], [typeText("ab"), typeText("ab")]).acc,
    expected: { typed: 2, mistakes: 0 },
  },
  // 타이머와 종료 (PRD 7.6/7.3)
  {
    group: "타이머",
    name: "빈 입력은 타이머를 시작하지 않고 첫 글자에서 시작",
    actual: {
      beforeFirst: run(["ab"], [typeText("", 50)]).startedAt,
      afterFirst: run(["ab"], [typeText("", 50), typeText("a", 70)]).startedAt,
    },
    expected: { beforeFirst: null, afterFirst: 70 },
  },
  {
    group: "타이머",
    name: "마지막 줄 일치 Enter: finished와 종료 시각 기록",
    actual: (() => {
      const s = run(["ab"], [typeText("a", 100), typeText("ab", 150), enter("ab", false, 400)]);
      return {
        status: s.status,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        committed: s.committedPerLine,
      };
    })(),
    expected: {
      status: "finished",
      startedAt: 100,
      finishedAt: 400,
      committed: ["ab"],
    },
  },
  {
    group: "타이머",
    name: "finished 이후 입력·Enter 무시",
    actual: view(
      run(["ab"], [typeText("ab", 1), enter("ab", false, 2), typeText("x", 3), enter("x", false, 4)]),
    ),
    expected: {
      status: "finished",
      lineIndex: 0,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  // 초기화 (PRD 7.3 제어)
  {
    group: "초기화",
    name: "reset: 입력·타이머·줄 위치·집계 전체 초기화",
    actual: view(
      run(["ab", "c"], [typeText("ab", 10), enter("ab", false, 20), { kind: "reset" }]),
    ),
    expected: {
      status: "idle",
      lineIndex: 0,
      buffer: "",
      acc: { typed: 0, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "초기화",
    name: "reset 후 startedAt·finishedAt·committedPerLine 비움",
    actual: (() => {
      const s = run(["ab"], [typeText("ab", 10), enter("ab", false, 20), { kind: "reset" }]);
      return [s.startedAt, s.finishedAt, s.committedPerLine];
    })(),
    expected: [null, null, []],
  },
  // 줄 전환 직후 잔여 Enter 방어 (PRD 7.3: 이벤트 순서와 무관하게 Enter 한 번으로 동작)
  {
    group: "잔여 Enter 방어",
    name: "줄 전환 직후 빈 입력창의 비조합 Enter(100ms 이내)는 reject 없이 무시",
    actual: view(
      run(["ab", "c"], [typeText("ab", 0), enter("ab", false, 10), enter("", false, 110)]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "잔여 Enter 방어",
    name: "조합 확정 Enter의 두 번째 keydown(무시 표식 소진) 뒤 또 오는 Enter도 reject 없음",
    actual: view(
      run(["닭이", "b"], [
        compStart,
        typeComposing("닭이", 0),
        enter("닭이", true, 10),
        compEnd("닭이", 20),
        enter("", false, 30),
        enterUp,
        enter("", false, 60),
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
  {
    group: "잔여 Enter 방어",
    name: "줄 전환 1.5초 뒤 일부러 누른 빈 입력 Enter는 reject 1회",
    actual: view(
      run(["ab", "c"], [typeText("ab", 0), enter("ab", false, 10), enter("", false, 1500)]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 1,
    },
  },
  {
    group: "잔여 Enter 방어",
    name: "줄 전환 직후라도 글자가 있는 불일치 Enter는 reject 1회",
    actual: view(
      run(["ab", "c"], [
        typeText("ab", 0),
        enter("ab", false, 10),
        typeText("x", 50),
        enter("x", false, 100),
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "x",
      acc: { typed: 3, mistakes: 1 },
      rejectSeq: 1,
    },
  },
  {
    group: "잔여 Enter 방어",
    name: "Enter 키 반복(repeat)은 판정하지 않는다(전환 1회, reject 0회)",
    actual: view(
      run(["ab", "ab", "c"], [
        typeText("ab", 0),
        enter("ab", false, 10),
        { kind: "keydown-enter", composingFlag: false, value: "", now: 600, repeat: true },
        { kind: "keydown-enter", composingFlag: false, value: "", now: 640, repeat: true },
      ]),
    ),
    expected: {
      status: "typing",
      lineIndex: 1,
      buffer: "",
      acc: { typed: 2, mistakes: 0 },
      rejectSeq: 0,
    },
  },
];

export function runSessionCases(): LabResult[] {
  return sessionCases.map((c) => {
    const actualText = JSON.stringify(c.actual);
    const expectedText = JSON.stringify(c.expected);
    return { ...c, actualText, expectedText, pass: actualText === expectedText };
  });
}

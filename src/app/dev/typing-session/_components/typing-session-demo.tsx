"use client";

import { useState } from "react";
import { useInterval } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTypingSession } from "@/hooks/use-typing-session";
import type { Line } from "@/types/passage";

import { TypingBoard } from "@/app/passages/[id]/_components/typing-board";

// 임시 개발용: useTypingSession 훅 데모. Task 018에서 제거한다.
// 영어 2줄 + 한글 1줄. 실제 화면 연결(TypingScreen)은 Task 014에서 한다.
const DEMO_LINES: Line[] = [
  { text: "hello world" },
  { text: "good day" },
  { text: "닭이 읽은 왜", label: "1절" },
];

export function TypingSessionDemo() {
  const session = useTypingSession(DEMO_LINES);
  const { state, inputProps } = session;
  // 경과 시간 표시용 틱. 렌더 중에는 performance.now()를 읽지 않는다.
  const [now, setNow] = useState(0);
  useInterval(
    () => setNow(performance.now()),
    state.status === "typing" ? 200 : null,
  );
  const elapsedMs = session.getElapsedMs(now);

  return (
    <section className="flex flex-col gap-4" aria-label="훅 데모">
      <h2 className="text-lg font-semibold">useTypingSession 데모</h2>
      <TypingBoard
        lines={DEMO_LINES}
        currentIndex={state.lineIndex}
        currentStates={session.currentJudgement.states}
        inputValue={state.buffer}
        mismatch={session.mismatch}
      />
      <div className="flex gap-2">
        <Input
          {...inputProps}
          aria-label="세션 입력(데모)"
          disabled={state.status === "finished"}
          className="h-11 font-mono text-lg"
        />
        <Button type="button" variant="outline" onClick={session.reset}>
          처음부터
        </Button>
      </div>
      <dl
        data-testid="session-state"
        className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm sm:grid-cols-4"
      >
        <dt>status</dt>
        <dd data-testid="s-status">{state.status}</dd>
        <dt>lineIndex</dt>
        <dd data-testid="s-line">{state.lineIndex}</dd>
        <dt>buffer</dt>
        <dd data-testid="s-buffer">{state.buffer}</dd>
        <dt>isComposing</dt>
        <dd data-testid="s-composing">{String(session.isComposing)}</dd>
        <dt>pendingEnter</dt>
        <dd data-testid="s-pending">{String(session.pendingEnter)}</dd>
        <dt>typed / mistakes</dt>
        <dd data-testid="s-acc">
          {state.acc.typed} / {state.acc.mistakes}
        </dd>
        <dt>rejectSeq</dt>
        <dd data-testid="s-reject">{state.rejectSeq}</dd>
        <dt>committed</dt>
        <dd data-testid="s-committed">{state.committedPerLine.length}</dd>
        <dt>경과(ms)</dt>
        <dd data-testid="s-elapsed">{Math.round(elapsedMs)}</dd>
      </dl>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useTypingSession } from "@/hooks/use-typing-session";
import { toCodePoints } from "@/lib/typing/normalize";
import { computeMetrics } from "@/lib/typing/metrics";
import type { Passage } from "@/types/passage";
import type { TypingResult } from "@/types/typing";

import { ResultView } from "./result-view";
import { TypingBoard } from "./typing-board";
import { TypingStats } from "./typing-stats";

/** 줄 글자 수(코드 포인트 기준, PRD 7.1). */
function countChars(text: string): number {
  return toCodePoints(text).length;
}

export function TypingScreen({
  passage,
  nextHref,
  hasNext,
  listHref,
}: {
  passage: Passage;
  /** 다음 예문(없으면 목록) 이동 경로. 결과 화면 버튼에 쓴다. */
  nextHref: string;
  /** 다음 예문이 있는지 여부. false면 결과 화면에서 [다음 예문]을 숨긴다. */
  hasNext: boolean;
  /** 예문 목록 복귀 경로(필터 유지). 결과 화면 버튼에 쓴다. */
  listHref: string;
}) {
  const session = useTypingSession(passage.lines);
  const { state, focusInput } = session;
  const focusAfterResetRef = useRef(false);

  // [다시 도전] 뒤 보드가 다시 마운트되면 입력창에 포커스를 돌려 준다.
  useEffect(() => {
    if (state.status === "idle" && focusAfterResetRef.current) {
      focusAfterResetRef.current = false;
      focusInput();
    }
  }, [state.status, focusInput]);

  const lines = passage.lines;
  const totalChars = lines.reduce((sum, line) => sum + countChars(line.text), 0);

  if (state.status === "finished") {
    const elapsedMs = session.getElapsedMs(state.finishedAt ?? 0);
    const metrics = computeMetrics({
      totalChars,
      typed: state.acc.typed,
      mistakes: state.acc.mistakes,
      elapsedMs,
    });
    const result: TypingResult = {
      passageId: passage.id,
      accuracy: Math.round(metrics.accuracy * 10) / 10,
      elapsedMs,
      cpm: Math.round(metrics.cpm),
      wpm: Math.round(metrics.wpm * 10) / 10,
      mistakes: state.acc.mistakes,
      lineCount: lines.length,
    };
    return (
      <ResultView
        result={result}
        nextHref={nextHref}
        hasNext={hasNext}
        listHref={listHref}
        focusHeading
        onRetry={() => {
          focusAfterResetRef.current = true;
          session.reset();
        }}
      />
    );
  }

  const currentText = lines[state.lineIndex]?.text ?? "";
  const currentLength = countChars(currentText);
  const bufferChars = toCodePoints(state.buffer);
  const extraText = bufferChars.slice(currentLength).join("");
  // 타수 계산용: 완료한 줄 + 현재 줄에 입력한 글자(줄 길이까지)
  const doneChars =
    lines.slice(0, state.lineIndex).reduce((sum, l) => sum + countChars(l.text), 0) +
    Math.min(bufferChars.length, currentLength);

  return (
    <div className="flex flex-col gap-6">
      <TypingStats
        status={state.status}
        getElapsedMs={session.getElapsedMs}
        currentLine={state.lineIndex + 1}
        totalLines={lines.length}
        doneChars={doneChars}
        typed={state.acc.typed}
        mistakes={state.acc.mistakes}
      />
      <TypingBoard
        lines={lines}
        currentIndex={state.lineIndex}
        currentStates={session.currentJudgement.states}
        extraText={extraText}
        mismatch={session.mismatch}
        shakeKey={session.shakeKey}
        inputProps={session.inputProps}
        onBoardClick={focusInput}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            session.reset();
            focusInput();
          }}
        >
          처음부터
        </Button>
        <Button asChild variant="ghost">
          <Link href={listHref}>목록으로</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Esc 키로도 처음부터 다시 시작할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

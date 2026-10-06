"use client";

import { useState } from "react";
import { useInterval } from "usehooks-ts";

import { StatItem } from "@/components/common/stat-item";
import { Progress } from "@/components/ui/progress";
import { computeMetrics } from "@/lib/typing/metrics";
import type { TypingStatus } from "@/types/typing";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 타이핑 중 실시간 지표. 현재 줄 번호는 1부터 센다.
 * 1초 틱(`now`)은 이 컴포넌트 안에서만 갱신하므로 보드는 다시 렌더되지 않는다.
 * 타수·정확도는 PRD 7.6의 식을 지금까지의 값(`typedChars` 기준)으로 계산한다.
 */
export function TypingStats({
  status,
  getElapsedMs,
  currentLine,
  totalLines,
  doneChars,
  typed,
  mistakes,
}: {
  status: TypingStatus;
  /** useTypingSession의 getElapsedMs. 시작 전이면 0, 종료 후에는 종료 시각 기준. */
  getElapsedMs: (now?: number) => number;
  currentLine: number;
  totalLines: number;
  /** 지금까지 친 줄 글자 수(완료한 줄 + 현재 줄 입력분). 타수 계산에 쓴다. */
  doneChars: number;
  typed: number;
  mistakes: number;
}) {
  // 렌더 중에는 performance.now()를 읽지 않고 틱으로만 시각을 받는다.
  const [now, setNow] = useState(0);
  useInterval(
    () => setNow(performance.now()),
    status === "typing" ? 1000 : null,
  );

  const elapsedMs = getElapsedMs(now);
  const { cpm, accuracy } = computeMetrics({
    totalChars: doneChars,
    typed,
    mistakes,
    elapsedMs,
  });
  const finished = status === "finished";
  const completedLines = finished ? totalLines : currentLine - 1;
  const displayLine = Math.min(currentLine, totalLines);
  const progress = totalLines > 0 ? (completedLines / totalLines) * 100 : 0;
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatItem label="경과 시간" value={formatElapsed(elapsedMs)} />
        <StatItem label="진행" value={`${displayLine} / ${totalLines}`} unit="줄" />
        <StatItem label="타수" value={Math.round(cpm)} unit="타/분" />
        <StatItem label="정확도" value={Math.round(accuracy * 10) / 10} unit="%" />
      </dl>
      {/* shadcn Progress는 value를 Radix Root에 넘기지 않아 aria-valuenow가 빠지므로 직접 지정한다. */}
      <Progress
        value={progress}
        aria-valuenow={Math.round(progress)}
        aria-valuetext={`${completedLines} / ${totalLines}줄 완료`}
        aria-label="진행도"
        data-testid="typing-progress"
      />
    </div>
  );
}

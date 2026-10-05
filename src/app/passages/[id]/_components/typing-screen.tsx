import type { Passage } from "@/types/passage";

import { buildPreviewStates, PREVIEW_INPUT_VALUE } from "./dummy-states";
import { TypingBoard } from "./typing-board";
import { TypingStats } from "./typing-stats";

// Phase 2 전용: 현재 줄(5절)과 지표를 고정한 정적 화면. Task 014에서 useTypingSession으로 대체한다.
const PREVIEW_CURRENT_INDEX = 4;

export function TypingScreen({
  passage,
  mismatch = false,
}: {
  passage: Passage;
  mismatch?: boolean;
  /** 다음 예문(없으면 목록) 이동 경로. Task 014에서 결과 화면 버튼에 사용한다. */
  nextHref?: string;
  /** 예문 목록 복귀 경로(필터 유지). Task 014에서 사용한다. */
  listHref?: string;
}) {
  const currentIndex = Math.min(PREVIEW_CURRENT_INDEX, passage.lines.length - 1);
  const currentLine = passage.lines[currentIndex];
  return (
    <div className="flex flex-col gap-6">
      <TypingStats
        elapsedMs={83_000}
        currentLine={currentIndex + 1}
        totalLines={passage.lines.length}
        cpm={312}
        accuracy={96.4}
      />
      <TypingBoard
        lines={passage.lines}
        currentIndex={currentIndex}
        currentStates={buildPreviewStates(Array.from(currentLine.text).length)}
        inputValue={PREVIEW_INPUT_VALUE}
        mismatch={mismatch}
      />
    </div>
  );
}

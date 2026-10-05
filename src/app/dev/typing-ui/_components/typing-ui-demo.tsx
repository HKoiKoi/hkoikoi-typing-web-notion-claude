"use client";

import { useState } from "react";

import { PassageErrorState } from "@/components/common/passage-error-state";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getMockPassages } from "@/lib/mock/passages";
import type { TypingResult } from "@/types/typing";

import {
  buildExtraPreviewStates,
  buildPreviewStates,
  PREVIEW_INPUT_VALUE,
} from "@/app/passages/[id]/_components/dummy-states";
import { LineChars } from "@/app/passages/[id]/_components/line-chars";
import { ResultView } from "@/app/passages/[id]/_components/result-view";
import { TypingBoard } from "@/app/passages/[id]/_components/typing-board";
import { TypingStats } from "@/app/passages/[id]/_components/typing-stats";

const VIEWS = [
  { value: "typing", label: "타이핑" },
  { value: "mismatch", label: "불일치" },
  { value: "extra", label: "초과 입력" },
  { value: "result", label: "결과" },
  { value: "notFound", label: "없는 예문" },
  { value: "empty", label: "줄 없음" },
  { value: "config", label: "설정 오류" },
  { value: "transient", label: "일시 오류" },
] as const;

type View = (typeof VIEWS)[number]["value"];

const DUMMY_RESULT: TypingResult = {
  passageId: "mock-genesis-1",
  accuracy: 96.4,
  elapsedMs: 412_000,
  cpm: 312,
  wpm: 62.4,
  mistakes: 14,
  lineCount: 31,
};

// 정적 미리보기: 현재 줄(5절)과 지표를 고정한다. 실제 화면은 TypingScreen이 useTypingSession으로 구성한다.
const PREVIEW_CURRENT_INDEX = 4;

const EXTRA_SAMPLE = "태초에 하나님이";

export function TypingUiDemo() {
  const [view, setView] = useState<View>("typing");
  const passage = getMockPassages()[0];

  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && setView(v as View)}
        variant="outline"
        className="flex-wrap"
        aria-label="화면 상태 전환"
      >
        {VIEWS.map(({ value, label }) => (
          <ToggleGroupItem key={value} value={value}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {(view === "typing" || view === "mismatch") && (
        <div className="flex flex-col gap-6">
          <TypingStats
            status="idle"
            getElapsedMs={() => 83_000}
            currentLine={PREVIEW_CURRENT_INDEX + 1}
            totalLines={passage.lines.length}
            doneChars={432}
            typed={1000}
            mistakes={36}
          />
          <TypingBoard
            lines={passage.lines}
            currentIndex={PREVIEW_CURRENT_INDEX}
            currentStates={buildPreviewStates(
              Array.from(passage.lines[PREVIEW_CURRENT_INDEX].text).length,
            )}
            inputValue={PREVIEW_INPUT_VALUE}
            mismatch={view === "mismatch"}
          />
        </div>
      )}
      {view === "extra" && (
        <p
          data-testid="extra-sample"
          className="rounded-lg border p-4 font-mono text-xl"
        >
          <LineChars
            text={EXTRA_SAMPLE}
            states={buildExtraPreviewStates(Array.from(EXTRA_SAMPLE).length, 2)}
            extraText="ㅁㅁ"
          />
        </p>
      )}
      {view === "result" && (
        <ResultView result={DUMMY_RESULT} nextHref="/" listHref="/" />
      )}
      {view === "notFound" && <PassageErrorState kind="notFound" />}
      {view === "empty" && (
        <PassageErrorState
          kind="empty"
          description="노션 Lines DB에 이 예문의 줄을 추가하세요"
        />
      )}
      {view === "config" && <PassageErrorState kind="config" />}
      {view === "transient" && (
        <PassageErrorState
          kind="transient"
          action={<Button variant="outline">다시 시도</Button>}
        />
      )}
    </div>
  );
}

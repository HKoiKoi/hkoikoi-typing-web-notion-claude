import { Check, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Line } from "@/types/passage";
import type { CharState } from "@/types/typing";

import { LineChars } from "./line-chars";

function LineLabel({ label }: { label?: string }) {
  return (
    <span className="flex w-12 shrink-0 justify-end pt-1">
      {label && (
        <Badge variant="outline" className="text-[10px]">
          {label}
        </Badge>
      )}
    </span>
  );
}

// 완료/남은 줄은 props가 바뀌지 않는 정적 컴포넌트라 현재 줄 변경 시 재렌더되지 않는다.
function CompletedLine({ line }: { line: Line }) {
  const states = Array.from(line.text, (): CharState => "correct");
  return (
    <li data-line-state="completed" className="flex gap-3 opacity-60">
      <LineLabel label={line.label} />
      {/* 색 없이도 완료 줄을 구분하는 보조 표시 */}
      <Check className="mt-1.5 size-4 shrink-0" aria-hidden />
      <LineChars text={line.text} states={states} className="flex-1" />
    </li>
  );
}

function PendingLine({ line }: { line: Line }) {
  const states = Array.from(line.text, (): CharState => "pending");
  return (
    <li data-line-state="pending" className="flex gap-3">
      <LineLabel label={line.label} />
      <LineChars text={line.text} states={states} className="flex-1" />
    </li>
  );
}

/**
 * 완료 줄 / 현재 줄 / 남은 줄을 분리해 렌더한다.
 * 현재 줄 바로 아래에 입력 줄을 둔다. 정적 단계에서는 입력창이 읽기 전용이다.
 */
export function TypingBoard({
  lines,
  currentIndex,
  currentStates,
  inputValue,
  extraText,
  mismatch = false,
}: {
  lines: Line[];
  currentIndex: number;
  currentStates: CharState[];
  inputValue: string;
  extraText?: string;
  /** Enter 시 줄이 일치하지 않을 때 강조한다. */
  mismatch?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p aria-live="polite" className="sr-only">
        {currentIndex > 0 ? `${currentIndex}번째 줄 완료` : ""}
      </p>
      <ol className="flex flex-col gap-3 font-mono text-lg leading-relaxed">
        {lines.map((line, index) => {
          if (index < currentIndex) return <CompletedLine key={index} line={line} />;
          if (index > currentIndex) return <PendingLine key={index} line={line} />;
          return (
            <li
              key={index}
              aria-current="true"
              data-line-state="current"
              className="flex flex-col gap-2 rounded-lg border-2 border-typing-current bg-muted/40 p-3"
            >
              <div className="flex gap-3">
                <LineLabel label={line.label} />
                <LineChars
                  text={line.text}
                  states={currentStates}
                  extraText={extraText}
                  className="flex-1 text-xl"
                />
              </div>
              <div className="flex flex-col gap-1 pl-15">
                <Input
                  readOnly
                  value={inputValue}
                  aria-label="타이핑 입력"
                  aria-invalid={mismatch}
                  className={cn(
                    "h-11 font-mono text-lg",
                    mismatch && "border-4 border-destructive",
                  )}
                />
                {mismatch && (
                  <p
                    role="alert"
                    className="flex items-center gap-1 text-sm font-semibold text-destructive"
                  >
                    <CircleAlert className="size-4" aria-hidden />
                    줄이 일치하지 않습니다
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

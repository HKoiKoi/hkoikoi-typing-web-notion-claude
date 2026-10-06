"use client";

import { Check, CircleAlert } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { UseTypingSessionResult } from "@/hooks/use-typing-session";
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
// 완료 줄을 opacity로 흐리게 하면 correct 글자 대비가 4.5:1 아래로 떨어지므로(라이트 2.64, 다크 3.96) 쓰지 않는다.
function CompletedLine({ line }: { line: Line }) {
  const states = Array.from(line.text, (): CharState => "correct");
  return (
    <li data-line-state="completed" className="flex gap-3">
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

// 완료/남은 줄 묶음은 props가 `lines`(안정된 참조)와 숫자뿐이다. 입력할 때마다 바뀌는 값(currentStates,
// inputProps 등)을 받지 않으므로 React Compiler가 요소를 캐시해 글자 입력 중에는 다시 렌더되지 않는다.
function CompletedLines({ lines, count }: { lines: Line[]; count: number }) {
  return lines
    .slice(0, count)
    .map((line, index) => <CompletedLine key={index} line={line} />);
}

function PendingLines({ lines, from }: { lines: Line[]; from: number }) {
  return lines
    .slice(from)
    .map((line, offset) => <PendingLine key={from + offset} line={line} />);
}

/**
 * 완료 줄 / 현재 줄 / 남은 줄을 분리해 렌더한다.
 * 현재 줄 바로 아래에 입력 줄을 두고, 입력창은 현재 줄 텍스트를 aria-describedby로 참조한다.
 * 줄이 바뀌면 현재 줄을 화면 세로 중앙 부근으로 스크롤한다(첫 렌더 제외).
 */
export function TypingBoard({
  lines,
  currentIndex,
  currentStates,
  extraText,
  mismatch = false,
  inputProps,
  shakeKey,
  onBoardClick,
}: {
  lines: Line[];
  currentIndex: number;
  currentStates: CharState[];
  extraText?: string;
  /** Enter 시 줄이 일치하지 않을 때 강조한다. */
  mismatch?: boolean;
  /** useTypingSession의 inputProps. */
  inputProps: UseTypingSessionResult["inputProps"];
  /** 불일치 Enter마다 바뀌는 값. 바뀔 때마다 입력 줄 흔들림을 재생한다. */
  shakeKey?: number;
  /** 보드 영역 클릭 시 호출(입력창 재포커스용). */
  onBoardClick?: () => void;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const currentLine: Line | undefined = lines[currentIndex];
  const currentRef = useRef<HTMLLIElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(currentIndex);

  function alignCurrentLine() {
    currentRef.current?.scrollIntoView({
      block: "center",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  // 줄이 바뀐 경우에만 정렬한다. 첫 렌더에서는 페이지 상단을 유지한다.
  useEffect(() => {
    if (prevIndexRef.current === currentIndex) return;
    prevIndexRef.current = currentIndex;
    // 현재 줄이 바뀌면 입력창이 다른 li로 다시 마운트되어 포커스를 잃으므로 되돌려 준다.
    if (document.activeElement === document.body) {
      currentRef.current?.querySelector("input")?.focus({ preventScroll: true });
    }
    currentRef.current?.scrollIntoView({
      block: "center",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [currentIndex, reducedMotion]);

  // 불일치 Enter마다 입력 줄을 짧게 흔든다. key로 다시 마운트하면 입력창이 포커스를 잃으므로 Web Animations API를 쓴다.
  useEffect(() => {
    if (!shakeKey || reducedMotion) return;
    inputWrapRef.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 300, easing: "ease-in-out" },
    );
  }, [shakeKey, reducedMotion]);

  return (
    <div className="flex flex-col gap-3" onClick={onBoardClick}>
      <p aria-live="polite" className="sr-only">
        {currentIndex > 0 ? `${currentIndex}번째 줄 완료` : ""}
      </p>
      <ol className="flex flex-col gap-3 font-mono text-lg leading-relaxed">
        <CompletedLines lines={lines} count={currentIndex} />
        {currentLine && (
          <li
            key={currentIndex}
            ref={currentRef}
            aria-current="true"
            data-line-state="current"
            // scroll-mt-16: 중앙 정렬 시 sticky 헤더(약 57px) 아래로 줄 상단이 가려지지 않게 한다.
            className="flex flex-col gap-2 scroll-mt-16 rounded-lg border-2 border-typing-current bg-muted/40 p-3"
          >
            <div id="current-line-text" className="flex gap-3">
              <LineLabel label={currentLine.label} />
              <LineChars
                text={currentLine.text}
                states={currentStates}
                extraText={extraText}
                className="flex-1 text-xl"
              />
            </div>
            <div ref={inputWrapRef} className="flex flex-col gap-1 pl-15">
              <Input
                {...inputProps}
                aria-describedby="current-line-text"
                onFocus={() => requestAnimationFrame(alignCurrentLine)}
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
        )}
        <PendingLines lines={lines} from={currentIndex + 1} />
      </ol>
    </div>
  );
}

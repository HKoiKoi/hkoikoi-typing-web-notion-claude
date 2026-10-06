"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { StatItem } from "@/components/common/stat-item";
import { Button } from "@/components/ui/button";
import type { TypingResult } from "@/types/typing";

function formatDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

/** 연습 결과 요약. 새로고침하면 유지되지 않는다(D6). */
export function ResultView({
  result,
  nextHref,
  hasNext = true,
  listHref,
  onRetry,
  focusHeading = false,
}: {
  result: TypingResult;
  nextHref: string;
  /** false면 다음 예문이 없으므로 [다음 예문] 버튼을 숨긴다(목록으로 버튼과 중복 방지). */
  hasNext?: boolean;
  listHref: string;
  /** [다시 도전] 클릭 시 호출. 입력·타이머·줄 위치 초기화는 호출측이 한다. */
  onRetry?: () => void;
  /**
   * true면 마운트 시 결과 헤딩으로 포커스를 옮긴다. 입력창이 사라지며 포커스가 body로 가는 것을 막고
   * 스크린리더가 결과 화면 전환을 읽게 한다(새로 삽입된 aria-live 노드는 읽히지 않는다).
   */
  focusHeading?: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusHeading) headingRef.current?.focus();
  }, [focusHeading]);

  return (
    <section
      aria-labelledby="result-heading"
      className="flex flex-col gap-6 rounded-lg border p-6"
    >
      <h2
        ref={headingRef}
        id="result-heading"
        tabIndex={-1}
        className="text-xl font-semibold outline-none"
      >
        연습 결과
      </h2>
      <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <StatItem label="평균 타수" value={result.cpm} unit="타/분" />
        <StatItem label="정확도" value={result.accuracy} unit="%" />
        <StatItem label="연습 시간" value={formatDuration(result.elapsedMs)} />
        <StatItem label="WPM" value={result.wpm} />
        <StatItem label="오타 수" value={result.mistakes} unit="개" />
        <StatItem label="총 줄 수" value={result.lineCount} unit="줄" />
      </dl>
      <div className="flex flex-wrap gap-2">
        {hasNext && (
          <Button asChild>
            <Link href={nextHref}>다음 예문</Link>
          </Button>
        )}
        <Button variant="outline" onClick={onRetry}>
          다시 도전
        </Button>
        <Button asChild variant="ghost">
          <Link href={listHref}>목록으로</Link>
        </Button>
      </div>
    </section>
  );
}

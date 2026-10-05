import { cn } from "@/lib/utils";
import type { CharState } from "@/types/typing";

// 색에만 의존하지 않도록 상태마다 밑줄/취소선/배경/굵기 보조 표시를 함께 둔다.
// CharState가 추가되면 컴파일 에러로 누락을 알려 준다.
const STATE_CLASS: Record<CharState, string> = {
  correct: "text-typing-correct",
  incorrect: "text-typing-incorrect underline line-through decoration-2",
  incorrectSpace: "bg-typing-incorrect-space-bg text-foreground",
  pending: "text-typing-pending",
  current: "border-b-2 border-typing-current font-bold text-typing-current",
  composing: "text-typing-composing underline decoration-dotted",
  extra: "text-typing-extra underline decoration-wavy",
};

/**
 * 한 줄을 글자별 span으로 렌더한다 (코드 포인트 단위).
 * `states`는 줄 글자 수 + 초과 입력(`extra`) 수만큼의 길이를 가진다.
 * 초과 입력 글자는 줄 텍스트에 없으므로 `extraText`로 받는다.
 */
export function LineChars({
  text,
  states,
  extraText = "",
  className,
}: {
  text: string;
  states: CharState[];
  extraText?: string;
  className?: string;
}) {
  const chars = [...Array.from(text), ...Array.from(extraText)];
  return (
    <span
      className={cn("break-words whitespace-pre-wrap", className)}
      data-slot="line-chars"
    >
      {chars.map((char, i) => (
        <span key={i} data-state={states[i]} className={STATE_CLASS[states[i]]}>
          {char}
        </span>
      ))}
    </span>
  );
}

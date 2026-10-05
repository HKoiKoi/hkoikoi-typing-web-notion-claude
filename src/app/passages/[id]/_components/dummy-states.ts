// Phase 2 전용: 하드코딩된 판정 상태 미리보기. Task 014에서 useTypingSession 결과로 대체한다.
import type { CharState } from "@/types/typing";

/** 줄 앞부분을 7종 중 6종(초과 제외)으로 채우고 나머지는 대기로 둔다. 5절("하나님이 빛을 …")에 맞춘 패턴. */
export function buildPreviewStates(length: number): CharState[] {
  const head: CharState[] = [
    "correct",
    "correct",
    "incorrect",
    "correct",
    "incorrectSpace",
    "correct",
    "composing",
    "current",
  ];
  return Array.from({ length }, (_, i) => head[i] ?? "pending");
}

/** 미리보기 현재 줄의 입력 값 (줄 앞 7글자에 대응). */
export const PREVIEW_INPUT_VALUE = "하나다이  빛으";

/** 초과 입력 미리보기: 줄을 모두 맞게 입력한 뒤 글자를 더 입력한 경우. */
export function buildExtraPreviewStates(length: number, extraCount: number): CharState[] {
  return [
    ...Array.from({ length }, (): CharState => "correct"),
    ...Array.from({ length: extraCount }, (): CharState => "extra"),
  ];
}

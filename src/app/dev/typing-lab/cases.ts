// 임시 개발용 검증 케이스: 판정·정규화·지표 순수 함수 기대값 표. Task 018에서 제거한다.
// 기대값(expected)은 구현 결과가 아니라 docs/ROADMAP.md Task 010 체크리스트와 PRD 7장에서 직접 썼다.

import { judgeLine } from "@/lib/typing/judge";
import { accumulateStats, computeMetrics } from "@/lib/typing/metrics";
import { normalizeLine, toCodePoints } from "@/lib/typing/normalize";
import { truncateToLine } from "@/lib/typing/truncate";

export type LabCase = {
  group: string;
  name: string;
  actual: unknown;
  expected: unknown;
};

export type LabResult = LabCase & {
  pass: boolean;
  actualText: string;
  expectedText: string;
};

const NFD_HAN = "한"; // "한"의 NFD(자모 분해) 표기
const COMBINING_E = "é"; // e + 결합 acute -> NFC로 é 1글자

const noCompose = { composing: false };
const compose = { composing: true };

function stats(typed: number, mistakes: number) {
  return { typed, mistakes };
}

const emptyStats = stats(0, 0);

export const labCases: LabCase[] = [
  // 정규화
  {
    group: "정규화",
    name: "탭·연속 공백·양끝 공백 처리",
    actual: normalizeLine("\t가  나 "),
    expected: "가 나",
  },
  {
    group: "정규화",
    name: "맨 앞 괄호는 본문으로 유지",
    actual: normalizeLine("(1절) 동해물과"),
    expected: "(1절) 동해물과",
  },
  {
    group: "정규화",
    name: "공백뿐이면 빈 문자열",
    actual: normalizeLine(" \t  "),
    expected: "",
  },
  {
    group: "정규화",
    name: "NFD 입력은 NFC로 정규화",
    actual: normalizeLine(NFD_HAN) === "한",
    expected: true,
  },
  {
    group: "정규화",
    name: "코드 포인트: 한글 음절 1글자 = 1단위",
    actual: toCodePoints("가나다").length,
    expected: 3,
  },
  {
    group: "정규화",
    name: "코드 포인트: 이모지는 1단위",
    actual: toCodePoints("a😀b").length,
    expected: 3,
  },
  {
    group: "정규화",
    name: "코드 포인트: 결합 문자는 NFC 후 1단위",
    actual: toCodePoints(COMBINING_E).length,
    expected: 1,
  },
  {
    group: "정규화",
    name: "코드 포인트: 빈 문자열은 빈 배열",
    actual: toCodePoints(""),
    expected: [],
  },

  // 판정
  {
    group: "판정",
    name: "target 닭, input 닭(확정) -> correct, matches true",
    actual: judgeLine("닭", "닭", noCompose),
    expected: { states: ["correct"], matches: true },
  },
  {
    group: "판정",
    name: "target 읽, 조합 중 input 일 -> composing(incorrect 아님)",
    actual: judgeLine("읽", "일", compose),
    expected: { states: ["composing"], matches: false },
  },
  {
    group: "판정",
    name: "target 왜, 조합 중 input ㅇ -> composing",
    actual: judgeLine("왜", "ㅇ", compose),
    expected: { states: ["composing"], matches: false },
  },
  {
    group: "판정",
    name: "target 왜, 조합 중 input 와 -> composing",
    actual: judgeLine("왜", "와", compose),
    expected: { states: ["composing"], matches: false },
  },
  {
    group: "판정",
    name: "target 의, 조합 중 input 으 -> composing",
    actual: judgeLine("의", "으", compose),
    expected: { states: ["composing"], matches: false },
  },
  {
    group: "판정",
    name: "target 닭이, 확정 닭 + 조합 중 ㅇ -> correct, composing",
    actual: judgeLine("닭이", "닭ㅇ", compose),
    expected: { states: ["correct", "composing"], matches: false },
  },
  {
    group: "판정",
    name: "조합 중 마지막 글자 이전 구간은 즉시 판정(틀리면 incorrect)",
    actual: judgeLine("가나", "다ㄴ", compose),
    expected: { states: ["incorrect", "composing"], matches: false },
  },
  {
    group: "판정",
    name: "target abc, input abd -> 3번째 incorrect",
    actual: judgeLine("abc", "abd", noCompose),
    expected: {
      states: ["correct", "correct", "incorrect"],
      matches: false,
    },
  },
  {
    group: "판정",
    name: "target a b, input a(공백)(공백) -> 틀린 공백 incorrectSpace",
    actual: judgeLine("a b", "a  ", noCompose),
    expected: {
      states: ["correct", "correct", "incorrectSpace"],
      matches: false,
    },
  },
  {
    group: "판정",
    name: "target 공백 자리에 다른 글자 -> incorrectSpace",
    actual: judgeLine("a b", "axb", noCompose),
    expected: {
      states: ["correct", "incorrectSpace", "correct"],
      matches: false,
    },
  },
  {
    group: "판정",
    name: "대소문자 A vs a -> incorrect",
    actual: judgeLine("A", "a", noCompose),
    expected: { states: ["incorrect"], matches: false },
  },
  {
    group: "판정",
    name: "스마트 따옴표 ’ vs ' -> incorrect",
    actual: judgeLine("’", "'", noCompose),
    expected: { states: ["incorrect"], matches: false },
  },
  {
    group: "판정",
    name: "빈 입력 -> 첫 글자 current, 나머지 pending",
    actual: judgeLine("abc", "", noCompose),
    expected: { states: ["current", "pending", "pending"], matches: false },
  },
  {
    group: "판정",
    name: "입력 중간 -> 다음 글자 current, 나머지 pending",
    actual: judgeLine("abc", "a", noCompose),
    expected: { states: ["correct", "current", "pending"], matches: false },
  },
  {
    group: "판정",
    name: "target보다 긴 입력 -> 초과분 extra",
    actual: judgeLine("ab", "abcd", noCompose),
    expected: {
      states: ["correct", "correct", "extra", "extra"],
      matches: false,
    },
  },
  {
    group: "판정",
    name: "조합 중 초과 입력은 composing이 아니라 extra",
    actual: judgeLine("가", "가나", compose),
    expected: { states: ["correct", "extra"], matches: false },
  },
  {
    group: "판정",
    name: "NFD로 입력된 한글이 NFC와 동일 판정",
    actual: judgeLine("한", NFD_HAN, noCompose),
    expected: { states: ["correct"], matches: true },
  },
  {
    group: "판정",
    name: "이모지는 코드 포인트 1글자로 판정",
    actual: judgeLine("a😀", "a", noCompose),
    expected: { states: ["correct", "current"], matches: false },
  },
  {
    group: "판정",
    name: "조합 중에는 문자열이 같아도 matches false",
    actual: judgeLine("가", "가", compose),
    expected: { states: ["composing"], matches: false },
  },

  // 자르기
  {
    group: "자르기",
    name: "초과 입력을 target 길이로 자른다",
    actual: truncateToLine("abcd", "ab"),
    expected: "ab",
  },
  {
    group: "자르기",
    name: "자른 결과의 코드 포인트 길이 = target 길이",
    actual: toCodePoints(truncateToLine("가나다라", "가나")).length,
    expected: 2,
  },
  {
    group: "자르기",
    name: "짧은 입력은 그대로 반환",
    actual: truncateToLine("a", "abc"),
    expected: "a",
  },
  {
    group: "자르기",
    name: "이모지를 쪼개지 않는다",
    actual: truncateToLine("😀😀😀", "ab"),
    expected: "😀😀",
  },

  // 집계
  {
    group: "집계",
    name: "가나 확정(target 가다) -> 입력 2, 오타 1",
    actual: accumulateStats(emptyStats, "", "가나", "가다"),
    expected: stats(2, 1),
  },
  {
    group: "집계",
    name: "백스페이스(가나 -> 가) -> 불변",
    actual: accumulateStats(stats(2, 1), "가나", "가", "가다"),
    expected: stats(2, 1),
  },
  {
    group: "집계",
    name: "재입력(가 -> 가다) -> 입력 3, 오타 1",
    actual: accumulateStats(stats(2, 1), "가", "가다", "가다"),
    expected: stats(3, 1),
  },
  {
    group: "집계",
    name: "같은 확정 문자열 재전달 -> 불변",
    actual: accumulateStats(stats(3, 1), "가다", "가다", "가다"),
    expected: stats(3, 1),
  },
  {
    group: "집계",
    name: "한 번에 3글자 확정(오타 1) -> 입력 3, 오타 1",
    actual: accumulateStats(emptyStats, "", "가나라", "가나다"),
    expected: stats(3, 1),
  },
  {
    group: "집계",
    name: "단어 끝 공백 포함 확정(읽 ) -> 입력 2, 오타 0",
    actual: accumulateStats(emptyStats, "", "읽 ", "읽 다"),
    expected: stats(2, 0),
  },
  {
    group: "집계",
    name: "target 범위를 넘는 글자는 오타",
    actual: accumulateStats(emptyStats, "", "abc", "ab"),
    expected: stats(3, 1),
  },
  {
    group: "집계",
    name: "prev 객체를 변경하지 않는다",
    actual: (() => {
      const prev = stats(1, 0);
      accumulateStats(prev, "a", "ab", "ab");
      return prev;
    })(),
    expected: stats(1, 0),
  },

  // 지표
  {
    group: "지표",
    name: "300자 60000ms -> CPM 300, WPM 60",
    actual: computeMetrics({
      totalChars: 300,
      typed: 300,
      mistakes: 0,
      elapsedMs: 60000,
    }),
    expected: { accuracy: 100, cpm: 300, wpm: 60 },
  },
  {
    group: "지표",
    name: "typed 100, mistakes 5 -> 정확도 95",
    actual: computeMetrics({
      totalChars: 100,
      typed: 100,
      mistakes: 5,
      elapsedMs: 60000,
    }).accuracy,
    expected: 95,
  },
  {
    group: "지표",
    name: "150자 30000ms -> CPM 300, WPM 60",
    actual: computeMetrics({
      totalChars: 150,
      typed: 150,
      mistakes: 0,
      elapsedMs: 30000,
    }),
    expected: { accuracy: 100, cpm: 300, wpm: 60 },
  },
  {
    group: "지표",
    name: "elapsedMs 0 -> CPM/WPM 0 (NaN/Infinity 아님)",
    actual: computeMetrics({
      totalChars: 100,
      typed: 10,
      mistakes: 0,
      elapsedMs: 0,
    }),
    expected: { accuracy: 100, cpm: 0, wpm: 0 },
  },
  {
    group: "지표",
    name: "elapsedMs 음수 -> CPM/WPM 0",
    actual: computeMetrics({
      totalChars: 100,
      typed: 10,
      mistakes: 0,
      elapsedMs: -5,
    }),
    expected: { accuracy: 100, cpm: 0, wpm: 0 },
  },
  {
    group: "지표",
    name: "typed 0 -> 정확도 기본값 100(0 나눗셈 없음)",
    actual: computeMetrics({
      totalChars: 100,
      typed: 0,
      mistakes: 0,
      elapsedMs: 60000,
    }).accuracy,
    expected: 100,
  },
];

function stringify(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

export function runLabCases(): LabResult[] {
  return labCases.map((c) => {
    const actualText = stringify(c.actual);
    const expectedText = stringify(c.expected);
    return { ...c, actualText, expectedText, pass: actualText === expectedText };
  });
}

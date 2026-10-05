// Phase 2 전용 더미 데이터. Task 011에서 제거한다 (노션 연동으로 대체).
// 모든 텍스트는 퍼블릭 도메인(저작권 만료) 자료다.
// - 창세기 1장은 개역한글판 본문이다. 배포 전 저작권 상태를 한 번 더 확인할 것.
// - difficulty 미지정(우리말 속담, Alice)과 tags 빈 배열(우리말 속담, Typing Warm-up) 엣지 케이스를 포함한다.

import type { Passage, PassageSummary } from "@/types/passage";

const mockPassages: Passage[] = [
  {
    id: "mock-genesis-1",
    title: "창세기 1장",
    language: "ko",
    category: "성경",
    order: 1,
    difficulty: "Hard",
    tags: ["성경", "개역한글", "긴 글"],
    lines: [
      { text: "태초에 하나님이 천지를 창조하시니라", label: "1절" },
      {
        text: "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 신은 수면 위에 운행하시니라",
        label: "2절",
      },
      {
        text: "하나님이 가라사대 빛이 있으라 하시매 빛이 있었고",
        label: "3절",
      },
      {
        text: "그 빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사",
        label: "4절",
      },
      {
        text: "하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되며 아침이 되니 이는 첫째 날이니라",
        label: "5절",
      },
      {
        text: "하나님이 가라사대 물 가운데 궁창이 있어 물과 물로 나뉘게 하리라 하시고",
        label: "6절",
      },
      {
        text: "하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시매 그대로 되니라",
        label: "7절",
      },
      {
        text: "하나님이 궁창을 하늘이라 칭하시니라 저녁이 되며 아침이 되니 이는 둘째 날이니라",
        label: "8절",
      },
      {
        text: "하나님이 가라사대 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시매 그대로 되니라",
        label: "9절",
      },
      {
        text: "하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라",
        label: "10절",
      },
      {
        text: "하나님이 가라사대 땅은 풀과 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 과목을 땅에 내라 하시매 그대로 되어",
        label: "11절",
      },
      {
        text: "땅이 풀과 각기 종류대로 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내니 하나님이 보시기에 좋았더라",
        label: "12절",
      },
      { text: "저녁이 되며 아침이 되니 이는 셋째 날이니라", label: "13절" },
      {
        text: "하나님이 가라사대 하늘의 궁창에 광명이 있어 주야를 나뉘게 하라 또 그 광명으로 하여 징조와 사시와 일자와 연한이 이루라",
        label: "14절",
      },
      {
        text: "또 그 광명이 하늘의 궁창에 있어 땅에 비취라 하시고 그대로 되니라",
        label: "15절",
      },
      {
        text: "하나님이 두 큰 광명을 만드사 큰 광명으로 낮을 주관하게 하시고 작은 광명으로 밤을 주관하게 하시고 또 별들을 만드시고",
        label: "16절",
      },
      {
        text: "하나님이 그것들을 하늘의 궁창에 두어 땅을 비취게 하시며",
        label: "17절",
      },
      {
        text: "주야를 주관하게 하시고 빛과 어둠을 나뉘게 하시니 하나님이 보시기에 좋았더라",
        label: "18절",
      },
      { text: "저녁이 되며 아침이 되니 이는 넷째 날이니라", label: "19절" },
      {
        text: "하나님이 가라사대 물들은 생물로 번성케 하라 땅 위 하늘의 궁창에는 새가 날으라 하시고",
        label: "20절",
      },
      {
        text: "하나님이 큰 물고기들과 물에서 번성하여 움직이는 모든 생물을 그 종류대로, 날개 있는 모든 새를 그 종류대로 창조하시니 하나님이 보시기에 좋았더라",
        label: "21절",
      },
      {
        text: "하나님이 그들에게 복을 주어 가라사대 생육하고 번성하여 여러 바닷물에 충만하라 새들도 땅에 번성하라 하시니라",
        label: "22절",
      },
      { text: "저녁이 되며 아침이 되니 이는 다섯째 날이니라", label: "23절" },
      {
        text: "하나님이 가라사대 땅은 생물을 그 종류대로 내되 육축과 기는 것과 땅의 짐승을 종류대로 내라 하시매 그대로 되니라",
        label: "24절",
      },
      {
        text: "하나님이 땅의 짐승을 그 종류대로, 육축을 그 종류대로, 땅에 기는 모든 것을 그 종류대로 만드시니 하나님이 보시기에 좋았더라",
        label: "25절",
      },
      {
        text: "하나님이 가라사대 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그로 바다의 고기와 하늘의 새와 육축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고",
        label: "26절",
      },
      {
        text: "하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고",
        label: "27절",
      },
      {
        text: "하나님이 그들에게 복을 주시며 하나님이 그들에게 이르시되 생육하고 번성하여 땅에 충만하라, 땅을 정복하라, 바다의 고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라",
        label: "28절",
      },
      {
        text: "하나님이 가라사대 내가 온 지면에 있는 씨 맺는 모든 채소와 씨 가진 열매 맺는 모든 나무를 너희에게 주노니 너희의 식물이 되리라",
        label: "29절",
      },
      {
        text: "또 땅의 모든 짐승과 하늘의 모든 새와 생명이 있어 땅에 기는 모든 것에게는 내가 모든 푸른 풀을 식물로 주노라 하시니 그대로 되니라",
        label: "30절",
      },
      {
        text: "하나님이 지으신 그 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되며 아침이 되니 이는 여섯째 날이니라",
        label: "31절",
      },
    ],
  },
  {
    id: "mock-aegukga",
    title: "애국가",
    language: "ko",
    category: "노래",
    order: 1,
    difficulty: "Easy",
    tags: ["애국가", "노래", "가사"],
    lines: [
      { text: "동해물과 백두산이 마르고 닳도록", label: "1절" },
      { text: "하느님이 보우하사 우리나라 만세", label: "1절" },
      { text: "무궁화 삼천리 화려강산", label: "후렴" },
      { text: "대한 사람 대한으로 길이 보전하세", label: "후렴" },
      { text: "남산 위에 저 소나무 철갑을 두른 듯", label: "2절" },
      { text: "바람 서리 불변함은 우리 기상일세", label: "2절" },
      { text: "무궁화 삼천리 화려강산", label: "후렴" },
      { text: "대한 사람 대한으로 길이 보전하세", label: "후렴" },
      { text: "가을 하늘 공활한데 높고 구름 없이", label: "3절" },
      { text: "밝은 달은 우리 가슴 일편단심일세", label: "3절" },
      { text: "무궁화 삼천리 화려강산", label: "후렴" },
      { text: "대한 사람 대한으로 길이 보전하세", label: "후렴" },
      { text: "이 기상과 이 맘으로 충성을 다하여", label: "4절" },
      { text: "괴로우나 즐거우나 나라 사랑하세", label: "4절" },
      { text: "무궁화 삼천리 화려강산", label: "후렴" },
      { text: "대한 사람 대한으로 길이 보전하세", label: "후렴" },
    ],
  },
  {
    id: "mock-seosi",
    title: "서시 - 윤동주",
    language: "ko",
    category: "시",
    order: 1,
    difficulty: "Medium",
    tags: ["시", "윤동주"],
    lines: [
      { text: "죽는 날까지 하늘을 우러러" },
      { text: "한 점 부끄럼이 없기를," },
      { text: "잎새에 이는 바람에도" },
      { text: "나는 괴로워했다." },
      { text: "별을 노래하는 마음으로" },
      { text: "모든 죽어가는 것을 사랑해야지" },
      { text: "그리고 나한테 주어진 길을" },
      { text: "걸어가야겠다." },
      { text: "오늘 밤에도 별이 바람에 스치운다." },
    ],
  },
  {
    id: "mock-proverbs-ko",
    title: "우리말 속담 모음",
    language: "ko",
    category: "속담",
    tags: [],
    lines: [
      { text: "가는 말이 고와야 오는 말이 곱다" },
      { text: "낮말은 새가 듣고 밤말은 쥐가 듣는다" },
      { text: "티끌 모아 태산" },
      { text: "원숭이도 나무에서 떨어진다" },
      { text: "백지장도 맞들면 낫다" },
      { text: "천 리 길도 한 걸음부터" },
    ],
  },
  {
    id: "mock-gettysburg",
    title: "The Gettysburg Address (excerpt)",
    language: "en",
    category: "연설",
    order: 1,
    difficulty: "Hard",
    tags: ["speech", "history", "lincoln"],
    lines: [
      {
        text: "Four score and seven years ago our fathers brought forth on this continent, a new nation,",
      },
      {
        text: "conceived in Liberty, and dedicated to the proposition that all men are created equal.",
      },
      {
        text: "Now we are engaged in a great civil war, testing whether that nation,",
      },
      { text: "or any nation so conceived and so dedicated, can long endure." },
      {
        text: "It is rather for us to be here dedicated to the great task remaining before us,",
      },
      {
        text: "that government of the people, by the people, for the people, shall not perish from the earth.",
      },
    ],
  },
  {
    id: "mock-declaration",
    title: "Declaration of Independence (preamble)",
    language: "en",
    category: "연설",
    order: 2,
    difficulty: "Hard",
    tags: ["history", "document"],
    lines: [
      {
        text: "We hold these truths to be self-evident, that all men are created equal,",
      },
      {
        text: "that they are endowed by their Creator with certain unalienable Rights,",
      },
      {
        text: "that among these are Life, Liberty and the pursuit of Happiness.",
      },
    ],
  },
  {
    id: "mock-tortoise-hare",
    title: "The Tortoise and the Hare",
    language: "en",
    category: "우화",
    order: 1,
    difficulty: "Easy",
    tags: ["fable", "aesop", "short"],
    lines: [
      { text: "A Hare one day made fun of a Tortoise for being so slow." },
      { text: '"Do you ever get anywhere?" he asked with a mocking laugh.' },
      {
        text: '"Yes," replied the Tortoise, "and I get there sooner than you think."',
      },
      { text: "The Hare ran fast, but he stopped to take a nap." },
      { text: "The Tortoise plodded on, and won the race." },
      { text: "Slow and steady wins the race." },
    ],
  },
  {
    id: "mock-franklin",
    title: "Poor Richard's Maxims",
    language: "en",
    category: "속담",
    difficulty: "Easy",
    tags: ["proverb", "franklin"],
    lines: [
      {
        text: "Early to bed and early to rise, makes a man healthy, wealthy, and wise.",
      },
      { text: "A penny saved is a penny earned." },
      { text: "Well done is better than well said." },
      { text: "Lost time is never found again." },
    ],
  },
  {
    id: "mock-sonnet-18",
    title: "Sonnet 18 - William Shakespeare",
    language: "en",
    category: "시",
    order: 2,
    difficulty: "Medium",
    tags: ["poem", "shakespeare", "sonnet"],
    lines: [
      { text: "Shall I compare thee to a summer's day?" },
      { text: "Thou art more lovely and more temperate:" },
      { text: "Rough winds do shake the darling buds of May," },
      { text: "And summer's lease hath all too short a date;" },
      { text: "So long as men can breathe or eyes can see," },
      { text: "So long lives this, and this gives life to thee." },
    ],
  },
  {
    id: "mock-pride-prejudice",
    title: "Pride and Prejudice (opening)",
    language: "en",
    category: "소설",
    order: 1,
    difficulty: "Medium",
    tags: ["novel", "austen"],
    lines: [
      {
        text: "It is a truth universally acknowledged, that a single man in possession of a good fortune,",
      },
      { text: "must be in want of a wife." },
    ],
  },
  {
    id: "mock-alice",
    title: "Alice's Adventures in Wonderland (opening)",
    language: "en",
    category: "소설",
    order: 2,
    tags: ["novel", "carroll", "classic"],
    lines: [
      {
        text: "Alice was beginning to get very tired of sitting by her sister on the bank,",
      },
      { text: "and of having nothing to do." },
      {
        text: "Once or twice she had peeped into the book her sister was reading,",
      },
      { text: "but it had no pictures or conversations in it," },
      {
        text: '"and what is the use of a book," thought Alice, "without pictures or conversations?"',
      },
    ],
  },
  {
    id: "mock-pangram",
    title: "Typing Warm-up",
    language: "en",
    category: "연습",
    difficulty: "Easy",
    tags: [],
    lines: [
      { text: "The quick brown fox jumps over the lazy dog." },
      { text: "Pack my box with five dozen liquor jugs." },
    ],
  },
];

/** 전체 더미 예문(줄 포함)을 반환한다. */
export function getMockPassages(): Passage[] {
  return mockPassages;
}

/** 목록용 요약(lines 제외)을 Passage에서 파생해 반환한다. */
export function getMockPassageSummaries(): PassageSummary[] {
  return mockPassages.map((passage) => ({
    id: passage.id,
    title: passage.title,
    language: passage.language,
    category: passage.category,
    order: passage.order,
    difficulty: passage.difficulty,
    tags: passage.tags,
  }));
}

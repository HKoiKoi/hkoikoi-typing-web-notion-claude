// 예문 도메인 타입 (PRD 5장 "앱 내부 타입(개념)"과 1:1 대응). Task 006.
// 노션 SDK/React/Next에 의존하지 않는 순수 타입 파일이다.
//
// 설계 결정 (2026-10-05, 사용자 권장안 승인)
// - PassageResult는 PRD 5장의 `ok` 판별 유니온을 채택한다 (`result.ok`로 좁힌 뒤 data/kind 접근).
// - `enabled`는 Passage에 두지 않는다. `Enabled === false` 행은 노션 매핑 단계(Task 011)에서 제외한다.
// - 필터 키는 PRD 6장/ROADMAP과 같은 category / lang / difficulty / tag를 쓴다.
//   (필드명 language와 달리 URL 쿼리 `?lang=`과 맞추기 위해 필터 키만 lang)

/** 예문 언어. Language select 값(`ko` / `en`) 외의 행은 매핑에서 제외된다. */
export type Language = "ko" | "en";

/** 난이도. Difficulty select 값과 일치하며 없으면 미지정(undefined). */
export type Difficulty = "Easy" | "Medium" | "Hard";

/**
 * 예문 스킨. 노션 Passages DB의 Theme select 값으로 결정한다 (PRD 5장, F016).
 * 허용 값 목록은 이 상수 하나만 소스로 둔다. 결정 규칙은 passages/skin.ts의 resolveSkin.
 */
export const PASSAGE_SKINS = ["default", "hanji", "bible"] as const;
export type PassageSkin = (typeof PASSAGE_SKINS)[number];

/** 목록용 예문 요약 (Passages DB 프로퍼티만). */
export type PassageSummary = {
  /** 노션 page id */
  id: string;
  title: string;
  language: Language;
  /** Category가 없으면 매핑 단계에서 "기타"로 채운다 */
  category: string;
  /** 같은 분류 안 정렬용(장 번호 등). 없으면 Title 순 */
  order?: number;
  difficulty?: Difficulty;
  /** 없으면 빈 배열 */
  tags: string[];
  /** Theme select로 결정. 속성이 없거나 모르는 값이면 "default" */
  skin: PassageSkin;
};

/** 줄 하나. label은 화면 배지로만 쓰고 판정에서는 제외한다 (PRD 7.2). */
export type Line = {
  text: string;
  label?: string;
};

/** 타이핑용 예문 (요약 + Lines DB의 줄). */
export type Passage = PassageSummary & {
  lines: Line[];
};

/**
 * 조회 실패 분류 (PRD 6장 오류 처리).
 * - config: 토큰/DB 권한/ID/환경 변수 문제
 * - transient: 일시 오류(재시도 가능)
 * - notFound: 목록에 없는 예문 ID
 * - empty: 예문 0건 또는 줄 0개
 */
export type PassageErrorKind = "config" | "transient" | "notFound" | "empty";

/** 조회 결과. 서버 래퍼(load.ts)가 반환하고 페이지가 kind별로 안내 화면을 렌더한다. */
export type PassageResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: PassageErrorKind };

/** 목록 필터. 모든 키가 선택이며 값이 없으면 해당 조건은 적용하지 않는다. */
export type PassageFilter = {
  category?: string;
  lang?: Language;
  difficulty?: Difficulty;
  tag?: string;
};

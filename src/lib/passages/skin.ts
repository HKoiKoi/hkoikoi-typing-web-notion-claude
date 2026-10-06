// 예문 스킨 결정 규칙 (PRD 5장, F016). Task 022.
// 순수 함수 모듈: React/Next/노션 SDK에 의존하지 않는다.

import { PASSAGE_SKINS, type PassageSkin } from "@/types/passage";

/**
 * 노션 Theme select 값을 PassageSkin으로 변환한다.
 * 입력: 임의 값(unknown). 출력: PassageSkin.
 * 규칙: PASSAGE_SKINS와 정확히 일치하는 문자열만 그 스킨이고, 그 외 모든 값은 "default"다.
 * 엣지: 빈 문자열, null, undefined, 모르는 문자열, 문자열이 아닌 값은 예외 없이 "default".
 * 대소문자·앞뒤 공백은 허용하지 않는다(노션 select 옵션 값과 정확히 일치해야 함).
 * 스킨을 PASSAGE_SKINS에 추가하면 이 함수도 자동으로 새 값을 허용한다.
 */
export function resolveSkin(raw: unknown): PassageSkin {
  return PASSAGE_SKINS.find((skin) => skin === raw) ?? "default";
}

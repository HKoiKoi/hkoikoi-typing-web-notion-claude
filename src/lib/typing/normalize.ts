// 줄 정규화/코드 포인트 분해 시그니처 (PRD 7.1/7.2). 구현은 Task 010.
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.
// 참고: `declare function`은 isolatedModules에서 값으로 export할 수 없어 throw 스텁으로 둔다.
/* eslint-disable @typescript-eslint/no-unused-vars -- 구현 전 스텁이라 매개변수가 미사용이다. 구현 Task에서 이 줄을 제거한다. (`_` 접두사는 이 프로젝트 lint에서 경고가 해소되지 않음) */

/**
 * 노션에서 읽은 줄 문자열을 정규화한다 (PRD 7.2-1).
 * 입력: 원본 문자열(Text 또는 Label).
 * 출력: NFC 정규화, 탭은 공백으로 치환, 연속 공백은 1칸, 양 끝 공백 제거한 문자열.
 * 엣지: 비면 빈 문자열을 반환한다(줄 제외/라벨 없음 판단은 호출측). 맨 앞 괄호는 그대로 유지한다.
 */
export function normalizeLine(_raw: string): string {
  throw new Error("Task 010에서 구현");
}

/**
 * 문자열을 NFC 정규화한 뒤 코드 포인트 배열로 분해한다 (PRD 7.1).
 * 입력: 임의 문자열. 출력: 글자 단위 배열(`Array.from`). 한글 완성형 음절 1글자 = 1단위.
 * 엣지: 빈 문자열은 빈 배열, 이모지/결합 문자는 코드 포인트 기준으로 분해한다.
 */
export function toCodePoints(_text: string): string[] {
  throw new Error("Task 010에서 구현");
}

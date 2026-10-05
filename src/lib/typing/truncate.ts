// 입력 길이 제한 시그니처 (PRD 7.5). 구현은 Task 010.
// 순수 함수 모듈: React/Next/DOM 전역에 의존하지 않는다.
// 참고: `declare function`은 isolatedModules에서 값으로 export할 수 없어 throw 스텁으로 둔다.
/* eslint-disable @typescript-eslint/no-unused-vars -- 구현 전 스텁이라 매개변수가 미사용이다. 구현 Task에서 이 줄을 제거한다. (`_` 접두사는 이 프로젝트 lint에서 경고가 해소되지 않음) */

/**
 * 입력을 target 길이(코드 포인트 기준)로 잘라낸다 (PRD 7.5).
 * 입력: input(입력창 값), target(현재 줄). 출력: 길이가 target 이하인 문자열.
 * 주의: **조합 중에는 호출 금지(호출측 책임)**. 조합 중 value를 바꾸면 IME 조합이 끊기거나
 * 글자가 중복된다(D10). `compositionend` 이후에만 적용하고, 조합 중 초과분은 judgeLine의 extra로 표시만 한다.
 * 엣지: input이 target보다 짧거나 같으면 그대로 반환한다.
 */
export function truncateToLine(_input: string, _target: string): string {
  throw new Error("Task 010에서 구현");
}

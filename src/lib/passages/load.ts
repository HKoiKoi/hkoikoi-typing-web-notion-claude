import "server-only";

// 서버 래퍼: 노션 조회를 PassageResult로 변환해 페이지에 넘긴다 (PRD 5장/6장).
// 구현은 목록 Task 011, 본문(loadPassage) Task 012.
//
// 경계 규칙
// - 의존 방향: src/lib/notion/* (서버 전용 조회·매핑) <- 이 파일 <- 페이지(서버 컴포넌트).
// - 클라이언트 컴포넌트로는 PassageSummary[] / Passage만 전달한다.
// - 노션 SDK 타입, 토큰, 환경 변수 값은 이 파일 밖으로(특히 클라이언트로) 새어 나가면 안 된다.
//
// [미결] 오류 분류 책임 위치 (Task 011 실측 후 확정)
// - 문제: Task 005 실측(PRD 6장 201행)에서 프로덕션 `use cache` 경계를 지난 오류는 digest만 가진
//   일반 Error가 되어, 캐시 밖 래퍼에서 isNotionClientError/APIErrorCode로 분류할 수 없다.
//   반대로 캐시 함수 안에서 실패를 `{ ok: false }` 결과로 반환하면 그 실패 결과가 캐시된다.
// - 대안 A: 캐시 함수 안에서 분류하고 결과 객체(kind)를 반환하되, 실패 시 cacheLife를 짧게 지정해
//   캐시 기간을 줄인다. 위험: 실패 결과가 짧게나마 캐시되어 복구가 늦고, 실패 시 cacheLife 지정이
//   프로덕션에서 의도대로 동작하는지 미검증.
// - 대안 B: 캐시 함수는 throw를 유지하고, 캐시 밖 래퍼는 분류 없이 transient로 취급하거나
//   마지막 성공값(globalThis) 폴백을 쓴다. 위험: config와 transient를 구분하지 못해 안내 문구가
//   부정확해지고, 폴백은 서버리스 다중 인스턴스에서 보장되지 않는다.
// - 대안 C: 캐시 함수 안에서 오류를 구분 가능한 직렬화 값(예: 오류 코드를 담은 메시지 접두사)으로
//   다시 던진다. 위험: 프로덕션에서 메시지가 가려지므로(digest만 남음) 동작하지 않을 가능성이 높다.
// - 어느 대안을 택해도 이 파일의 반환 타입(PassageResult)은 변하지 않는다.

/* eslint-disable @typescript-eslint/no-unused-vars -- 구현 전 스텁이라 매개변수가 미사용이다. 구현 Task에서 이 줄을 제거한다. (`_` 접두사는 이 프로젝트 lint에서 경고가 해소되지 않음) */

import type { Passage, PassageResult, PassageSummary } from "@/types/passage";

/**
 * 예문 목록(PassageSummary[])을 조회한다. 구현은 Task 011.
 * 성공 시 Enabled 해제·매핑 실패 행이 제외된 목록. 실패 시 kind: config | transient | empty(0건).
 * 정렬/필터는 하지 않는다(클라이언트·페이지에서 filter.ts 사용).
 */
export async function loadPassageSummaries(): Promise<
  PassageResult<PassageSummary[]>
> {
  throw new Error("Task 011에서 구현");
}

/**
 * 예문 한 편(줄 포함)을 조회한다. 구현은 Task 012.
 * 입력: 노션 page id. 목록에 없으면 notFound(Enabled 해제 포함), 줄이 0개이면 empty,
 * 환경 변수 누락·권한 오류는 config, 일시 오류는 transient.
 */
export async function loadPassage(
  _id: string,
): Promise<PassageResult<Passage>> {
  throw new Error("Task 012에서 구현");
}

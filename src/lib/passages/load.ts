import "server-only";

// 서버 래퍼: 노션 조회를 PassageResult로 변환해 페이지에 넘긴다 (PRD 5장/6장).
// 구현은 목록 Task 011, 본문(loadPassage) Task 012.
//
// 경계 규칙
// - 의존 방향: src/lib/notion/* (서버 전용 조회·매핑) <- 이 파일 <- 페이지(서버 컴포넌트).
// - 클라이언트 컴포넌트로는 PassageSummary[] / Passage만 전달한다.
// - 노션 SDK 타입, 토큰, 환경 변수 값은 이 파일 밖으로(특히 클라이언트로) 새어 나가면 안 된다.
//
// [D11 확정] 오류 분류 위치: 캐시 함수는 throw를 유지하고, 실패 후 캐시 밖에서 1회 사전 점검으로 분류한다(시도2).
// - 배경: 프로덕션 `use cache` 경계를 지난 오류는 digest만 가진 일반 Error라 캐시 밖에서 code를 못 읽는다.
//   캐시 함수가 오류를 던지면 그 결과는 캐시되지 않으므로 복구가 즉시 반영된다.
// - 실측(2026-10-05, next build + next start, 노션 실호출):
//   (a) 틀린 토큰 -> unauthorized -> config  (b) 틀린 data source ID -> object_not_found -> config
//   (c) 환경 변수 누락 -> config  (d) 틀린 토큰 후 정상 토큰 복구 즉시 반영(오류 미캐시)
//   (e) 캐시 후 토큰을 틀리게 바꿔도 320초 뒤까지 이전 목록 유지
//   (f) 네트워크 차단(프록시 거부) -> 사전 점검도 실패(unknown) -> transient
// - 대안 A(캐시 함수 안에서 분류해 결과 반환)는 구현·측정하지 않았다. 시도2가 기준(config/transient 구분,
//   복구 즉시, 구현 단순)을 모두 충족해 채택했다.
// - 주의: 이 함수를 정적 프리렌더에서 실행하면 오류 화면이 최대 1일간 박제되므로(실측: 환경 변수 누락 빌드 시
//   `/`가 revalidate 1d로 config 화면 고정) 호출하는 서버 컴포넌트에서 connection()으로 요청 시점에 실행한다.
// - 한계: 마지막 성공값(globalThis)은 서버리스 다중 인스턴스에서 인스턴스마다 달라 폴백이 보장되지 않는다.
//   사전 점검은 요청당 노션 호출 1회를 추가하지만 실패 경로에서만 실행된다.

import {
  APIErrorCode,
  ClientErrorCode,
  isNotionClientError,
} from "@notionhq/client";

import {
  getDataSourceIds,
  getNotionClient,
  NotionConfigError,
} from "@/lib/notion/client";
import {
  getPassageLinesCached,
  probePassageLinesQuery,
} from "@/lib/notion/passage-lines";
import { getPassageSummariesCached } from "@/lib/notion/passages";
import type {
  Line,
  Passage,
  PassageErrorKind,
  PassageResult,
  PassageSummary,
} from "@/types/passage";

// 마지막 성공 목록. HMR/번들 분리에도 한 프로세스에서 공유하도록 globalThis에 둔다.
// 서버리스 다중 인스턴스에서는 인스턴스마다 값이 달라 폴백이 보장되지 않는다(best effort).
const LAST_GOOD_KEY = "__passageSummariesLastGood__";

function getLastGood(): PassageSummary[] | undefined {
  return (globalThis as unknown as Record<string, PassageSummary[] | undefined>)[
    LAST_GOOD_KEY
  ];
}

function setLastGood(list: PassageSummary[]): void {
  (globalThis as unknown as Record<string, PassageSummary[] | undefined>)[
    LAST_GOOD_KEY
  ] = list;
}

/** 노션 오류를 error.code로만 분류한다(message 분기 금지). 알 수 없으면 transient */
function classifyError(error: unknown): PassageErrorKind {
  if (!isNotionClientError(error)) return "transient";
  switch (error.code) {
    case APIErrorCode.Unauthorized:
    case APIErrorCode.RestrictedResource:
    case APIErrorCode.ObjectNotFound:
    // 프로퍼티 이름·타입이 어긋난 스키마 불일치는 재시도로 복구되지 않는다.
    case APIErrorCode.ValidationError:
    case APIErrorCode.InvalidRequest:
    case APIErrorCode.InvalidRequestURL:
      return "config";
    case APIErrorCode.RateLimited:
    case APIErrorCode.InternalServerError:
    case APIErrorCode.ServiceUnavailable:
    case ClientErrorCode.RequestTimeout:
    default:
      return "transient";
  }
}

/**
 * 프로덕션 `use cache` 경계를 지난 오류는 digest만 가진 일반 Error라 분류할 수 없다.
 * 그래서 실패 후 캐시 밖에서 data source 조회를 1회 시도해 code로 분류한다.
 * 줄 점검(lines)은 data source 조회 뒤에 실제 줄 쿼리(1건)도 시도해 스키마 불일치(validation_error 등)를 잡는다.
 * 사전 점검이 모두 성공하면 원인은 일시 오류로 본다.
 * target: 'passages'는 예문 DB, 'lines'는 줄 DB를 점검한다(lines는 passageId 필요).
 */
async function classifyByProbe(
  target: "passages" | "lines" = "passages",
  passageId?: string,
): Promise<PassageErrorKind> {
  const label = target === "passages" ? "목록" : "줄";
  try {
    const { passagesDataSourceId, linesDataSourceId } = getDataSourceIds();
    await getNotionClient().dataSources.retrieve({
      data_source_id:
        target === "passages" ? passagesDataSourceId : linesDataSourceId,
    });
    if (target === "lines" && passageId) await probePassageLinesQuery(passageId);
    return "transient";
  } catch (error) {
    if (error instanceof NotionConfigError) return "config";
    const kind = classifyError(error);
    console.warn(
      `[passages] ${label} 사전 점검 실패: ${isNotionClientError(error) ? error.code : "unknown"} -> ${kind}`,
    );
    return kind;
  }
}

/** 캐시 조회 실패 원인을 남긴다. 프로덕션 캐시 경계를 지난 오류는 code가 없어 unknown으로 찍힌다. */
function logLoadFailure(label: string, error: unknown): void {
  console.warn(
    `[passages] ${label} 조회 실패: ${isNotionClientError(error) ? error.code : "unknown"}`,
  );
}

/**
 * 예문 목록(PassageSummary[])을 조회한다.
 * 성공 시 Enabled 해제·매핑 실패 행이 제외된 목록. 실패 시 kind: config | transient | empty(0건).
 * 캐시 조회가 실패해도 마지막 성공값이 있으면 그 값을 ok로 돌려준다.
 * 정렬/필터는 하지 않는다(클라이언트·페이지에서 filter.ts 사용).
 */
export async function loadPassageSummaries(): Promise<
  PassageResult<PassageSummary[]>
> {
  try {
    getDataSourceIds();
  } catch (error) {
    if (error instanceof NotionConfigError) {
      return { ok: false, kind: "config" };
    }
    throw error;
  }

  try {
    const list = await getPassageSummariesCached();
    if (list.length === 0) return { ok: false, kind: "empty" };
    setLastGood(list);
    return { ok: true, data: list };
  } catch (error) {
    logLoadFailure("목록", error);
    const lastGood = getLastGood();
    if (lastGood) return { ok: true, data: lastGood };
    return { ok: false, kind: await classifyByProbe("passages") };
  }
}

// 예문별 마지막 성공 줄. 목록과 같은 이유로 globalThis에 둔다(best effort).
const LINES_LAST_GOOD_KEY = "__passageLinesLastGood__";

function getLinesLastGoodMap(): Map<string, Line[]> {
  const store = globalThis as unknown as Record<string, Map<string, Line[]> | undefined>;
  return (store[LINES_LAST_GOOD_KEY] ??= new Map());
}

/** 노션 page id 비교용 정규화: 대소문자 무시, 대시 제거 */
function normalizeId(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

/**
 * 예문 한 편(줄 포함)을 조회한다.
 * 동작 요약
 * 1. 환경 변수(Passages/Lines ID 포함) 누락이면 config.
 * 2. 목록(loadPassageSummaries) 실패는 config/transient 그대로 전달, empty는 notFound로 변환.
 * 3. 목록에서 id(대소문자 무시, 대시 제거)가 일치하는 요약을 찾는다. 없으면 notFound(Enabled 해제 예문 포함).
 * 4. 줄 캐시 조회 성공 시 예문별 마지막 성공값을 갱신한다. 실패 시 마지막 성공값이 있으면 ok,
 *    없으면 classifyByProbe('lines')로 config/transient 분류.
 * 5. 줄이 0개이면 empty, 아니면 { ...요약, lines }를 ok로 반환한다.
 */
export async function loadPassage(id: string): Promise<PassageResult<Passage>> {
  try {
    getDataSourceIds();
  } catch (error) {
    if (error instanceof NotionConfigError) {
      return { ok: false, kind: "config" };
    }
    throw error;
  }

  const summaries = await loadPassageSummaries();
  if (!summaries.ok) {
    return {
      ok: false,
      kind: summaries.kind === "empty" ? "notFound" : summaries.kind,
    };
  }

  const target = normalizeId(id);
  const summary = summaries.data.find((item) => normalizeId(item.id) === target);
  if (!summary) return { ok: false, kind: "notFound" };

  let lines: Line[];
  try {
    lines = await getPassageLinesCached(summary.id);
    getLinesLastGoodMap().set(summary.id, lines);
  } catch (error) {
    logLoadFailure("줄", error);
    const lastGood = getLinesLastGoodMap().get(summary.id);
    if (!lastGood) {
      return { ok: false, kind: await classifyByProbe("lines", summary.id) };
    }
    lines = lastGood;
  }

  if (lines.length === 0) return { ok: false, kind: "empty" };
  return { ok: true, data: { ...summary, lines } };
}

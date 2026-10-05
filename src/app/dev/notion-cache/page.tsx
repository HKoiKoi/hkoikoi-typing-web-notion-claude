import { APIErrorCode, isNotionClientError } from "@notionhq/client";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";
import { getCallCount, getLastGood, isBadToken, setLastGood } from "@/lib/notion/dev-probe";
import { NotionConfigError } from "@/lib/notion/client";
import { getPassageRowsCached } from "@/lib/notion/passages";

import { setBadTokenAction } from "./actions";

type FailureKind = "config" | "transient" | "unknown";

const CONFIG_CODES: readonly string[] = [
  APIErrorCode.Unauthorized,
  APIErrorCode.RestrictedResource,
  APIErrorCode.ObjectNotFound,
  APIErrorCode.ValidationError,
  APIErrorCode.InvalidRequest,
  APIErrorCode.InvalidRequestURL,
];
const TRANSIENT_CODES: readonly string[] = [
  APIErrorCode.RateLimited,
  APIErrorCode.InternalServerError,
  APIErrorCode.ServiceUnavailable,
  APIErrorCode.ServiceOverload,
  APIErrorCode.GatewayTimeout,
];

const FAILURE_LABEL: Record<FailureKind, string> = {
  config: "설정 오류 (토큰/권한/ID 확인 필요)",
  transient: "일시 오류 (잠시 후 재시도)",
  unknown: "알 수 없는 오류",
};

// 오류 객체 대신 분류 결과만 노출한다. 메시지, 토큰, ID는 렌더/로그하지 않는다.
function classifyFailure(error: unknown): FailureKind {
  if (error instanceof NotionConfigError) return "config";
  if (isNotionClientError(error)) {
    if (CONFIG_CODES.includes(error.code)) return "config";
    if (TRANSIENT_CODES.includes(error.code)) return "transient";
  }
  return "unknown";
}

async function ProbeResult() {
  // 요청 시점 값(토글 상태, 호출 횟수)을 읽으므로 프리렌더에서 제외한다.
  await connection();

  // 환경 변수는 요청 시점에 판단해야 한다(빌드 시점에 평가되면 notFound가 프리렌더된다).
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NOTION_SPIKE_PROBE
  ) {
    notFound();
  }

  const badToken = isBadToken();
  type Data = Awaited<ReturnType<typeof getPassageRowsCached>>;
  let data: Data | null = null;
  let failure: FailureKind | null = null;
  let fallbackUsed = false;
  try {
    data = await getPassageRowsCached();
    setLastGood(data);
  } catch (error) {
    failure = classifyFailure(error);
    // D11 실험: 캐시 밖 마지막 성공값 폴백(Task 011 대응책 후보 평가용)
    const lastGood = getLastGood<Data>();
    if (lastGood) {
      data = lastGood;
      fallbackUsed = true;
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">토큰 오염 토글</h2>
        <p>
          현재 상태:{" "}
          <strong data-testid="bad-token-state">{badToken ? "on" : "off"}</strong>
        </p>
        <div className="flex gap-2">
          <form action={setBadTokenAction}>
            <input type="hidden" name="value" value="on" />
            <button
              type="submit"
              data-testid="bad-token-on"
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              틀린 토큰 켜기
            </button>
          </form>
          <form action={setBadTokenAction}>
            <input type="hidden" name="value" value="off" />
            <button
              type="submit"
              data-testid="bad-token-off"
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              틀린 토큰 끄기
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">목록 캐시 결과</h2>
        <p>
          노션 실호출 횟수(누적):{" "}
          <span data-testid="call-count">{getCallCount()}</span>
        </p>
        {data ? (
          <>
            {fallbackUsed && (
              <p data-testid="fallback-used" data-kind={failure ?? ""}>
                오류 발생, 마지막 성공값 표시 중
              </p>
            )}
            <p>
              캐시된 결과의 호출 번호:{" "}
              <span data-testid="cached-call-count">{data.callCount}</span>
            </p>
            <p>
              fetchedAt: <span data-testid="fetched-at">{data.fetchedAt}</span>
            </p>
            <p>
              행 수: <span data-testid="row-count">{data.rows.length}</span>
            </p>
            <ul className="list-disc pl-6" data-testid="title-list">
              {data.rows.map((row) => (
                <li key={row.id} data-testid="title-item">
                  {row.title || "(제목 없음)"}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p role="alert" data-testid="failure-kind" data-kind={failure}>
            {FAILURE_LABEL[failure ?? "unknown"]}
          </p>
        )}
      </section>
    </div>
  );
}

// 개발/스파이크 전용 페이지. 프로덕션에서는 NOTION_SPIKE_PROBE 가 있을 때만 열린다.
export default function NotionCachePage() {
  return (
    <Container className="pb-16">
      <PageHeader
        title="노션 캐시 검증 (개발 전용)"
        description="예문 목록 캐시, 실호출 횟수, 오류 분류를 확인합니다."
      />
      <Suspense
        fallback={<p data-testid="loading">불러오는 중...</p>}
      >
        <ProbeResult />
      </Suspense>
    </Container>
  );
}

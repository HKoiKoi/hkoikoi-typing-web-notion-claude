import { connection } from "next/server";

import { PassageErrorState } from "@/components/common/passage-error-state";
import { PassageRetryButton } from "@/components/common/passage-retry-button";
import { loadPassageSummaries } from "@/lib/passages/load";

import { PassageBrowser } from "./passage-browser";

/** 노션에서 예문 목록을 불러와 성공이면 목록을, 실패면 kind별 안내 화면을 보여준다. */
export async function PassageListSection() {
  // 오류·폴백 결과가 정적 프리렌더에 박제되지 않도록 요청 시점에 실행한다.
  // 노션 조회 자체는 getPassageSummariesCached가 캐시하므로 요청마다 노션을 호출하지는 않는다.
  await connection();
  const result = await loadPassageSummaries();

  if (result.ok) {
    return <PassageBrowser passages={result.data} />;
  }
  if (result.kind === "empty") {
    return (
      <PassageErrorState
        kind="empty"
        description="노션 DB에 예문 행을 추가하세요. 추가한 예문은 반영까지 몇 분 걸릴 수 있습니다."
        action={<PassageRetryButton label="다시 확인" />}
      />
    );
  }
  if (result.kind === "transient") {
    return <PassageErrorState kind="transient" action={<PassageRetryButton />} />;
  }
  if (result.kind === "config") {
    return (
      <PassageErrorState
        kind="config"
        action={<PassageRetryButton label="다시 확인" />}
      />
    );
  }
  return <PassageErrorState kind={result.kind} />;
}

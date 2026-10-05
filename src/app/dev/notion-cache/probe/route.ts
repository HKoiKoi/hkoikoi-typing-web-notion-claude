import { isFullPage } from "@notionhq/client";
import { notFound } from "next/navigation";
import { connection, NextResponse } from "next/server";

import { isProbeEnabled } from "@/lib/notion/dev-probe";
import { getDataSourceIds, getNotionClient } from "@/lib/notion/client";
import { queryLinesUncached } from "@/lib/notion/lines";
import { queryPassageRowsUncached } from "@/lib/notion/passages";

// Task 005 스파이크 전용 검증 엔드포인트. Task 018에서 제거한다.
// GET ?mode=passages|lines|fp-ids&pageSize=N&passageId=ID&fp=ID1,ID2
export async function GET(request: Request) {
  await connection(); // 가드와 응답을 빌드 시점 프리렌더에서 제외한다
  if (process.env.NODE_ENV === "production" && !isProbeEnabled()) notFound();

  const params = new URL(request.url).searchParams;
  const mode = params.get("mode") ?? "passages";
  const pageSize = params.get("pageSize");
  const passageId = params.get("passageId");
  const fp = params.get("fp")?.split(",").filter(Boolean);
  const options = {
    ...(pageSize && { pageSize: Number(pageSize) }),
    ...(fp && { filterProperties: fp }),
  };

  try {
    if (mode === "lines") {
      if (!passageId) return NextResponse.json({ error: "passageId 필요" }, { status: 400 });
      return NextResponse.json(await queryLinesUncached(passageId, options));
    }
    if (mode === "schema") {
      const notion = getNotionClient();
      const ids = getDataSourceIds();
      const pick = async (id: string) => {
        const ds = await notion.dataSources.retrieve({ data_source_id: id });
        return Object.entries(ds.properties).map(([name, p]) => `${name}:${p.type}`);
      };
      return NextResponse.json({
        passages: await pick(ids.passagesDataSourceId),
        lines: await pick(ids.linesDataSourceId),
      });
    }
    if (mode === "fp-ids") {
      // 프로퍼티 이름→ID 매핑을 보여 주고, ID 배열로 filter_properties를 줘서 응답 키를 확인한다.
      const notion = getNotionClient();
      const { passagesDataSourceId } = getDataSourceIds();
      const all = await notion.dataSources.query({
        data_source_id: passagesDataSourceId,
        page_size: 1,
      });
      const first = all.results.find(isFullPage);
      const idByName = Object.fromEntries(
        Object.entries(first?.properties ?? {}).map(([name, p]) => [name, p.id]),
      );
      const wanted = ["Title", "Language"].map((n) => idByName[n]).filter(Boolean);
      const byIds = await notion.dataSources.query({
        data_source_id: passagesDataSourceId,
        page_size: 1,
        filter_properties: wanted,
      });
      const byIdsFirst = byIds.results.find(isFullPage);
      return NextResponse.json({
        idByName,
        requestedIds: wanted,
        returnedPropertyNames: Object.keys(byIdsFirst?.properties ?? {}),
      });
    }
    return NextResponse.json(await queryPassageRowsUncached(options));
  } catch (error) {
    // 메시지에 ID가 섞일 수 있어 분류용 code만 노출한다.
    const code = (error as { code?: string })?.code ?? "unknown";
    return NextResponse.json({ error: code }, { status: 500 });
  }
}

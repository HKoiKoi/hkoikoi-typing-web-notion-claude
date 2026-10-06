import "server-only";

import { Client } from "@notionhq/client";

// 노션 클라이언트와 환경 변수 검증 (서버 전용).
// 토큰은 이 모듈 안에서만 다루며, export 함수는 토큰을 반환하지 않는다.
// API 버전은 SDK 기본값을 사용한다(notionVersion 지정 금지).

const REQUIRED_ENV_NAMES = [
  "NOTION_TOKEN",
  "NOTION_DATA_SOURCE_ID",
  "NOTION_LINES_DATA_SOURCE_ID",
] as const;

/** 필수 노션 환경 변수 누락. 호출측은 message가 아니라 instanceof와 missing으로 구분한다 */
export class NotionConfigError extends Error {
  readonly missing: readonly string[];

  constructor(missing: readonly string[]) {
    super(`노션 환경 변수가 설정되지 않았습니다: ${missing.join(", ")}`);
    this.name = "NotionConfigError";
    this.missing = missing;
  }
}

type NotionConfig = {
  token: string;
  passagesDataSourceId: string;
  linesDataSourceId: string;
};

// 모듈 내부 전용: 토큰을 포함하므로 export 하지 않는다
function getNotionConfig(): NotionConfig {
  const missing = REQUIRED_ENV_NAMES.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new NotionConfigError(missing);
  }
  return {
    token: process.env.NOTION_TOKEN!.trim(),
    passagesDataSourceId: process.env.NOTION_DATA_SOURCE_ID!.trim(),
    linesDataSourceId: process.env.NOTION_LINES_DATA_SOURCE_ID!.trim(),
  };
}

/** 예문/줄 data source ID. 환경 변수가 없으면 NotionConfigError */
export function getDataSourceIds(): {
  passagesDataSourceId: string;
  linesDataSourceId: string;
} {
  const { passagesDataSourceId, linesDataSourceId } = getNotionConfig();
  return { passagesDataSourceId, linesDataSourceId };
}

/**
 * 노션 클라이언트를 만든다. 호출마다 새로 생성한다.
 * 환경 변수가 없으면 NotionConfigError.
 */
export function getNotionClient(): Client {
  const { token } = getNotionConfig();
  return new Client({ auth: token });
}

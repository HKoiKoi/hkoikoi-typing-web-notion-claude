"use server";

import { isProbeEnabled, setBadToken } from "@/lib/notion/dev-probe";

// 틀린 토큰 모드를 켜고 끄는 form action. 캐시 무효화나 화면 갱신 없이 상태만 바꾼다.
// 프로덕션에서는 NOTION_SPIKE_PROBE 가 있을 때만 동작한다(페이지와 같은 가드).
export async function setBadTokenAction(formData: FormData): Promise<void> {
  if (process.env.NODE_ENV === "production" && !process.env.NOTION_SPIKE_PROBE) {
    return;
  }
  if (!isProbeEnabled()) return;
  setBadToken(formData.get("value") === "on");
}

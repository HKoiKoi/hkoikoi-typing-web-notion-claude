"use server";

import { refresh } from "next/cache";

import { isProbeEnabled, setBadToken } from "@/lib/notion/dev-probe";

// 틀린 토큰 모드를 켜고 끄는 form action. 캐시는 건드리지 않고 화면만 새로고침한다.
export async function setBadTokenAction(formData: FormData): Promise<void> {
  if (!isProbeEnabled()) return;
  setBadToken(formData.get("value") === "on");
  refresh();
}

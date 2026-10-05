import "server-only";

// 노션 연동 스파이크(Task 005)용 개발 전용 계측과 토글.
// NOTION_SPIKE_PROBE=1 일 때만 동작한다. 프로덕션 모드(next start) 실측을 위해 NODE_ENV 가드는 쓰지 않는다.
// 상태는 globalThis에 걸어 dev HMR/번들 분리로 모듈 인스턴스가 여러 개여도 한 프로세스에서 공유한다.
// 토큰, ID, 응답 본문은 절대 출력하지 않는다.

type ProbeState = {
  callCount: number;
  badToken: boolean;
  lastGood: unknown;
};

const STATE_KEY = "__notionSpikeProbeState__";

function getState(): ProbeState {
  const holder = globalThis as unknown as Record<string, ProbeState | undefined>;
  let state = holder[STATE_KEY];
  if (!state) {
    state = { callCount: 0, badToken: false, lastGood: undefined };
    holder[STATE_KEY] = state;
  }
  return state;
}

/** probe 활성 여부 (NOTION_SPIKE_PROBE === "1") */
export function isProbeEnabled(): boolean {
  return process.env.NOTION_SPIKE_PROBE === "1";
}

/** 노션 실호출 카운터를 1 올리고 현재값을 반환한다. probe 비활성이면 증가 없이 0 */
export function countCall(label?: string): number {
  if (!isProbeEnabled()) return 0;
  const state = getState();
  state.callCount += 1;
  console.info(`[notion-probe] call #${state.callCount}${label ? ` ${label}` : ""}`);
  return state.callCount;
}

export function getCallCount(): number {
  return getState().callCount;
}

export function resetCallCount(): void {
  getState().callCount = 0;
}

/** 틀린 토큰 모드 설정. probe 비활성이면 무시 */
export function setBadToken(value: boolean): void {
  if (!isProbeEnabled()) return;
  getState().badToken = value;
}

/** 틀린 토큰 모드 여부. probe 비활성이면 항상 false */
export function isBadToken(): boolean {
  if (!isProbeEnabled()) return false;
  return getState().badToken;
}

/** D11 폴백 실험용: 캐시 밖 마지막 성공값 저장/조회. probe 비활성이면 저장하지 않는다 */
export function setLastGood(value: unknown): void {
  if (!isProbeEnabled()) return;
  getState().lastGood = value;
}

export function getLastGood<T>(): T | undefined {
  if (!isProbeEnabled()) return undefined;
  return getState().lastGood as T | undefined;
}

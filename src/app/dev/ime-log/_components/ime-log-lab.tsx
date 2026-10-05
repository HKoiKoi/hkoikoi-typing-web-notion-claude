"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  initialPendingEnterState,
  pendingEnterScenarios,
  replayScenario,
  stepPendingEnter,
  type PendingEnterEvent,
  type PendingEnterState,
} from "@/lib/typing/pending-enter";

const TARGET_LINE = "닭이 읽은 왜 의";
const MAX_LOG_ROWS = 500;

type InputTarget = "controlled" | "uncontrolled";

type LogRow = {
  seq: number;
  t: number;
  type: string;
  key: string | null;
  isComposing: boolean | null;
  keyCode: number | null;
  data: string | null;
  inputType: string | null;
  value: string;
  target: InputTarget;
};

type LogInput = Omit<LogRow, "seq" | "t">;

type LogBuffer = {
  push: (row: LogInput) => void;
  clear: () => void;
  dispose: () => void;
};

// 로그는 ref 성격의 버퍼에 쌓고 rAF로 한 번에 state에 반영한다.
// 입력 이벤트 처리 중 리렌더(특히 controlled value 변경과의 중첩)를 줄이기 위함이다.
function createLogBuffer(onFlush: (rows: LogRow[]) => void): LogBuffer {
  let rows: LogRow[] = [];
  let seq = 0;
  let frame: number | null = null;

  const schedule = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      onFlush(rows.slice());
    });
  };

  return {
    push(row) {
      seq += 1;
      rows.push({
        ...row,
        seq,
        t: Math.round(performance.now() * 10) / 10,
      });
      if (rows.length > MAX_LOG_ROWS) rows = rows.slice(-MAX_LOG_ROWS);
      schedule();
    },
    clear() {
      rows = [];
      schedule();
    },
    dispose() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
  };
}

function toTsv(rows: LogRow[]): string {
  const header = [
    "seq",
    "t",
    "type",
    "key",
    "isComposing",
    "keyCode",
    "data",
    "inputType",
    "value",
    "target",
  ];
  const cell = (v: unknown) =>
    v === null || v === undefined ? "" : String(v).replace(/[\t\r\n]/g, " ");
  const lines = rows.map((r) =>
    [
      r.seq,
      r.t,
      r.type,
      r.key,
      r.isComposing,
      r.keyCode,
      r.data,
      r.inputType,
      r.value,
      r.target,
    ]
      .map(cell)
      .join("\t"),
  );
  return [header.join("\t"), ...lines].join("\n");
}

type ProbeProps = {
  target: InputTarget;
  title: string;
  logger: LogBuffer;
  forceMutate: boolean;
};

// 입력 1종(controlled 또는 uncontrolled)과 그 Enter reducer 데모.
function ImeProbe({ target, title, logger, forceMutate }: ProbeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = target === "controlled";

  const [value, setValue] = useState("");
  // reducer 상태: 이벤트 연속 처리를 위해 ref가 기준이고, state는 화면 표시용 사본이다.
  const pendingRef = useRef<PendingEnterState>(initialPendingEnterState);
  const [pending, setPending] = useState<PendingEnterState>(
    initialPendingEnterState,
  );
  const [advanceTotal, setAdvanceTotal] = useState(0);
  const sinceEnterRef = useRef(0);
  const [sinceEnter, setSinceEnter] = useState(0);
  const [rejectCount, setRejectCount] = useState(0);
  const [lastResult, setLastResult] = useState("-");

  // beforeinput은 React 합성 이벤트가 아닌 native 리스너로 부착한다.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handler = (e: InputEvent) => {
      logger.push({
        type: "beforeinput",
        key: null,
        isComposing: e.isComposing,
        keyCode: null,
        data: e.data,
        inputType: e.inputType,
        value: el.value,
        target,
      });
      if (e.inputType === "insertFromPaste" || e.inputType === "insertFromDrop") {
        e.preventDefault();
      }
    };
    el.addEventListener("beforeinput", handler);
    return () => el.removeEventListener("beforeinput", handler);
  }, [logger, target]);

  function applyStep(event: PendingEnterEvent, resetSince = false) {
    const result = stepPendingEnter(pendingRef.current, event);
    pendingRef.current = result.state;
    setPending(result.state);
    if (resetSince) sinceEnterRef.current = 0;
    if (result.action === "advance") {
      sinceEnterRef.current += 1;
      setAdvanceTotal((n) => n + 1);
      setLastResult("전환(advance)");
      if (isControlled) setValue("");
      else if (inputRef.current) inputRef.current.value = "";
    } else if (result.action === "reject") {
      setRejectCount((n) => n + 1);
      setLastResult("불일치(reject)");
    }
    setSinceEnter(sinceEnterRef.current);
    return result.action;
  }

  function log(
    type: string,
    e: {
      currentTarget: HTMLInputElement;
      nativeEvent: Event;
    },
    extra: Partial<LogInput> = {},
  ) {
    logger.push({
      type,
      key: null,
      isComposing: null,
      keyCode: null,
      data: null,
      inputType: null,
      value: e.currentTarget.value,
      target,
      ...extra,
    });
  }

  const composing = pending.composing;

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Input
        ref={inputRef}
        {...(isControlled ? { value } : {})}
        aria-label={`${title} 입력`}
        placeholder="여기에 대상 줄을 따라 입력하세요"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onKeyDown={(e) => {
          log("keydown", e, {
            key: e.key,
            isComposing: e.nativeEvent.isComposing,
            keyCode: e.keyCode,
          });
          if (e.key !== "Enter") return;
          const composingFlag = e.nativeEvent.isComposing || e.keyCode === 229;
          if (composingFlag) e.preventDefault();
          const matches = e.currentTarget.value === TARGET_LINE;
          // 무시되는 두 번째 Enter(suppressEnter)는 "마지막 Enter 이후 advance 횟수"를 리셋하지 않는다.
          applyStep(
            { kind: "keydown-enter", composingFlag, matches },
            !pendingRef.current.suppressEnter,
          );
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter") applyStep({ kind: "keyup-enter" });
        }}
        onCompositionStart={(e) => {
          log("compositionstart", e, { data: e.data });
          applyStep({ kind: "compositionstart" });
        }}
        onCompositionUpdate={(e) => {
          log("compositionupdate", e, { data: e.data });
        }}
        onCompositionEnd={(e) => {
          log("compositionend", e, { data: e.data });
          applyStep({
            kind: "compositionend",
            matches: e.currentTarget.value === TARGET_LINE,
          });
        }}
        onInput={(e) => {
          const native = e.nativeEvent as InputEvent;
          log("input", e, {
            data: native.data,
            inputType: native.inputType,
            isComposing: native.isComposing,
          });
        }}
        onChange={
          isControlled
            ? (e) => {
                const next = e.target.value;
                log("onChange", e, {
                  data: (e.nativeEvent as InputEvent).data,
                  inputType: (e.nativeEvent as InputEvent).inputType,
                });
                if (forceMutate && pendingRef.current.composing) {
                  // D10 실험: 조합 중 value를 강제로 변형한다.
                  setValue(next.slice(0, -1));
                } else {
                  setValue(next);
                }
              }
            : (e) => {
                log("onChange", e, {
                  data: (e.nativeEvent as InputEvent).data,
                  inputType: (e.nativeEvent as InputEvent).inputType,
                });
              }
        }
        onPaste={(e) => {
          log("paste", e);
          e.preventDefault();
        }}
        onDrop={(e) => {
          log("drop", e);
          e.preventDefault();
        }}
      />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <dt className="text-muted-foreground">전환 카운터</dt>
        <dd className="font-mono">{advanceTotal}</dd>
        <dd className="hidden sm:block" />
        <dt className="text-muted-foreground">조합 중(composing)</dt>
        <dd className="font-mono">{String(composing)}</dd>
        <dd className="hidden sm:block" />
        <dt className="text-muted-foreground">pendingEnter</dt>
        <dd className="font-mono">{String(pending.pendingEnter)}</dd>
        <dd className="hidden sm:block" />
        <dt className="text-muted-foreground">마지막 Enter 이후 advance 횟수</dt>
        <dd
          className={cn("font-mono", sinceEnter > 1 && "text-destructive font-bold")}
        >
          {sinceEnter}
          {sinceEnter > 1 && " (중복 전환!)"}
        </dd>
        <dd className="hidden sm:block" />
        <dt className="text-muted-foreground">불일치 횟수 / 최근 결과</dt>
        <dd className="font-mono">
          {rejectCount} / {lastResult}
        </dd>
      </dl>
    </section>
  );
}

export function ImeLogLab() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [logger] = useState(() => createLogBuffer(setRows));
  const [forceMutate, setForceMutate] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [scenarioResults, setScenarioResults] = useState<
    {
      name: string;
      advanceCount: number;
      rejectCount: number;
      expected: number;
      expectedReject: number;
      state: string;
    }[]
  >([]);

  useEffect(() => () => logger.dispose(), [logger]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} 복사 완료 (${rows.length}행)`);
    } catch {
      setCopyStatus("복사에 실패했습니다. 클립보드 권한을 확인하세요.");
    }
  }

  function runScenarios() {
    setScenarioResults(
      pendingEnterScenarios.map((s) => {
        const { state, advanceCount, rejectCount } = replayScenario(s.events);
        return {
          name: s.name,
          advanceCount,
          rejectCount,
          expected: s.expectedAdvanceCount,
          expectedReject: s.expectedRejectCount,
          state: `composing=${state.composing}, pendingEnter=${state.pendingEnter}, suppressEnter=${state.suppressEnter}`,
        };
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">대상 줄</p>
        <p className="text-2xl font-semibold" lang="ko">
          {TARGET_LINE}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          한글 IME로 입력한 뒤 마지막 글자가 조합 중일 때 Enter를 눌러
          보세요. 줄이 일치하면 전환 카운터가 한 번만 올라가야 합니다.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="force-mutate"
          checked={forceMutate}
          onCheckedChange={(v) => setForceMutate(v === true)}
        />
        <Label htmlFor="force-mutate">
          controlled 조합 중 value 강제 변경 (D10 실험)
        </Label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ImeProbe
          target="controlled"
          title="① controlled 입력"
          logger={logger}
          forceMutate={forceMutate}
        />
        <ImeProbe
          target="uncontrolled"
          title="② uncontrolled 입력"
          logger={logger}
          forceMutate={false}
        />
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">시나리오 재생</h2>
          <Button type="button" variant="outline" onClick={runScenarios}>
            시나리오 재생
          </Button>
        </div>
        {scenarioResults.length > 0 && (
          <ul className="space-y-1 text-sm">
            {scenarioResults.map((r) => (
              <li key={r.name}>
                <span className="font-medium">{r.name}</span>: advance{" "}
                <span className="font-mono">{r.advanceCount}</span>회 (기대{" "}
                <span className="font-mono">{r.expected}</span>), reject{" "}
                <span className="font-mono">{r.rejectCount}</span>회 (기대{" "}
                <span className="font-mono">{r.expectedReject}</span>) /{" "}
                <span className="font-mono">{r.state}</span>{" "}
                {r.advanceCount === r.expected &&
                r.rejectCount === r.expectedReject
                  ? "- 일치"
                  : "- 불일치"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">
            이벤트 로그 ({rows.length}/{MAX_LOG_ROWS})
          </h2>
          <Button type="button" variant="outline" onClick={() => logger.clear()}>
            지우기
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copy(toTsv(rows), "탭 구분")}
          >
            탭 구분 복사
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copy(JSON.stringify(rows, null, 2), "JSON")}
          >
            JSON 복사
          </Button>
        </div>
        {copyStatus && (
          <p role="status" className="text-sm text-muted-foreground">
            {copyStatus}
          </p>
        )}
        <div className="max-h-[32rem] overflow-auto rounded-lg border">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-2 py-1">시간(ms)</th>
                <th className="px-2 py-1">대상</th>
                <th className="px-2 py-1">종류</th>
                <th className="px-2 py-1">key</th>
                <th className="px-2 py-1">isComposing</th>
                <th className="px-2 py-1">keyCode</th>
                <th className="px-2 py-1">data / inputType</th>
                <th className="px-2 py-1">value</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center">
                    기록된 이벤트가 없습니다.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.seq} className="border-t">
                  <td className="px-2 py-1">{r.t.toFixed(1)}</td>
                  <td className="px-2 py-1">
                    {r.target === "controlled" ? "C" : "U"}
                  </td>
                  <td className="px-2 py-1">{r.type}</td>
                  <td className="px-2 py-1">{r.key ?? ""}</td>
                  <td className="px-2 py-1">
                    {r.isComposing === null ? "" : String(r.isComposing)}
                  </td>
                  <td className="px-2 py-1">{r.keyCode ?? ""}</td>
                  <td className="px-2 py-1">
                    {[r.data, r.inputType].filter(Boolean).join(" / ")}
                  </td>
                  <td className="px-2 py-1">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

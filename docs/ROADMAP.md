# 노션 타이핑 연습 개발 로드맵

노션 DB에 모아 둔 한국어/영어 여러 줄 예문을 불러와, 한글 IME 조합까지 정확하게 판정하며 한 줄씩 따라 치는 단일 사용자 타이핑 연습 웹앱.

## 개요

노션 타이핑 연습은 노션으로 본문을 관리하는 본인 1인(로그인 없음)을 위한 "내 본문으로 하는 타이핑 연습" 도구로 다음 기능을 제공합니다:

- **노션 예문 연동 및 캐싱 (F001, F008, F015)**: 서버 전용으로 노션 Passages DB(예문 목록)와 Lines DB(줄 단위 본문)를 조회하고 `use cache` + 5분 재검증으로 캐싱
- **예문 탐색 (F002, F007)**: 분류/언어/난이도/태그 클라이언트 필터, URL 쿼리 유지, 같은 필터 기준의 [다음 예문]
- **여러 줄 타이핑과 실시간 판정 (F003, F004, F005, F012, F013, F014)**: 현재 줄 글자별 판정, 한글 조합 중 상태 처리, 조합 중 Enter 보류(`pendingEnter`), 자동 스크롤과 진행도
- **결과 요약 (F006)**: 정확도, 소요 시간, 타수(음절/분), WPM, 오타 수
- **안정성/접근성 (F009, F010)**: 오류·빈 상태별 안내와 복구, 라이트/다크 대비 4.5:1 이상의 판정 색상

참조 문서: `docs/PRD.md`(요구사항 단일 소스), `CLAUDE.md`/`AGENTS.md`(프로젝트 규약).

## 개발 워크플로우

별도 작업 파일(`tasks/`)은 만들지 않는다. Task 명세와 테스트 시나리오는 이 문서에 직접 작성하고, 세부 작업 관리는 추후 shrimp task manager로 이관한다.

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `docs/ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 구현**

- 이 문서의 Task 명세(구현 사항, 수용 기준, 테스트 체크리스트)를 따름
- 기능과 기능성 구현. Next.js 16 API는 반드시 `node_modules/next/dist/docs/`를 먼저 확인
- 각 단계 후 Task의 진행 상황 업데이트

3. **테스트 수행 (게이트)**

- **구현이 끝나면 반드시 테스트를 수행한다.** 테스트를 건너뛴 채 Task를 완료 처리하지 않는다.
- **API 연동과 비즈니스 로직 Task는 Playwright MCP로 테스트한다.** 시나리오는 아래 "테스트 규약"을 따른다.
- 정적 검증: `npx tsc --noEmit`, `npm run lint`
- 정적 검증과 Playwright MCP 시나리오가 모두 통과해야 Task를 ✅로 바꾼다.
- 실패하면 수정 후 재테스트한다. 실패한 채로 ✅ 처리하지 않는다.
- 결과는 해당 Task의 `테스트 결과` 줄에 날짜와 함께 한두 줄로 기록한다.
- 각 Task 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 로드맵에서 완료된 작업을 ✅로 표시
- 결정 Task/스파이크의 결론은 아래 "결정 기록" 표와 PRD 10장에 반영

## 테스트 규약 (Playwright MCP)

**대상**: API 연동과 비즈니스 로직 Task(004, 005, 010~015, 019~021). UI 중심 Task(003, 007~009, 016~018)도 화면 확인에 Playwright MCP를 쓴다. 타입 정의만 있는 Task 006은 `npx tsc --noEmit`으로 충분하다.

**시나리오 작성 형식**: 정상 / 오류 / 엣지로 나누고, 각 항목을 `도구 → 입력 → 기대 결과`로 쓴다. 기대 결과는 숫자나 문구처럼 확인 가능한 값으로 적는다.

**사용 도구**

| 용도 | 도구 |
|------|------|
| 페이지 이동, 상태 확인 | `browser_navigate`, `browser_snapshot`, `browser_wait_for` |
| 조작 | `browser_click`, `browser_type`, `browser_press_key`, `browser_select_option` |
| 값/DOM 검증, 합성 이벤트 | `browser_evaluate` |
| 네트워크, 토큰 비노출 | `browser_network_requests`, `browser_network_request` |
| 오류 감시 | `browser_console_messages` |
| 반응형, 시각 증거 | `browser_resize`, `browser_take_screenshot`, `browser_emulate_media`(다크모드) |

**공통 검증 (모든 Playwright 테스트에서 확인)**

- `browser_console_messages`에 오류 0건
- `browser_network_requests` 응답 본문에 노션 토큰 문자열 0건
- 화면에 표시된 수치가 기대값과 일치

**노션 오류 재현**: `.env`의 값을 바꾸고 dev 서버를 재기동한다(토큰 틀림, data source ID 틀림, 값 삭제). 테스트가 끝나면 반드시 원래 값으로 복구하고 정상 동작을 한 번 더 확인한다.

**한글 IME 한계**: Playwright로 실제 IME 조합을 재현하기 어렵다. S2는 macOS 실기기 수동 시나리오(Chrome·Safari·Firefox)가 기준이다. `browser_evaluate`로 `compositionstart/update/end`와 `input` 이벤트를 디스패치하는 합성 시나리오는 로직 회귀 확인용 보조 수단이며 수동 결과를 대체하지 않는다.

**증거**: 스크린샷은 Playwright MCP 기본 출력 경로에 저장하고 커밋하지 않는다. 결론과 수치만 Task의 `테스트 결과` 줄에 남긴다.

## 프로젝트 규약 요약 (모든 Task 공통)

- **컴포넌트 4계층, 단방향 import**: L1 `src/components/ui/`(shadcn, `npx shadcn@latest add <name>`으로만 추가) → L2 `src/components/common/` → L3 `src/components/layout/` → L4 `src/app/`. 상위 계층은 하위 계층만 import.
- **페이지 전용 컴포넌트 위치**: 한 페이지에서만 쓰는 조합 컴포넌트(예: `PassageCard`, `TypingBoard`)는 L4 라우트 안의 private 폴더(`src/app/_components/`, `src/app/passages/[id]/_components/`)에 둔다. 두 페이지 이상에서 쓰는 것(예: `PassageErrorState`)만 L2로 올린다.
- **로직 위치**: 순수 함수는 `src/lib/`(UI/React 비의존), 노션 접근은 `src/lib/notion/`(서버 전용), 훅은 `src/hooks/`(만들기 전 usehooks-ts 확인).
- **개발 전용 라우트**: `src/app/dev/*`는 검증용이며 프로덕션에서는 `notFound()`로 막는다. Task 018에서 제거 또는 비노출을 확인한다.
- **사이트 정보 단일 소스**: `src/config/site.ts`의 `siteConfig`.
- **React Compiler 활성화**: 수동 `useMemo`/`useCallback` 불필요.
- **문구**: 문서와 UI 문구는 한국어.
- **PRD의 `/components` 쇼케이스 반영 규칙**은 쇼케이스 라우트가 스타터 정리(Task 001)에서 삭제되었으므로 적용하지 않는다.

## 현재 상태 (2026-10-05 기준)

- 완료: Phase 0(Task 001, commit `5b0868c`)과 Phase 1의 Task 002~006 전부, Phase 2의 Task 007~009, Phase 3의 Task 010. 다음 Task: 011(노션 데이터 연동)과 013(입력 엔진 훅)은 서로 병렬로 시작할 수 있다
- 이미 존재하여 다시 만들지 않는 것
  - 설정/의존성: `next.config.ts`의 `cacheComponents: true`, `@notionhq/client` `5.27.0`과 `server-only` `0.0.1`(둘 다 정확 고정), `.env.example`의 노션 키 3종(`NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID`, `NOTION_LINES_DATA_SOURCE_ID`), `siteConfig.nav`는 "예문 목록" 한 항목
  - 루트 `layout.tsx`(ThemeProvider → TooltipProvider → SiteHeader/main/SiteFooter, Toaster), `error.tsx`, `loading.tsx`, `not-found.tsx`
  - L2: `Container`, `EmptyState`(icon/title/description/action), `Logo`, `PageHeader`, `ThemeProvider`, `ThemeToggle`, `PassageErrorState`(Task 007), `StatItem`(Task 007)
  - L3: `SiteHeader`, `SiteFooter`, `MainNav`, `MobileNav`
  - L1(shadcn): alert, avatar, badge, breadcrumb, button, card, checkbox, dialog, dropdown-menu, field, input, label, navigation-menu, progress, scroll-area, select, separator, sheet, skeleton, sonner, tabs, textarea, toggle, toggle-group, tooltip
  - 라우트 골격: 홈(`/`)은 `PageHeader` + `Suspense`로 감싼 `PassageBrowser`(Task 008, 더미 데이터). `/passages/[id]`는 `page.tsx`(params를 `Suspense` 안에서 해석), `_components/passage-placeholder.tsx`, `loading.tsx`, `not-found.tsx`
  - 타입과 계약(Task 006, 시그니처만 있고 본문은 `throw` 스텁. `filter.ts`는 Task 008에서 구현 완료): `src/types/passage.ts`, `src/types/typing.ts`, `src/lib/typing/{normalize,judge,metrics,truncate}.ts`(구현 Task 010), `src/lib/passages/load.ts`(구현 Task 011, 012). 스텁 파일마다 있는 `eslint-disable` 한 줄은 구현 Task에서 제거
  - 스파이크 산출물(Task 004, 005): `src/lib/typing/pending-enter.ts`(Task 013에서 재사용), `src/lib/notion/client.ts`·`passages.ts`·`lines.ts`(Task 011의 출발점, Lines 본문 프로퍼티명 `Text`와 D11 대응책 반영 필요), `src/lib/notion/dev-probe.ts`와 개발 전용 라우트 `/dev/ime-log`, `/dev/notion-cache`(+`probe/route.ts`)는 Task 018에서 제거 또는 비노출 확인
- 아직 없는 것: 노션 행 → `PassageSummary`/`Line` 매핑(`mappers.ts`), 판정·필터·정렬·래퍼 실제 구현, `src/hooks/` 내용(`.gitkeep`뿐), `/dev/typing-lab`, 예문 목록·타이핑·결과·오류 UI
- 미확인으로 남은 것: Task 004 수동(선택) `suppressEnter` 수정 후 macOS 한글 IME 실입력 재확인, Task 003의 다크 모드·스크린샷 시각 확인
- Task 007 산출물: 판정 토큰 `--typing-*` 7종(`globals.css`), 더미 데이터 `src/lib/mock/passages.ts`(Task 011에서 제거), 임시 미리보기 `/dev/typing-tokens`(Task 018에서 제거)
- Task 008 산출물: `src/lib/passages/filter.ts` 구현(`parseFilter`, `filterPassages`, `sortPassages`, `getNextPassageId`, `buildFilterQuery`), `src/app/_components/`의 `passage-card.tsx`·`passage-filters.tsx`·`passage-browser.tsx`·`passage-list-skeleton.tsx`, 홈(`/`)과 `loading.tsx` 통합(더미 데이터는 Task 011에서 노션 데이터로 교체), 개발 전용 `/dev/passage-list`(Task 018에서 제거)
- Task 009 산출물: `src/app/passages/[id]/_components/`의 `line-chars.tsx`·`typing-board.tsx`·`typing-stats.tsx`·`result-view.tsx`·`typing-screen.tsx`·`passage-screen.tsx`·`dummy-states.ts`(Task 014에서 `useTypingSession`으로 대체), `PassageErrorState`에 `description` prop 추가, `/passages/[id]` 정적 화면(더미), 개발 전용 `/dev/typing-ui`(Task 018에서 제거)
- Task 010 산출물: `src/lib/typing/{normalize,judge,metrics,truncate}.ts` 구현(`normalizeLine`, `toCodePoints`, `judgeLine`, `isLineComplete`, `accumulateStats`, `computeMetrics`, `truncateToLine`, 스텁의 `eslint-disable` 제거), 개발 전용 `/dev/typing-lab`(`cases.ts` 45케이스, `_components/lab-results.tsx`, `page.tsx`, Task 018에서 제거). `typed` 0 정확도 기본값 100으로 확정
- Task 011 이후는 모두 미착수

## 결정 기록 (Task 002, 004, 005에서 채움)

| # | 항목 (PRD 10장) | 현재안/권장안 | 결정 | 결정 Task |
|---|----------------|-------------|------|----------|
| D1 | `server-only` 패키지 도입 (10-6) | 도입. `src/lib/notion/*`와 서버 래퍼 첫 줄에 `import "server-only"` | 확정: 도입(`server-only@0.0.1` 정확 고정 설치) | 002 |
| D2 | 환경 변수 이름 (10-6) | `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID` (`NEXT_PUBLIC_` 금지), 로컬은 `.env` | 확정: 권장안 그대로 (D12로 `NOTION_LINES_DATA_SOURCE_ID` 추가) | 002 |
| D3 | `@notionhq/client` 버전 (10-2) | 설치 시점 최신 안정 버전을 `^` 없이 정확히 고정, API 버전은 SDK 기본값(`2025-09-03`) | 확정: `5.27.0` 정확 고정, 기본 API 버전 `2025-09-03`(`Client.js`의 `defaultNotionVersion`으로 확인) | 002 |
| D4 | 순수 함수 검증 방식 | Vitest 미도입. 개발 전용 `/dev/typing-lab` 페이지 + Playwright MCP로 검증 | 확정 | 002 |
| D5 | 한글 타수 기준 (10-3) | 음절 기준 유지 | 확정: 음절 기준 | 002 |
| D6 | 결과 뷰 위치 (10-4) | 타이핑 화면 내 상태, 새로고침 시 결과 미유지 | 확정: 타이핑 화면 내 상태, 새로고침 시 미유지 | 002 |
| D7 | 다음 예문 순서 (10-5) | URL 필터 쿼리로 다시 계산한 목록의 다음 항목(분류 → 순서 → 제목) | 확정: 권장안 그대로 | 002 |
| D8 | 조합 중 불일치 경고 (10-7) | MVP 제외, 선택 기능으로 분리 | 확정: MVP 제외(Task 021로 분리) | 002 |
| D9 | 줄 최대 길이 제한 (10-9), 빈 줄 Enter (10-10) | 제한 없음(입력 줄 줄바꿈 허용), 빈 줄은 건너뜀 | 확정: 길이 제한 없음, 빈 줄은 건너뜀 | 002 |
| D10 | 입력 요소 제어 방식 (10-1b, 1c) | 스파이크 결과로 controlled/uncontrolled 확정 | 확정: controlled 유지 + 조합 중 `value` 미변경 규칙(onChange 값을 그대로 setState). 근거(Chrome·macOS 실측, 2026-10-05): 조합 중 `value`를 바꾸면 자모가 합쳐지지 않고 키마다 `compositionstart`가 새로 시작해 조합이 깨진다. 변경하지 않으면 controlled·uncontrolled의 이벤트 순서와 값이 동일하며 글자 중복/누락이 없다. 줄 일치 판정은 `compositionend` 시점의 `e.currentTarget.value`로 한다 | 004 |
| D11 | 재검증 실패 시 기존 캐시 유지 여부 (10-1a) | 스파이크 결과로 확정, 미유지 시 대응책 기록 | 확정: **미유지**. 프로덕션(`next start`) 실측(2026-10-05): stale 30·revalidate 30·expire 600에서 토큰을 틀리게 하고 30초 경과 후 새로고침하면 이전 데이터가 아니라 오류가 나고, 오류는 캐시되지 않아 매 요청 노션을 재호출하며 토글 해제 즉시 복구된다. 또한 `use cache` 경계를 지난 오류는 `APIResponseError`가 아니라 `digest`만 가진 일반 `Error`가 되어 캐시 밖에서 `isNotionClientError`/`APIErrorCode`로 분류할 수 없다(`unknown`). 대응책(Task 011): (1) 캐시 밖 래퍼가 마지막 성공값(`globalThis`)을 폴백으로 표시 — 단일 프로세스 실측에서 동작 확인, 서버리스 다중 인스턴스에서는 보장 안 됨 (2) 오류 분류는 캐시 함수 안에서 하고 결과 객체(`kind`)로 반환하되 실패 결과가 캐시되지 않도록 하는 방법은 미검증(실패 시 `cacheLife`를 짧게 지정하는 방식을 Task 011에서 실측) | 005 |
| D12 | 노션 DB 구조 (PRD 5장, 10-11) | 단일 DB + 페이지 본문 블록 | 확정: DB 2개 — Passages(예문 속성) + Lines(줄 단위 본문: `Text`, `Passage` 관계, `Line Number`, `Label`). 속성명·select 옵션 값은 영어. 환경 변수 `NOTION_LINES_DATA_SOURCE_ID` 추가 (2026-10-05) | 002 |

## 의존 관계 요약

```
001 ✅ ─> 002(결정) ✅ ─> 003(골격/라우트/cacheComponents) ✅ ─┬─> 004(IME 스파이크) ✅ ─────────┐
                                                         ├─> 005(노션/캐시 스파이크) ✅ ┐    │
                                                         └─> 006(타입/모듈 경계) ✅ ┬─────┼────┤
                                                                                  │     │    │
Phase 2 (UI, 더미)      006 ─> 007(토큰/공통/더미) ─┬─> 008(목록 UI)               │     │    │
                                                    └─> 009(타이핑/결과/오류 UI)   │     │    │
Phase 3 (기능)          006 ─> 010(순수 함수 + /dev/typing-lab) ────────────┐      │     │    │
                        005,006,008 ─> 011(노션 목록) ─┐                    │      │     │    │
                        010,011 ─> 012(노션 본문/파싱) ─┤                    │      │     │    │
                        004,009,010 ─> 013(입력 엔진 훅) ────────────────────┤      │     │    │
                        011,012,013 ─> 014(타이핑 화면 통합) ─> 015(통합 테스트)
Phase 4 (마무리)        015 ─> 016(오류 상태) , 017(접근성/반응형/다크/성능) ─> 018(최종 검증/배포)
선택                    015 이후 019(F011 최근 기록), 020(새로고침 버튼), 021(조합 중 불일치 경고)
```

- **병렬 가능 구간**: Task 004와 005(서로 독립), Phase 2 UI(007~009)와 Task 010(순수 함수), Task 011/012(노션 트랙)와 Task 013(입력 엔진 트랙).
- **조기 검증 원칙**: 가장 위험한 두 영역(한글 IME 이벤트 순서/조합 중 value 변경, 노션 캐시 재검증 동작)은 UI 구현 전 Phase 1에서 스파이크로 확인하고, 결과를 Task 011~013 설계에 반영한다.

## 성공 기준 매핑

| 기준 | 내용 | 1차 검증 Task | 최종 검증 |
|------|------|--------------|----------|
| S1 | 노션 수정 → 5분 재검증 후 반영(stale-while-revalidate) | 005(짧은 주기로 동작 확인), 011, 012 | 018 |
| S2 | 한글 조합 오판정 없음(겹받침/이중모음/빠른 연타 각 5줄) | 004(이벤트 순서), 010(집계 함수), 013 | 015, 018 |
| S3 | 키 입력 → 표시 갱신 100ms 이내(30줄 이상) | 014 | 017, 018 |
| S4 | 토큰이 번들/네트워크 응답에 없음 | 005, 011 | 015, 018 |
| S5 | 예문 선택 → 전체 줄 → 결과 → 다음 예문 무중단(창세기 1장 31줄) | 014 | 015, 018 |
| S6 | 토큰 오류/빈 DB/네트워크 오류 시 안내 화면 | 011, 012 | 016, 018 |
| S7 | 줄 전환과 자동 스크롤, 마지막 줄 Enter 시 결과 진입 | 014 | 015, 018 |

## 개발 단계

### Phase 0: 프로젝트 전환 ✅

- **Task 001: 스타터킷 데모 제거 및 노션 타이핑 연습 프로젝트로 전환** ✅ - 완료 (commit `5b0868c`)
  - ✅ `/components` 쇼케이스 라우트와 hooks-demo 등 스타터 예제 삭제
  - ✅ 홈 화면을 예문 목록 자리표시자(PageHeader + EmptyState)로 교체
  - ✅ siteConfig, package 이름, README, CLAUDE.md를 프로젝트 내용으로 갱신

### Phase 1: 애플리케이션 골격 구축 및 위험 조기 검증 ✅

**목표**: 착수 전 결정 사항을 확정하고, 전체 라우트·타입·모듈 경계를 만든 뒤, 가장 위험한 두 영역(IME, 노션 캐시)을 스파이크로 먼저 검증한다.
**Phase 완료 조건**: 결정 기록 D1~D12 확정, `/`와 `/passages/[id]` 골격이 `cacheComponents: true` 상태에서 `npm run build` 통과, 스파이크 결과 문서화.

- **Task 002: 착수 전 미결 사항 결정 및 개발 환경 준비** ✅
  - 관련: F008, PRD 6장/10장(2, 3, 4, 5, 6, 7, 9, 10)
  - 의존: 001
  - 구현 사항
    - 결정 기록 D1~D9 확정 후 이 문서 표와 PRD 10장에 반영 (D4는 Vitest 미도입으로 확정됨)
    - `@notionhq/client`를 정확한 버전으로 설치(D3), D1 채택 시 `server-only` 설치
    - `.env`에 D2·D12 이름으로 노션 토큰·Passages data source ID·Lines data source ID 등록, `.env.example`(키만, 값 없음) 작성 시 `.gitignore`의 `.env*` 규칙에 `!.env.example` 예외 추가
    - 노션 측 준비(D12): PRD 5장대로 DB 2개 구성 — Passages(`Title`/`Language`/`Category`/`Order`/`Difficulty`/`Tags`/`Enabled`)와 Lines(`Text`/`Passage` 관계/`Line Number`/`Label`), 두 DB 모두 통합(Integration) 연결, "Copy data source ID"로 ID 2개 확보, 검증용 예문 등록(창세기 1장 31줄, 애국가 16줄과 `Label`, 영어 글 1편, 줄이 없는 예문 1편, `Enabled` 해제 예문 1편). 줄은 CSV import 권장
  - 수용 기준
    - [x] D1~D9가 "결정" 열에 기록되고 PRD 10장과 모순이 없다
    - [x] `package.json`에 `@notionhq/client`가 범위 지정자 없이 고정되어 있다
    - [x] 노션 토큰이 커밋 대상 파일 어디에도 없다(`git grep`으로 0건)
    - [x] 검증용 노션 DB 2개(Passages, Lines)와 예문 5종(Lines 행 포함)이 준비되어 있다 (사용자 수동 작업, 2026-10-05 사용자 확인)
    - [x] `npx tsc --noEmit`, `npm run lint` 통과
  - 테스트 체크리스트
    - [x] 정적: `git grep`으로 토큰 문자열 0건, `.env`이 `git status`에 나타나지 않음
    - [x] 노션 API 연결(서버에서 data source 조회 1회 성공)은 Task 005 스파이크의 Playwright MCP 시나리오로 확인한다 (2026-10-05 Task 005에서 확인)
  - 테스트 결과: (2026-10-05) 정적 검증 통과 — `tsc`/`lint` 오류 0건, `git grep` 시크릿·노션 토큰 패턴 0건, `.env` 무시 확인, `@notionhq/client` 5.27.0·`server-only` 0.0.1 정확 고정, SDK 기본 API 버전 2025-09-03 확인. 노션 DB·예문 5종 준비는 사용자가 완료했다고 확인(내용은 직접 검증하지 않음). `.env` 값 등록은 아직 안 되어 있어 노션 실연결은 Task 005에서 확인

- **Task 003: 라우트 구조, 빈 페이지 골격 및 cacheComponents 설정** ✅
  - 관련: F001, F003, F009 (골격), PRD 4장/6장
  - 의존: 002
  - 구현 사항
    - `node_modules/next/dist/docs/`의 caching, `cacheLife`, `cacheTag`, `use-search-params`, `loading` 문서 확인 후 `next.config.ts`에 `cacheComponents: true` 추가
    - `/passages/[id]/page.tsx`(params는 런타임 API이므로 본문을 `<Suspense>` 안에 렌더), `/passages/[id]/loading.tsx`, `/passages/[id]/not-found.tsx` 빈 껍데기 생성
    - `/` 페이지를 서버 컴포넌트 골격 + 클라이언트 필터 영역 자리로 분리(필터 영역은 `useSearchParams` 사용 예정이므로 `<Suspense>` 경계 준비)
    - `siteConfig.nav`를 `[{ title: "예문 목록", href: "/" }]`로 수정, `name` 한국어 표기 여부 결정 반영
    - 결정(2026-10-05): `siteConfig.name`은 한국어로 바꾸지 않고 현재 값 "HKoiKoi Typing Practice"를 유지한다.
    - 디렉터리 생성: `src/types/`, `src/lib/notion/`, `src/lib/typing/`, `src/lib/passages/`, `src/hooks/`, `src/app/_components/`, `src/app/passages/[id]/_components/`
  - 수용 기준
    - [x] `npm run build`가 "URL data outside Suspense" 류 경고/오류 없이 통과한다
    - [x] `/`, `/passages/아무값`이 각각 자리표시자를 렌더하고 헤더 내비가 "예문 목록"을 가리킨다
    - [x] `npx tsc --noEmit`, `npm run lint` 통과
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: `browser_navigate` `/` → `browser_snapshot`에 헤더 내비 "예문 목록"과 자리표시자 존재
    - [x] 정상: `/passages/아무값` → 자리표시자(또는 not-found) 렌더, 레이아웃 깨짐 없음
    - [x] 공통: `browser_console_messages` 오류 0건
    - [x] 엣지: 로고/내비 클릭 → `/`로 복귀
  - 테스트 결과 (2026-10-05):
    - `npx tsc --noEmit`, `npm run lint` 통과(출력 없음). `npm run build` 통과, `/` 정적, `/passages/[id]` 부분 프리렌더(◐)
    - 빌드 중 발견·해결: (1) SiteFooter의 `new Date()`가 cacheComponents 프리렌더 오류 -> `"use cache"` + `cacheLife("days")` 컴포넌트(`CurrentYear`)로 분리, (2) 동적 라우트에서 MainNav `usePathname` 오류(CLIENT_HOOK_DYNAMIC) -> SiteHeader에서 `<Suspense fallback={null}>`로 감쌈
    - curl 대체 검증: `/`·`/passages/abc`·`/passages/한글` 모두 HTTP 200, 자리표시자 문구와 내비 "예문 목록", 로고/내비 `href="/"` 링크 확인
    - Playwright MCP 검증(2026-10-05, `npm run start` 프로덕션 모드): `/`와 `/passages/abc`, `/passages/한글` 스냅샷에서 헤더 내비 "예문 목록"과 자리표시자 렌더 확인. 세 페이지 모두 콘솔 오류·경고 0건. 로고 클릭(`/passages/abc` → `/`), 내비 "예문 목록" 클릭(`/passages/한글` → `/`) 복귀 확인. 모바일(390x844)에서 "메뉴 열기" 시트에 "모바일 내비게이션"과 "예문 목록" 링크 확인
    - 미확인: 스크린샷 기반 시각 확인(레이아웃 깨짐은 접근성 스냅샷 구조로만 판단), 다크 모드, `/passages/[id]`의 loading·not-found 화면(`notFound()` 호출 지점이 없음)

- **Task 004: [스파이크] 한글 IME composition 이벤트 순서와 pendingEnter 검증** ✅
  - 관련: F005, F013, PRD 7.3/7.4/7.5, 리스크 1·2, 10장 1(b)(c)
  - 의존: 003 (라우트만 필요, 006과 병렬 가능)
  - 구현 사항
    - 개발 전용 로그 페이지(예: `src/app/dev/ime-log/page.tsx`, 프로덕션에서는 `notFound()`)에서 `keydown`(key, `isComposing`, `keyCode`), `compositionstart/update/end`, `beforeinput`, `input`, `onChange` 값을 타임스탬프와 함께 기록
    - macOS 한글 IME로 Chrome·Safari·Firefox에서 "닭", "읽", "왜", "의", 빠른 연타, 음절 끝 Enter를 입력해 이벤트 순서표 작성(Safari는 `compositionend`가 Enter keydown보다 먼저, Chrome은 반대인지 확인)
    - 결정(2026-10-05): 앱은 Chrome + macOS에서만 사용하므로 Safari·Firefox 실입력 검증은 범위에서 제외한다. 이벤트 순서표·pendingEnter 확인은 Chrome(macOS 한글 IME)만 대상으로 한다.
    - `pendingEnter` 프로토타입: 조합 중 Enter는 보류 → `compositionend` 직후 확정값으로 판정, 비조합 Enter는 즉시 판정. Chrome에서 Enter 한 번으로 동작하는지 확인(Chrome은 조합 확정 Enter 한 번에 keydown을 두 번 보내므로 두 번째 Enter 무시 규칙 `suppressEnter` 추가)
    - 조합 중 controlled input `value` 변경(잘라내기 등)의 영향과 음절별 `compositionstart/end` 발생 패턴 기록 → D10 결정(controlled 유지 + 조합 중 value 미변경 규칙 / uncontrolled + ref 읽기)
    - 붙여넣기 차단(`onPaste`, `beforeinput`의 `insertFromPaste`)과 `autocomplete/autocorrect/autocapitalize/spellcheck` 끄기 동작 확인
  - 수용 기준
    - [x] Chrome(macOS) 이벤트 순서 요약이 이 Task의 `테스트 결과`와 PRD 10장에 기록되어 있다 (Safari·Firefox는 범위 제외, 위 결정)
    - [x] 프로토타입에서 Chrome 음절 끝 Enter 1회로 줄 전환되고 중복/누락 글자가 없다 (실입력으로 전환 1회·글자 중복/누락 없음 확인. 두 번째 Enter 불일치 오경고는 수정 후 CDP 재현으로만 확인, 실입력 재확인은 아래 선택 항목)
    - [x] D10이 결정 기록에 반영되어 Task 013 설계 입력으로 쓸 수 있다
  - 테스트 체크리스트
    - [x] 정상 (Playwright MCP): `browser_navigate` `/dev/ime-log` → `browser_evaluate`로 영어 `input` 이벤트 디스패치 → 로그에 `input`/`onChange` 값이 입력과 일치
    - [x] 정상 (합성): `browser_evaluate`로 `compositionstart → compositionupdate → compositionend → keydown(Enter)` 순서 디스패치 → pendingEnter 프로토타입이 줄 전환 1회
    - [x] 오류/엣지 (합성): `keydown(Enter, isComposing=true, keyCode=229)` 후 `compositionend` → 보류되었다가 확정값 판정 후 전환 1회(중복 전환 없음). `compositionend`가 Enter보다 먼저 오는 순서(Safari형)도 동일 결과
    - [x] 엣지 (Playwright MCP): `browser_press_key`로 Ctrl+V 붙여넣기 시도 → 입력 값 불변, `spellcheck/autocorrect` 속성 off 확인(`browser_evaluate`)
    - [x] 수동(필수): macOS 한글 IME로 Chrome 실입력. 합성 이벤트는 실제 IME 순서를 대체하지 않는다 (Safari·Firefox는 범위 제외)
    - [ ] 수동(선택): `suppressEnter` 수정 후 macOS 한글 IME 실입력으로 "의" 조합 중 Enter 1회 → `전환 1 / 불일치 0` 재확인
  - 테스트 결과 (2026-10-05):
    - Playwright MCP(Chromium, `npm run dev`) 합성 검증. controlled·uncontrolled 두 입력 모두 동일 결과: 영어 `input` 후 값 "abc"가 로그/onChange와 일치. Chrome형(조합 중 keydown Enter keyCode 229 -> compositionend)은 전환 카운터 +1, keydown preventDefault됨, 종료 후 pendingEnter=false, 입력 비워짐. Safari형(compositionend -> 비조합 Enter)도 +1. 표준 순서(start -> update -> end -> Enter)도 +1. 불일치 줄(조합 중 Enter 후 compositionend)은 전환 0회, pendingEnter 해제. 마지막 Enter 이후 advance 횟수 중복 없음
    - 붙여넣기: 합성 paste 이벤트는 defaultPrevented=true, 실제 `ControlOrMeta+v` 후에도 두 입력 값 불변("닭이" 유지), 로그에 paste 행 기록. 두 입력 모두 `spellcheck=false`, `autocorrect/autocapitalize/autocomplete=off`. 콘솔 오류 0건
    - 빌드: `npm run build` 통과(에이전트 보고). 프로덕션에서 `/dev/ime-log`는 not-found UI가 렌더되고 lab은 노출되지 않지만 cacheComponents 정적 셸 때문에 HTTP 상태는 404가 아니라 200(soft 404). 진짜 404가 필요하면 `proxy.ts`에서 프로덕션 `/dev/*`를 차단하며, Task 018에서 재확인한다
    - macOS 한글 IME + Chrome 실입력 이벤트 순서(사용자 로그, controlled·uncontrolled 동일): 조합 중 keydown은 `isComposing=true, keyCode=229`. 단어 끝 스페이스는 조합을 확정하며 확정 데이터에 공백이 포함된다(`"읽 "`). 단어 안에서 받침이 붙을 수 없는 자음이 오면 그 keydown 안에서 `compositionend`(직전 음절) → `compositionstart`(새 음절)가 1ms 안에 연속 발생한다(예: `닭`+`ㅇ`). 따라서 `compositionstart/end`는 음절마다가 아니라 "단어 끝(스페이스)"과 "받침 불가 자음" 지점에서 발생한다. 조합 중 `input`의 `value`에는 조합 중인 글자가 마지막에 포함된다. 빠른 연타("닭이 읽은")에서도 이벤트 유실·중복 없이 값이 정확했다
    - **Chrome은 조합 확정 Enter 한 번에 keydown을 두 번 보낸다**: `keydown Enter(isComposing=true, 229)` → `compositionupdate/beforeinput/input` → `compositionend`(1~2ms) → `keydown Enter(isComposing=false, 13)`(1.5~2ms 뒤, 이때 입력창 `value`는 이미 비어 있음) → `beforeinput insertLineBreak`. 수정 전 pendingEnter로 실입력하면 첫 Enter가 `compositionend`에서 advance한 뒤 두 번째 Enter(13)가 빈 값을 불일치로 판정해 `전환 1 / 불일치 1(reject)`이 나왔다(controlled·uncontrolled 모두)
    - 수정: `src/lib/typing/pending-enter.ts`에 `suppressEnter`와 `keyup-enter` 이벤트 추가. 보류된 Enter를 `compositionend`에서 판정하면 `suppressEnter`를 켜 다음 비조합 Enter 1개를 무시하고, `keyup`/`compositionstart`/조합 중 Enter에서 해제한다. lab은 무시된 Enter에서 "마지막 Enter 이후 advance 횟수"를 리셋하지 않는다. `tsx` 시나리오 재생 4종(Chrome형·Chrome(mac) 실측형·Safari형·영어) 모두 advance 1 / reject 0, `tsc`·`lint` 통과, lab의 시나리오 재생 버튼도 사용자가 4종 일치 확인
    - 수정 후 재현(Playwright MCP, CDP `Input.imeSetComposition`/`insertText`로 Chromium이 실제 `composition*` 이벤트를 내도록 하고 Enter(229) → 확정 → Enter(13) → keyup 순서를 재현): controlled·uncontrolled 각각 2회 연속 시도에서 `전환 1→2 / 마지막 Enter 이후 advance 1 / 불일치 0`, Enter 후 입력창 비워짐. 이 순서는 macOS IME가 아니라 위 실측 순서를 재현한 것이다
    - D10 근거(E 실험, controlled 조합 중 `value` 강제 변경 토글): "닭"·"읽" 입력 시 자모가 합쳐지지 않고 키마다 `isComposing=false`인 `compositionstart`가 새로 시작하며 `value`가 `""`로 되돌려져 음절이 만들어지지 않았다. 토글을 끈 controlled와 uncontrolled는 B·C·D에서 동일하게 정상 동작했다 -> D10 확정
    - **미확인**: 수정 후 macOS 한글 IME 실입력 재확인(선택 항목), Safari·Firefox(범위 제외), 모바일 IME
  - 비고: `/dev/ime-log`(`src/app/dev/`)와 `src/lib/typing/pending-enter.ts` 프로토타입이 구현되었다. Task 013 설계 입력: (1) 입력은 controlled 유지, 조합 중 `value` 변경 금지 (2) 줄 판정은 `compositionend` 시점의 `e.currentTarget.value` (3) `pending-enter.ts`(`stepPendingEnter`, `suppressEnter`, `keyup-enter`)를 그대로 재사용하고 Enter `onKeyUp`을 reducer에 연결 (4) 조합 중 Enter는 `preventDefault`. 스파이크 코드는 Task 013에서 재사용하거나 Task 018에서 제거

- **Task 005: [스파이크] 노션 SDK 조회와 use cache 재검증 동작 검증** ✅
  - 관련: F008, S1, S4, PRD 6장, 10장 1(a)
  - 의존: 002, 003 (004와 병렬 가능)
  - 구현 사항
    - `src/lib/notion/client.ts`(서버 전용, D1 반영)에서 환경 변수 검증 후 Client 생성, `dataSources.query` + `filter_properties` + `collectPaginatedAPI`로 목록 원본 조회
    - Lines data source에서 `Passage` 관계 `contains` 필터 + `Line Number` 오름차순 정렬 쿼리가 동작하는지, `filter_properties`가 프로퍼티 이름과 ID 중 무엇을 받는지 확인(PRD 10장 1(d))
    - `'use cache'` + `cacheLife({ revalidate: 30 })`(스파이크에서는 짧게) + `cacheTag('passages')` 조합으로 stale-while-revalidate 확인: 노션 수정 → 주기 경과 → 새로고침 2회째 반영
    - 재검증 실패 시 기존 캐시 유지 여부 확인: 토큰을 일부러 틀리게 바꾼 뒤 주기 경과 후 새로고침 → 이전 데이터 유지/오류 여부 기록(D11). 미유지 시 대응책(캐시 밖 래퍼에서 transient 처리 등) 기록
    - `use cache` 함수가 실패 시 throw하면 오류 결과가 캐시되지 않음을 확인
    - `next build` 시 목록 프리렌더 중 노션 호출 여부와 빌드 환경 변수 필요성 확인, `.next/`에서 토큰 문자열 검색
  - 수용 기준
    - [x] 재검증 주기 경과 후 두 번째 새로고침에서 노션 변경이 반영됨을 확인했다 (실측은 첫 새로고침에서 이미 반영됨. 아래 테스트 결과 참고)
    - [x] D11 결론과 대응책이 결정 기록에 반영되어 있다
    - [x] `.next/` 산출물과 브라우저 네트워크 응답에서 토큰 문자열 0건(S4 1차)
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: `browser_navigate` `/` → `browser_snapshot`으로 노션 행 수와 제목 목록 기록(기준선)
    - [x] 정상(S1): 노션에서 행 추가 또는 제목 수정 → 30초 경과 → `browser_navigate` 새로고침 1회째(이전 데이터) → 2회째(갱신 데이터) 스냅샷 비교
    - [x] 오류(D11): 서버 재기동은 메모리 캐시를 비우므로, 재기동 없이 재검증만 실패시킨다. 스파이크 코드에 개발 전용 스위치(예: 조회 함수가 읽는 임시 플래그 파일 또는 환경 변수 대신 런타임 토글)를 두어 토큰을 틀린 값으로 바꾼 뒤 주기 경과 후 새로고침 → 이전 데이터 유지/오류 화면 중 어느 쪽인지 기록. 이후 스위치 해제와 정상 복구 확인
    - [x] 오류: 처음부터 토큰이 틀린 상태로 기동 → 오류가 던져지고 다음 요청에서 정상 토큰으로 바로 복구되는지(오류가 캐시되지 않음)
    - [x] S4: `browser_network_requests`의 문서/RSC 응답 본문과 `browser_evaluate`로 읽은 `document.documentElement.outerHTML`에서 토큰 문자열 0건, `grep -r`로 `.next/` 0건
    - [x] 엣지: 100건 초과 데이터(임시로 `page_size` 작게 설정)에서도 전체 행이 수집되는지 확인
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: (2026-10-05) `tsc`/`lint` 통과. **기준선**: Passages 4행(`Empty Passage Sample`, `The Road Not Taken`, `창세기 1장`, `애국가`)을 `/dev/notion-cache`에서 조회(`/`는 아직 노션 미연동이라 검증 페이지로 대체). **Lines**: `Passage` relation `contains` 필터와 `Line Number` 오름차순이 동작(10·31·16줄, 빈 예문 0줄, `in_trash` 0건). 단 Lines DB의 본문 프로퍼티가 `Title`이어서 `filter_properties: Text`가 `validation_error`였고, 사용자가 노션에서 `Text`로 변경해 해소. **`filter_properties`**: 이름과 ID 모두 허용(ID로 요청하면 해당 프로퍼티만 응답). **`page_size`**: 1로 줄여도 4행 전부 수집(4회 요청), Lines 31줄은 `page_size=2`로 16회 요청해 전부 수집. **S1(프로덕션)**: 캐시 생성 45초 후 제목 수정 → 첫 새로고침에서 이미 갱신(호출 2→3), 이후 같은 값 유지. 기대한 "1회째 이전/2회째 갱신"과 달리 재조회를 기다린 뒤 응답했고, 1회 측정이라 stale-while-revalidate 여부는 단정하지 않는다. **D11**: 결정 기록 D11 참고(오류 발생·미캐시·즉시 복구·오류 분류 불가·마지막 성공값 폴백 동작). **오류 미캐시**: 틀린 토큰(셸 환경 변수로 덮어씀)으로 기동 시 요청마다 노션 재호출·오류, 정상 토큰으로 재기동한 첫 요청에서 성공. **빌드/S4**: `npm run build` 중 노션 호출 로그 0건, `.env`를 제거하고도 빌드 성공(검증 페이지가 `connection()`으로 동적이기 때문이며 실제 목록 페이지는 Task 011에서 재확인), `.next/`·HTML·RSC 응답·`outerHTML`에서 토큰 0건, 콘솔 오류 0건. 가드 보정: 환경 변수 가드가 빌드 시점에 평가되어 `notFound`가 프리렌더되는 문제를 `connection()` 이후로 옮겨 해결. 미확인: dev 모드 캐시 동작은 참고용이라 결론 근거에서 제외, `browser_network_requests` 대신 `curl`로 문서·RSC 본문 검사
  - 비고: 스파이크 코드(`src/lib/notion/dev-probe.ts`, `src/app/dev/notion-cache/` 전체와 `probe/route.ts`, `NOTION_SPIKE_PROBE`)는 Task 018에서 제거한다. `client.ts`·`passages.ts`·`lines.ts`는 Task 011의 출발점으로 재사용하되 Lines 본문 프로퍼티명(`Text`)과 D11 대응책을 반영한다

- **Task 006: 타입 정의 및 모듈 경계 설계** ✅
  - 관련: F001~F015 공통, PRD 5장/7장
  - 의존: 003
  - 구현 사항
    - `src/types/passage.ts`: `Language`, `Difficulty`, `PassageSummary`, `Passage`, `Line { text; label? }`, `PassageErrorKind`(`'config' | 'transient' | 'notFound' | 'empty'`), `PassageResult<T>`(`{ ok: true; data: T } | { ok: false; kind: PassageErrorKind }`, PRD 5장과 동일), `PassageFilter { category?; lang?; difficulty?; tag? }`
    - `src/types/typing.ts`: `CharState`(`correct | incorrect | incorrectSpace | pending | current | composing | extra`), `LineJudgement`, `TypingStats`, `TypingStatus`(`idle | typing | finished`), `TypingResult`, 보조 타입 `TypingMetrics`(`computeMetrics` 반환용)
    - 순수 함수 시그니처만 먼저 선언(구현은 Task 010): `normalizeLine`·`toCodePoints`(`normalize.ts`), `judgeLine`(`judge.ts`), `accumulateStats(prev, prevConfirmed, nextConfirmed, target)`·`computeMetrics`(`metrics.ts`), `truncateToLine`(`truncate.ts`). 본문은 `throw` 스텁(`declare function`은 `isolatedModules`에서 값 export가 안 되어 쓰지 않음)이며 미사용 매개변수 lint 경고를 막으려 파일마다 `eslint-disable` 한 줄을 두었으므로 구현 Task에서 제거한다
    - 목록 필터/정렬 시그니처: `src/lib/passages/filter.ts`의 `parseFilter(searchParams)`, `filterPassages`, `sortPassages`, `getNextPassageId`
    - 노션 모듈 경계: `src/lib/notion/`(서버 전용: client, 캐시 조회 함수, 매핑) ↔ `src/lib/passages/`(서버 래퍼 `loadPassageSummaries`/`loadPassage` → `PassageResult`) ↔ 페이지. 클라이언트 컴포넌트로는 `PassageSummary[]`/`Passage`만 전달. **미결**: 오류 분류를 캐시 안에서 할지 밖에서 할지는 Task 005 실측(프로덕션 `use cache` 경계를 지난 오류는 `digest`만 가진 `Error`)으로 Task 011 실측 후 확정한다. `load.ts` 주석에 대안과 위험을 적었고 반환 타입 `PassageResult`는 대안과 무관하게 유지된다
  - 수용 기준
    - [x] 모든 타입이 PRD 5장 개념 타입과 1:1로 대응한다
    - [x] `src/lib/typing/`, `src/lib/passages/filter.ts`가 React/Next/노션 SDK를 import하지 않는다
    - [x] `npx tsc --noEmit` 통과
  - 테스트 체크리스트
    - [x] 정적: `npx tsc --noEmit`, `npm run lint` 통과, `grep`으로 순수 모듈의 금지 import 0건
    - [x] 타입과 시그니처만 있고 런타임 로직이 없으므로 Playwright MCP 테스트는 해당 없음
  - 테스트 결과: (2026-10-05) `tsc` 오류 0건, `lint` 경고·오류 0건. `grep`으로 `src/types`, `src/lib/typing`(`pending-enter.ts` 포함), `src/lib/passages/filter.ts`에서 `react`/`next`/`@notionhq`/`server-only` import와 `process.env` 0건, `load.ts` 첫 줄 `import "server-only"`. `git status`에서 `src/lib/notion/*`와 `pending-enter.ts` 무변경(신규 파일 8개, `.gitkeep` 3개 삭제). 결정: `PassageResult`는 PRD의 `ok` 판별 유니온 채택, `enabled`는 `Passage`에서 제외. 결정: `typed` 0일 때 정확도 기본값은 100(Task 010에서 확정). 미결: 오류 분류 위치는 Task 011 실측 후 확정

### Phase 2: UI/UX 완성 (더미 데이터 활용)

**목표**: 노션 연동 없이 더미 데이터로 목록 → 타이핑 → 결과 → 오류 화면 전체 흐름을 눈으로 확인할 수 있게 만든다.
**Phase 완료 조건**: 더미 데이터로 모든 화면 상태(목록/필터 0건/빈 DB/타이핑 각 글자 상태/결과/오류 4종)를 렌더하고, 라이트/다크 양쪽에서 판정 색상 대비 4.5:1 이상.

- **Task 007: 판정 색상 토큰, 공통 컴포넌트 및 더미 데이터 준비** ✅
  - 관련: F004, F009, F010, PRD 8장
  - 의존: 006
  - 구현 사항
    - `src/app/globals.css`의 `:root`/`.dark`와 `@theme inline`에 판정 토큰 추가: `--typing-correct`, `--typing-incorrect`, `--typing-incorrect-space-bg`, `--typing-pending`, `--typing-current`, `--typing-composing`, `--typing-extra`. 대비 4.5:1 이상 확인 후 값 기록
    - shadcn 추가(`npx shadcn@latest add`로만): `progress`, `toggle-group`(필터 UI 방식에 따라 기존 `select`와 택일), 필요 시 `scroll-area`
    - L2 공통: `PassageErrorState`(kind → 문구/아이콘/복구 버튼 매핑, 기존 `EmptyState` 조합), `StatItem`(라벨 + 값 + 단위)
    - 더미 데이터 `src/lib/mock/passages.ts`: 창세기 1장 31줄, 애국가(`Label` `1절`/`후렴`), 영어 글, 각 분류/난이도/태그 조합 10건 이상
  - 수용 기준
    - [x] 판정 토큰 7종의 라이트/다크 대비 측정값이 이 Task의 `테스트 결과`에 기록되고 모두 4.5:1 이상
    - [x] 새 L1 컴포넌트가 모두 shadcn CLI로 추가되었다
    - [x] L2 컴포넌트가 L3/L4를 import하지 않는다
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: 임시 미리보기 화면에서 토큰 7종 렌더 → `browser_emulate_media`로 라이트/다크 전환 후 `browser_take_screenshot`
    - [x] 정상: `browser_evaluate`로 `getComputedStyle` 값을 읽어 대비비 계산 → 7종 모두 4.5:1 이상
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: (2026-10-05) `tsc`/`lint` 통과. 임시 미리보기 `/dev/typing-tokens`(Task 018에서 제거, 프로덕션은 `notFound()`)에서 라이트/다크 스크린샷 확인. 대비비는 `getComputedStyle` 값(브라우저가 lab으로 반환)을 canvas로 sRGB 변환 후 WCAG 공식으로 계산, 전경 6종은 페이지 배경(라이트 #FFFFFF / 다크 #0A0A0A) 대비, `incorrect-space-bg`는 그 위 글자(`foreground`) 대비. 값은 라이트/다크 순이며 모두 4.5:1 이상, 콘솔 오류·경고 0건. 별도 보조 측정: `incorrect` 글자가 `incorrect-space-bg` 위에 놓이면 5.04 / 5.24. 토큰 값은 조정 없이 기존 `globals.css` 그대로 통과
    - `correct` 5.62 / 9.50, `incorrect` 6.16 / 7.38, `incorrect-space-bg`(글자 대비) 16.20 / 13.47, `pending` 4.88 / 6.12, `current` 6.72 / 10.53, `composing` 5.77 / 11.20, `extra` 6.13 / 8.39
    - 참고: 이 세션에서 Playwright MCP 도구를 쓸 수 없어 `playwright-core`(시스템 Chrome, `colorScheme` 에뮬레이션)로 같은 측정을 대체 수행. `incorrect-space-bg` 배경 자체는 페이지 배경 대비 1.22 / 1.41로 보조 표시(배경색)일 뿐이라 글자 대비로 판정

- **Task 008: 예문 목록 페이지 UI 완성 (더미 데이터)** ✅
  - 관련: F001, F002, F009(빈 DB/필터 0건)
  - 의존: 007
  - 구현 사항
    - `src/app/_components/passage-card.tsx`: 제목, 분류, 언어, 난이도, 태그(Badge). 카드 전체가 `/passages/{id}?{현재 필터 쿼리}` 링크, 키보드 포커스 링 유지
    - `src/app/_components/passage-filters.tsx`(클라이언트): 분류/언어/난이도/태그 선택, 결과 수 표시, [조건 초기화], `useSearchParams` + `router.replace`로 `?category=&lang=&difficulty=&tag=` 동기화, `<Suspense>` 안에 배치
    - `src/lib/passages/filter.ts` 구현: `parseFilter`, `filterPassages`, `sortPassages`(분류 → 순서 → 제목), `getNextPassageId` (F007에서 재사용하는 순수 함수)
    - 상태 UI: 빈 DB("노션 DB에 예문 행을 추가하세요"), 필터 결과 0건([조건 초기화]), `/loading.tsx` 카드 스켈레톤
    - 반응형 그리드(모바일 1열 ~ 데스크톱 3열)
  - 수용 기준
    - [x] 필터 변경 시 URL 쿼리가 갱신되고, 쿼리가 있는 URL로 직접 진입해도 같은 필터 상태가 복원된다
    - [x] 결과 수와 [조건 초기화]가 동작하고 0건 상태가 표시된다
    - [x] 키보드만으로 필터 조작과 카드 선택이 가능하다
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: `/` → 더미 데이터 카드 수와 결과 수 표시 일치
    - [x] 정상: 분류/언어/난이도/태그 각각과 조합 선택 → 카드 수 기대값 일치, URL 쿼리 갱신
    - [x] 정상: `/?lang=en&difficulty=Easy` 직접 진입 → 필터 상태 복원
    - [x] 정상: 카드 링크 `href`에 현재 필터 쿼리 포함(`browser_evaluate`)
    - [x] 오류/엣지: 결과 0건 조합 → 0건 안내와 [조건 초기화] 동작, 존재하지 않는 값의 쿼리(`?category=없음`)에서 오류 없이 0건 처리
    - [x] 엣지: `browser_press_key` Tab/Enter만으로 필터 → 카드 선택, `browser_resize` 375px/768px/1280px에서 1열/2열/3열
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: 2026-10-05 Playwright MCP 통과. `/` 카드 12개와 결과 수 12 일치, lang ko 4/en 8, difficulty Easy 4/Medium 3/Hard 3, category 시 2, tag history 2, `?lang=en&difficulty=Easy` 3건과 필터 복원, 카드 href에 필터 쿼리 포함, `?category=성경&difficulty=Easy`·`?category=없음` 0건 안내와 [조건 초기화]로 12건 복귀(쿼리 제거), 잘못된 `?lang=xx`는 무시되어 12건
    - 키보드(Tab/Enter)만으로 필터 조작 후 카드 선택 가능, 375/768/1280px에서 1/2/3열(가로 스크롤 없음), `/dev/passage-list` 빈 DB 안내와 필터 숨김, 콘솔 오류 0건, 라이트/다크 스크린샷 확인, `tsc`·`lint`·`build` 통과

- **Task 009: 타이핑 화면·결과 뷰·오류 화면 정적 UI 완성 (더미 데이터)** ✅
  - 관련: F003, F004, F006, F009(없는 예문/본문 없음), F014
  - 의존: 007
  - 구현 사항
    - `src/app/passages/[id]/_components/`
      - `typing-board.tsx`: 완료 줄(흐리게, 입력 결과 유지) / 현재 줄(강조 + 바로 아래 입력 줄) / 남은 줄로 분리 렌더(완료·남은 줄은 정적 컴포넌트로 분리해 현재 줄만 재렌더되는 구조), 줄 라벨은 작은 Badge
      - `line-chars.tsx`: 글자별 span, `CharState`별 색 + 보조 표시(틀림 취소선/밑줄, 틀린 공백 배경, 현재 위치 커서, 조합 중 점선 밑줄, 초과 표시)
      - `typing-stats.tsx`: 경과 시간, "n / 총 줄 수" + Progress, 타수(음절/분), 정확도(%)
      - `result-view.tsx`: 평균 타수(CPM), 정확도, 연습 시간, WPM, 오타 수, 총 줄 수, [다음 예문] [다시 도전] [목록으로]
    - 하드코딩된 `CharState` 배열로 모든 글자 상태와 "줄이 일치하지 않습니다" 강조 효과를 미리보기
    - 오류 화면: `PassageErrorState`로 notFound("목록으로"), empty("노션 Lines DB에 이 예문의 줄을 추가하세요"), config, transient("다시 시도") 렌더
    - 접근성 골격: 숨은 입력창 `aria-label`, 현재 줄 `aria-current="true"`, 줄 완료/결과 영역 `aria-live="polite"`(글자 단위 낭독 없음)
  - 수용 기준
    - [x] 31줄 더미 예문에서 세 줄 상태와 7가지 글자 상태가 색 없이도(흑백 캡처) 구분된다
    - [x] 결과 뷰와 오류 4종이 더미 상태 전환으로 확인 가능하다
    - [x] 모바일 폭(375px)에서 긴 줄이 줄바꿈되고 레이아웃이 깨지지 않는다
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: 31줄 더미 예문 렌더 → `browser_snapshot`에서 줄 31개, 현재 줄 `aria-current="true"` 1개, 입력창 `aria-label` 존재
    - [x] 정상: 더미 상태 전환으로 결과 뷰와 오류 4종 렌더, 각 문구와 복구 버튼 존재
    - [x] 정상: 글자 상태 7종 → 흑백(`browser_emulate_media` forced-colors 또는 CSS grayscale 주입)에서도 보조 표시(밑줄/취소선/배경)로 구분되는 스크린샷
    - [x] 엣지: `browser_resize` 375px에서 긴 줄 줄바꿈, 가로 스크롤 없음(`document.documentElement.scrollWidth <= innerWidth`)
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: 2026-10-05 Playwright MCP 통과. `/passages/mock-genesis-1` 줄 31개, `aria-current="true"` 1개, 입력창 `aria-label="타이핑 입력"`, 375px에서 scrollWidth 360 ≤ innerWidth 375, 콘솔 오류 0건
    - `/dev/typing-ui` 전환: 불일치("줄이 일치하지 않습니다" role=alert), 초과 입력, 결과 뷰(지표 6종 + 버튼 3개), 오류 4종(notFound "예문 목록으로", empty "노션 Lines DB에 이 예문의 줄을 추가하세요", config, transient "다시 시도") 확인. grayscale(1) 주입 스크린샷에서 완료 줄(✓)·현재 줄(테두리+입력 줄)·남은 줄 구분, 글자 상태는 밑줄/취소선/배경/굵기로 구분
    - `tsc`·`lint`·`build` 통과. empty 문구는 L2 기본값을 유지하고 `PassageErrorState`에 선택 prop `description`을 추가해 호출 측에서 주입

### Phase 3: 핵심 기능 구현

**목표**: 더미 데이터를 노션 실데이터로 교체하고, 판정·지표 순수 함수와 IME 대응 입력 엔진을 구현해 전체 흐름을 완성한다. 노션 트랙(011, 012)과 입력 엔진 트랙(010, 013)은 병렬로 진행할 수 있다.
**Phase 완료 조건**: Task 015 통합 테스트에서 S2, S4, S5, S7 통과, S1·S6 1차 확인.
**테스트 원칙**: Phase 3의 모든 Task는 구현 직후 Playwright MCP로 테스트하고, 통과하기 전에는 다음 Task로 넘어가지 않는다.

- **Task 010: 판정·정규화·지표 계산 순수 함수 구현 및 검증** ✅
  - 관련: F004, F005, F006, F012, F015, PRD 7.1/7.2/7.5/7.6/7.8
  - 의존: 006 (Phase 2와 병렬 가능)
  - 구현 사항
    - `src/lib/typing/normalize.ts`: `normalizeLine`(NFC, 탭→공백, 연속 공백 1칸, trim). 라벨은 Lines DB의 `Label` 속성을 쓰므로 괄호 파싱은 없다
    - `src/lib/typing/normalize.ts`의 `toCodePoints`(NFC 후 `Array.from`, Task 006에서 normalize.ts에 선언)를 쓰는 `src/lib/typing/judge.ts`: `judgeLine(target, input, { composing })` → `LineJudgement`(`{ states: CharState[]; matches: boolean }`, Task 006 시그니처)(확정 구간 즉시 판정, 조합 중 마지막 글자는 `composing` 중립, 초과분 `extra`, 틀린 공백 `incorrectSpace`), `isLineComplete`
    - `src/lib/typing/metrics.ts`: `accumulateStats(prev, prevConfirmed, nextConfirmed, target)`(Task 006 시그니처, `prev`는 누적 `TypingStats`) — 이전/새 확정 문자열 차이로 새로 추가·변경된 위치만 입력 수와 오타 수에 더함(같은 위치 같은 글자 중복 집계 금지, 백스페이스 후 재입력은 새 입력, 음절별 `compositionend` 가정 없음), `computeMetrics({ totalChars, typed, mistakes, elapsedMs })` → 정확도/CPM/WPM(0분 나눗셈 방지)
    - `src/lib/typing/truncate.ts`: `truncateToLine(input, target)` — 호출 측에서 조합 중이 아닐 때만 사용
    - 개발 전용 검증 페이지 `src/app/dev/typing-lab/page.tsx`: 아래 케이스 표(입력, 기대값)를 렌더하고 각 케이스의 통과/실패와 전체 요약(`통과 n / 전체 m`)을 표시한다. 프로덕션에서는 `notFound()`. 케이스 데이터는 함수 호출 결과와 기대값을 나란히 보여줘 Playwright로 읽기 쉽게 한다
  - 수용 기준
    - [x] 정규화: 탭·연속 공백·양끝 공백 처리, 줄 앞 `(1절)`·`(Note: …)` 같은 괄호는 본문 글자로 유지
    - [x] 판정: 겹받침(닭, 읽)·이중모음(왜, 의) 조합 중 상태가 `incorrect`로 나오지 않는다, 영어 대소문자·스마트 따옴표는 그대로 비교
    - [x] 집계: "가나" → 백스페이스 → "가다" 입력 시 입력 수 3, 오타 수는 정의대로 계산된다, 같은 확정 문자열 재전달 시 수치 불변
    - [x] 지표: 고정 입력(글자 수, 경과 ms)에 대한 CPM/WPM/정확도가 7.6 식과 일치
    - [x] 함수들이 React/DOM/Next를 import하지 않는다
    - [x] `/dev/typing-lab`의 전체 케이스가 통과한다
  - 테스트 체크리스트 (Playwright MCP, `/dev/typing-lab`)
    - [x] 정상 (정규화): `\t가  나 ` → `가 나`, `(1절) 동해물과` → 변경 없이 본문 유지
    - [x] 정상 (판정): target `닭`, input `닭` → `correct`. target `읽`, 조합 중 input `일`(마지막 글자) → `composing`(`incorrect` 아님). target `왜`, 조합 중 `ㅇ`/`와` 단계 → `composing`
    - [x] 정상 (지표): totalChars 300, elapsedMs 60000 → CPM 300, WPM 60. typed 100, mistakes 5 → 정확도 95%
    - [x] 오류 (판정): target `abc`, input `abd` → 3번째 `incorrect`. target `a b`, input `a  `(틀린 공백 위치) → `incorrectSpace`. 대소문자 `A` vs `a` → `incorrect`. 스마트 따옴표 `’` vs `'` → `incorrect`
    - [x] 오류 (집계): "가나" 확정 → 백스페이스("가") → "가다" 확정 시 입력 수 3, 오타 수 target 대비 계산. 같은 확정 문자열("가다") 재전달 → 수치 불변
    - [x] 엣지: 빈 입력, 입력이 target보다 긴 경우(초과분 `extra`, `truncateToLine` 결과 길이 = target 길이), elapsedMs 0 → CPM/WPM이 `NaN/Infinity`가 아니라 0, typed 0 → 정확도 100 또는 정의한 기본값, 이모지/결합 문자 코드 포인트, NFD로 입력된 한글이 NFC와 동일 판정
    - [x] 엣지: 한 번에 여러 글자가 확정되는 경우(붙여넣기 없이 `compositionend`에서 2글자 이상 갱신) 입력 수가 정확
    - [x] 확인: `browser_evaluate`로 요약 `통과 n / 전체 m`을 읽어 n = m, `browser_console_messages` 오류 0건
    - [x] 정적: `grep`으로 `src/lib/typing/`에 `react`, `next`, DOM 전역 import/사용 0건
  - 테스트 결과: (2026-10-05) `tsc`/`lint` 0건. `grep`으로 `src/lib/typing/{normalize,judge,metrics,truncate}.ts`에서 `react`/`next`/`document`/`window` 사용 0건, `eslint-disable` 제거 확인. `/dev/typing-lab`(개발 서버 `localhost:3000`, Playwright MCP)에서 `browser_evaluate`로 요약 `통과 45 / 전체 45`, 실패 행 0건, 콘솔 오류 0건, 라이트/다크 중 다크 스크린샷 확인. 결정: `typed` 0일 때 정확도 기본값은 **100**(오타가 아직 없음), `elapsedMs` 0 이하/비유한이면 CPM·WPM 0, 정확도는 0~100으로 제한하고 반올림은 표시 계층 책임. `incorrectSpace`는 불일치이면서 target 또는 input 글자가 공백일 때, 초과 입력은 조합 중에도 `extra`가 `composing`보다 우선, 조합 중에는 `matches`가 항상 `false`. `isLineComplete(target, input)`를 `judge.ts`에서 export. `truncateToLine` 결과는 NFC 정규화된다. 미확인: 프로덕션 빌드에서 `/dev/typing-lab`의 `notFound()` 동작은 확인하지 않았다(Task 018에서 `/dev/*`와 함께 재확인), 실제 IME 입력과의 연동은 Task 013·015에서 확인

- **Task 011: 노션 목록 조회·캐싱·오류 분류 구현 및 목록 페이지 연동**
  - 관련: F001, F002, F008, F009, S1, S4, S6
  - 의존: 005, 006, 008
  - 구현 사항
    - `src/lib/notion/passages.ts`(서버 전용): `getPassageSummariesCached()` — `'use cache'`, `cacheLife({ revalidate: 300 })`, `cacheTag('passages')`, `collectPaginatedAPI`로 100건 초과 전부 수집, `filter_properties`로 필요한 프로퍼티만 수신, 실패 시 throw
    - `src/lib/notion/mappers.ts`: 프로퍼티 이름(`Title`/`Language`/`Category`/`Order`/`Difficulty`/`Tags`/`Enabled`) 기반 매핑, `in_trash`만 삭제 판정, 언어 ko/en 외·필수값 누락·타입 불일치 행은 건너뛰고 로그, `Enabled === false` 제외(프로퍼티 없으면 전부 사용), 분류 기본 "기타", 태그 기본 `[]`
    - `src/lib/passages/load.ts`(캐시 밖 래퍼): try/catch로 `PassageResult` 분류 — 환경 변수 누락·`unauthorized`/`restricted_resource`/`object_not_found` → `config`, `rate_limited`/5xx/타임아웃 → `transient`, 0건 → `empty`. `isNotionClientError`/`APIErrorCode`로만 분기(`error.message` 분기 금지)
    - `/` 페이지에서 더미 데이터를 `loadPassageSummaries()` 결과로 교체, `kind`별 `PassageErrorState` 렌더
    - D11 결과에 따른 재검증 실패 대응 적용
  - 수용 기준
    - [ ] 노션 DB의 모든 유효 행이 정렬(분류 → 순서 → 제목)되어 표시되고 `Enabled` 해제 행은 보이지 않는다
    - [ ] 행 하나의 프로퍼티를 깨뜨려도 나머지 목록은 정상 표시된다
    - [ ] 토큰 오류/빈 DB에서 각각 config/empty 안내가 나온다(S6 1차)
    - [ ] 클라이언트 번들·RSC 페이로드에 토큰 없음(S4)
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: `/` → 카드 수가 노션 유효 행 수(검증용 DB 기준 `Enabled` 해제·언어 불일치 제외)와 일치, 정렬이 분류 → 순서 → 제목
    - [ ] 정상: 카드의 분류/언어/난이도/태그 표시가 노션 값과 일치, 분류 없음 → "기타"
    - [ ] 정상: 필터 조합 → 결과 수 일치, URL 쿼리 반영
    - [ ] 오류 (config): `NOTION_TOKEN`을 틀린 값으로 바꿔 재기동 → 설정 오류 안내와 복구 버튼, 빈 화면 아님. 복구 후 정상 확인
    - [ ] 오류 (config): `NOTION_DATA_SOURCE_ID` 삭제/틀림 → 설정 오류 안내
    - [ ] 오류 (empty): 전부 `Enabled` 해제(또는 빈 data source) → 0건 안내("노션 DB에 예문 행을 추가하세요")
    - [ ] 오류 (transient): 노션 도메인 요청 차단/오프라인 상태로 새로고침 → 일시 오류 안내와 [다시 시도], 캐시가 있으면 이전 데이터(D11)
    - [ ] 엣지: 프로퍼티 하나를 깨뜨린 행(`Language` 값 `jp`, `Title` 비움)이 있어도 나머지 행 정상 표시, 서버 로그에 건너뜀 기록
    - [ ] 엣지: 100건 초과 DB에서 전체 행 표시(가능하면 테스트용 DB 또는 `page_size` 축소로 확인)
    - [ ] S4: `browser_network_requests` 응답 본문과 `outerHTML`에 토큰 문자열 0건
    - [ ] 공통: 콘솔 오류 0건
  - 테스트 결과: (미수행)

- **Task 012: 노션 본문 줄(Lines DB) 조회·매핑 및 타이핑 화면 데이터 연동**
  - 관련: F003, F008, F009, F015, S1, S6
  - 의존: 010(정규화 함수), 011(클라이언트·래퍼 패턴)
  - 구현 사항
    - `src/lib/notion/passage-lines.ts`: `getPassageLinesCached(id)` — `'use cache'`, `cacheLife({ revalidate: 300 })`, `cacheTag(\`passage-${id}\`)`(목록 태그 `passages`를 함께 붙일지는 구현 시 결정해 기록), Lines data source를 `Passage` 관계 `contains` 필터 + `Line Number` 오름차순 정렬로 `collectPaginatedAPI` 전부 수집, `filter_properties`로 `Text`/`Line Number`/`Label`만 수신, 실패 시 throw
    - `src/lib/notion/lines-mapper.ts`(순수 함수): 행 → `Line` — `Text`(title) plain text → `normalizeLine`, `Label`(rich_text) plain text → `normalizeLine`(비면 `undefined`). 정규화 후 `Text`가 빈 행, `Line Number`가 빈 행, `in_trash` 행은 건너뛰고 로그. `Line Number` 기준 안정 정렬(중복은 경고 로그 후 응답 순서 유지)
    - 래퍼 `loadPassage(id)`: 캐시된 목록(`loadPassageSummaries`)에서 id를 찾지 못하면 `notFound`(잘못된 ID, `Enabled` 해제 예문 포함), 줄 0개 → `empty`, 나머지 오류 분류는 011과 동일(Lines data source ID 누락·권한 오류도 `config`)
    - `/passages/[id]/page.tsx`: `<Suspense>` 안에서 `params`/`searchParams` 해석 → `loadPassage` → 성공 시 `Passage`만 클라이언트 컴포넌트로 전달, 실패 시 `PassageErrorState`
    - [다음 예문] 계산: 캐시된 목록(`loadPassageSummaries`) + `parseFilter(searchParams)` + `getNextPassageId`로 서버에서 `nextHref` 계산(마지막이면 `/` + 필터 쿼리)
  - 수용 기준
    - [ ] 창세기 1장이 31줄, 애국가 `Label`(`1절`/`후렴`)이 Badge로 분리되어 표시된다
    - [ ] 같은 예문 재진입 시 노션을 다시 호출하지 않는다(서버 로그로 확인)
    - [ ] 없는 ID → notFound 안내, 줄이 없는 예문 → empty 안내(S6 1차)
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: 목록에서 창세기 1장 카드 클릭 → 줄 수 31, 첫 줄·마지막 줄 텍스트가 노션과 일치
    - [ ] 정상: 애국가 → `Label`(`1절`/`후렴`)이 Badge로 분리되고 본문에는 라벨이 없음, 영어 글 → 줄 수와 텍스트 일치
    - [ ] 정상: 필터 쿼리를 가진 채 진입 → `nextHref`가 필터 목록의 다음 항목, 마지막 예문이면 `/` + 필터 쿼리
    - [ ] 정상: 같은 예문 재진입/새로고침 → 서버 로그에 노션 줄 조회 호출 추가 없음
    - [ ] 오류: `/passages/존재하지않는ID` → notFound 안내 + [목록으로] 동작
    - [ ] 오류: Lines 행이 없는 예문 → "노션 Lines DB에 이 예문의 줄을 추가하세요" 안내
    - [ ] 오류: 토큰 틀림/네트워크 차단/Lines DB 통합 연결 해제 → config/transient 안내와 복구 버튼
    - [ ] 엣지: Lines 행을 `Line Number`와 다른 순서로 입력해도(행을 섞어 입력) `Line Number` 순으로 표시
    - [ ] 엣지: `Text`가 빈 행, `Line Number`가 빈 행, `Label`이 빈 행 → 앞의 둘은 줄에서 제외되고 서버 로그에 건너뜀 기록, `Label` 빈 행은 배지 없이 표시
    - [ ] 엣지: 다른 예문에 연결된 Lines 행이 섞이지 않음(`Passage` 관계 필터), 줄이 100개를 넘는 예문(페이지네이션)은 전부 수집됨
    - [ ] S4: 응답 본문에 토큰 0건, 공통: 콘솔 오류 0건
  - 테스트 결과: (미수행)

- **Task 013: IME 대응 타이핑 입력 엔진 훅 구현**
  - 관련: F003, F005, F012, F013, PRD 7.3/7.4/7.5/7.7, S2
  - 의존: 004(D10), 009, 010
  - 구현 사항
    - `src/hooks/use-typing-session.ts`: 상태(`status`, `lineIndex`, `buffer`, `committedPerLine`, `isComposing`, `pendingEnter`, `startedAt`, `acc { typed, mistakes }`)를 reducer로 관리
    - 숨은 input 바인딩: `onChange`로 값 수신, `onCompositionStart/End`로 `isComposing` 추적, `compositionend`에서 확정 문자열로 `accumulateStats` 호출, 조합 중에는 오타/진행도 갱신 금지
    - Enter 처리: `isComposing || keyCode === 229`면 `pendingEnter = true`만 기록, `compositionend` 직후 `isLineComplete`면 전환하고 해제. 비조합 Enter는 즉시 판정, 불일치면 이동하지 않고 shake 신호 발생. 이벤트 순서와 무관하게 Enter 1회로 동작(004 순서표 기준)
    - 입력 제한: 붙여넣기 차단, 줄 길이 초과분은 조합 중이 아닐 때만 `truncateToLine` 적용(조합 중 value 강제 변경 금지), 줄바꿈 문자 미입력, 백스페이스는 현재 줄 안에서만
    - 타이머: 첫 입력 시 `performance.now()` 시작, 마지막 줄 일치 Enter 시 종료 → `status = 'finished'`
    - 제어: Esc/[처음부터]로 전체 초기화, 화면 클릭 시 input 재포커스, 영어는 `onChange`마다 즉시 판정
  - 수용 기준
    - [ ] macOS 한글 IME, Chrome·Safari·Firefox에서 겹받침/이중모음/빠른 연타 각 5줄 오판정 없이 통과(S2)
    - [ ] 조합 중 Enter 1회로 줄 전환, 불일치 Enter는 이동 없이 경고
    - [ ] 붙여넣기 불가, 초과 입력은 조합 확정 후 잘림, 글자 중복/누락 없음
  - 테스트 체크리스트 (Playwright MCP + 수동)
    - [ ] 정상 (영어): 영어 예문 `browser_type`으로 한 줄 입력 → 글자 상태가 correct로 진행, Enter → 다음 줄, 마지막 줄 Enter → `finished`
    - [ ] 정상: 첫 입력 시 타이머 시작(경과 시간 증가), 줄 전환 시 입력 버퍼 비워짐
    - [ ] 오류: 불일치 상태에서 Enter → 줄 이동 없음, "줄이 일치하지 않습니다" 표시. 일부만 입력하고 Enter → 이동 없음
    - [ ] 오류: 틀린 글자 입력 → 틀림 표시 유지, 백스페이스로 수정 후 Enter → 이동
    - [ ] 엣지: 줄 길이 초과 입력 → 잘림(조합 중 아닐 때), 붙여넣기(Ctrl+V, `browser_evaluate`로 paste 이벤트) → 차단, 첫 줄에서 백스페이스 연타 → 이전 줄로 못 돌아감
    - [ ] 엣지: Esc → 입력·타이머·줄 위치 전체 초기화, 빠르게 연타 입력 시 글자 누락/중복 없음
    - [ ] 합성(한글): `browser_evaluate`로 `compositionstart → input(조합 중) → compositionend` 디스패치 → 조합 중에는 오타 수/진행도 불변, 확정 후 갱신. 조합 중 Enter 후 `compositionend` → 전환 1회, `compositionend`가 먼저 오는 순서도 동일 결과
    - [ ] 합성(엣지): 조합 중 초과 입력 → value 강제 변경 없이 "초과" 표시, `compositionend` 이후 잘림
    - [ ] 수동(필수, S2): macOS 한글 IME로 겹받침(닭, 읽)·이중모음(왜, 의)·빠른 연타 각 5줄, Chrome·Safari·Firefox. 결과 표를 이 Task의 `테스트 결과`에 기록
    - [ ] 공통: 콘솔 오류 0건
  - 테스트 결과: (미수행)

- **Task 014: 타이핑 화면 통합 — 실시간 판정, 자동 스크롤, 진행도, 결과/재도전**
  - 관련: F003, F004, F006, F007, F014, S3, S5, S7
  - 의존: 011, 012, 013
  - 구현 사항
    - Task 009 UI에 `useTypingSession` 연결: 현재 줄만 `judgeLine` 재계산·재렌더, 완료/남은 줄은 정적 렌더 유지
    - 자동 스크롤: 줄 전환 시 현재 줄을 본문 영역 세로 중앙 부근으로 `scrollIntoView`, `prefers-reduced-motion`이면 즉시 스크롤, 모바일 가상 키보드에 가리지 않도록 입력 포커스 시 현재 줄 재정렬
    - 실시간 지표: 경과 시간(1초 단위 갱신), "n / 총 줄 수" + Progress, 타수(음절/분)·정확도를 `computeMetrics`로 표시
    - 결과 뷰: `status === 'finished'`에서 `computeMetrics` 결과 표시, `aria-live`로 결과 안내, [다음 예문] → `nextHref`, [다시 도전] → 입력·타이머·줄 위치 초기화, [목록으로] → `/` + 필터 쿼리
    - 줄 완료 시 `aria-live`로 "n번째 줄 완료" 안내
  - 수용 기준
    - [ ] 31줄 예문에서 현재 줄이 항상 화면 안에 보이고 마지막 줄 Enter 시 결과 뷰 진입(S7)
    - [ ] 목록 → 창세기 1장 완주 → 결과 → 다음 예문까지 막힘 없음(S5)
    - [ ] DevTools Performance에서 키 입력 → 표시 갱신 100ms 이내(S3 1차)
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: 영어 예문 전체 줄 입력 → 결과 뷰에 정확도/소요 시간/타수/WPM/오타 수/총 줄 수 표시, 수치가 `/dev/typing-lab` 기대 계산식과 일치
    - [ ] 정상: 줄 전환마다 `browser_evaluate`로 현재 줄 요소의 `getBoundingClientRect()`가 viewport 안(S7), 진행도 "n / 총 줄 수"와 Progress 값 증가
    - [ ] 정상: [다시 도전] → 입력·타이머·줄 위치 초기화, [다음 예문] → `nextHref` 이동, [목록으로] → `/` + 필터 쿼리
    - [ ] 정상: 31줄 창세기 1장 (영어 대체 예문 또는 `browser_evaluate`로 값 주입)으로 완주 → 결과 → 다음 예문(S5)
    - [ ] 오류/엣지: 필터 적용 상태에서 마지막 예문 완주 → [다음 예문]이 목록(`/` + 필터)으로 이동
    - [ ] 엣지: 한 번도 입력하지 않고 새로고침 → 결과 없이 처음 상태, 결과 뷰에서 새로고침 → 같은 예문 타이핑 화면으로 복귀(결과 미유지)
    - [ ] 엣지: 첫 입력 전 경과 시간 0 유지, `prefers-reduced-motion`(`browser_emulate_media`)에서 스크롤이 즉시 이동
    - [ ] 성능(S3 1차): `browser_evaluate`에서 키 입력 이벤트 → 다음 프레임까지 시간을 `performance.now()`로 측정, 30줄 이상 예문에서 100ms 이내
    - [ ] 공통: 콘솔 오류 0건
  - 테스트 결과: (미수행)

- **Task 015: 핵심 기능 통합 테스트**
  - 관련: F001~F010, F012~F015, S1, S2, S4, S5, S6, S7
  - 의존: 014
  - 구현 사항
    - Playwright MCP 전체 사용자 플로우: 목록 → 필터 → 카드 → 전체 줄 입력 → 결과 → 다음 예문/다시 도전/목록으로
    - 오류 시나리오: 토큰 오류, 빈 DB(빈 data source 또는 전부 `Enabled` 해제), 네트워크 오류(노션 도메인 차단 또는 오프라인), 없는 예문 ID, 줄이 없는 예문, 필터 0건
    - 한글 IME 수동 시나리오(S2) Chrome·Safari·Firefox 결과 표 작성
    - S1: 노션 행 추가/본문 수정 → 5분 경과 → 새로고침 2회로 반영 확인
    - S4: `npm run build` 후 `.next/`와 네트워크 응답에서 토큰 검색
  - 수용 기준
    - [ ] S2, S4, S5, S7 통과, S1·S6 시나리오 결과 기록
    - [ ] 발견된 결함은 Phase 4 Task 또는 새 Task로 등록
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: 목록 → 필터(언어/분류) → 카드 → 전체 줄 → 결과 → [다음 예문] → [다시 도전] → [목록으로] 전 구간 무중단
    - [ ] 오류: 토큰 오류 / 빈 DB / 네트워크 오류 / 없는 예문 ID / 줄이 없는 예문 / 필터 0건 각각에서 빈 화면 없이 안내와 복구 버튼, 복구 후 정상 동작
    - [ ] 정상(S1): 노션 수정 → 5분 경과 → 새로고침 1회째 이전 데이터, 2회째 갱신 데이터
    - [ ] 정상(S4): 빌드 산출물과 모든 네트워크 응답에서 토큰 0건
    - [ ] 수동(S2): IME 결과 표(겹받침/이중모음/빠른 연타 × 브라우저 3종)
    - [ ] 엣지: 연속으로 [다시 도전]을 여러 번 눌러도 상태가 누적되지 않음, 뒤로 가기/앞으로 가기에서 필터 상태 유지
    - [ ] 공통: 시나리오별 콘솔 오류 0건, 결과를 이 Task의 `테스트 결과`에 표로 기록
  - 테스트 결과: (미수행)

### Phase 4: 마무리 (오류 상태, 접근성, 다크모드, 최종 검증)

**목표**: 오류/엣지 케이스, 접근성, 다크모드 대비, 성능을 다듬고 S1~S7 전체를 최종 검증한다.
**Phase 완료 조건**: Task 018에서 S1~S7 전 항목 통과 기록.

- **Task 016: 오류·빈 상태와 복구 플로우 완성**
  - 관련: F009, S6
  - 의존: 015
  - 구현 사항
    - 케이스별 문구·버튼 최종화: 설정 오류(토큰/통합 연결/ID 확인 안내), 일시 오류([다시 시도] → `router.refresh()` 후 목록), 예문 0건, 본문 없음, 필터 0건, 없는 예문
    - `src/app/error.tsx`를 예상 밖 오류 전용 최후 방어선으로 정리(`error.message` 분기 금지, `reset` 제공), `/passages/[id]/not-found.tsx` 문구 정리
    - transient 상황에서 캐시된 이전 데이터 폴백 동작을 D11 결론대로 확인
  - 수용 기준
    - [ ] 토큰 오류/빈 DB/네트워크 오류 각각 재현 시 빈 화면 없이 안내와 복구 버튼 표시(S6)
    - [ ] 모든 복구 버튼이 목록 또는 재시도로 이어진다
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: 6개 케이스(config, transient, 예문 0건, 본문 없음, 필터 0건, 없는 예문) 각각 재현 → 문구와 버튼 존재
    - [ ] 정상: 각 복구 버튼 클릭 → 목록 또는 재시도 결과로 이동, 조건 복구 후 정상 표시
    - [ ] 오류: 예상 밖 오류(예: 매핑 단계에서 강제 throw) → `error.tsx` 최후 방어선과 `reset` 동작
    - [ ] 엣지: [다시 시도]를 연타해도 중복 요청/오류 없음, 오류 화면에서 뒤로 가기
    - [ ] 공통: 콘솔 오류 0건(의도한 서버 오류 로그 제외)
  - 테스트 결과: (미수행)

- **Task 017: 접근성·반응형·다크모드 대비·성능 점검**
  - 관련: F010, F014, PRD 8장, S3
  - 의존: 015 (016과 병렬 가능)
  - 구현 사항
    - 다크모드: 판정 토큰 7종과 결과/오류 화면을 라이트/다크에서 대비 측정(4.5:1 이상), `ThemeToggle` 전환 시 깜빡임 없음 확인
    - 접근성: 키보드만으로 목록 → 타이핑 → 결과 버튼 조작, 포커스 링, `aria-current`/`aria-live` 낭독 범위(글자 단위 낭독 없음), 색 외 보조 표시 확인
    - 반응형: 모바일/태블릿/데스크톱, 모바일 가상 키보드 표시 중 현재 줄 가시성
    - 성능: 30줄 이상 예문에서 DevTools Performance로 입력 → 갱신 100ms 이내, React DevTools로 완료/남은 줄 재렌더 없음 확인
  - 수용 기준
    - [ ] 대비 측정표가 이 Task의 `테스트 결과`에 기록되고 모두 4.5:1 이상(F010)
    - [ ] 키보드 단독 E2E 1회 통과
    - [ ] S3 측정값 기록(100ms 이내)
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: `browser_press_key`(Tab/Enter/Esc)만으로 목록 선택 → 타이핑 → 결과 버튼 조작 완주
    - [ ] 정상: `browser_emulate_media`로 라이트/다크 전환 → 화면별 스크린샷, `getComputedStyle`로 토큰 대비 4.5:1 이상 측정
    - [ ] 정상: `browser_resize` 375px/768px/1280px에서 목록·타이핑·결과 레이아웃과 가로 스크롤 없음
    - [ ] 엣지: 테마 토글 후 새로고침 → 선택 유지, 첫 로드 시 잘못된 테마 깜빡임 없음
    - [ ] 엣지: 줄 완료/결과 영역의 `aria-live` 영역 외에 글자 단위 `aria-live` 없음(`browser_snapshot`/`browser_evaluate`로 확인)
    - [ ] 성능: 30줄 이상 예문 입력 → 갱신 시간 측정 100ms 이내(S3)
  - 테스트 결과: (미수행)

- **Task 018: 최종 검증 및 배포 준비**
  - 관련: S1~S7 전체, F008
  - 의존: 016, 017
  - 구현 사항
    - 개발 전용 페이지(`/dev/*`) 제거 또는 프로덕션 비노출 확인
    - README에 노션 설정 가이드 추가: DB 2개 구조(PRD 5장: Passages 속성, Lines의 `Text`/`Passage` 관계/`Line Number`/`Label`), 줄 입력 규칙(행 하나 = 한 줄, CSV import 방법), 환경 변수(D2, D12), data source ID 2개 얻는 법
    - 빌드/배포 환경에 토큰·data source ID 설정(목록 프리렌더 시 노션 호출) 확인, `npm run build && npm run start`로 프로덕션 모드 검증
    - S1~S7 최종 체크리스트 실행 및 결과 기록, PRD 10장 미결 사항 최종 상태 갱신
  - 수용 기준
    - [ ] S1~S7 전 항목 통과 기록
    - [ ] `npx tsc --noEmit`, `npm run lint` 통과
    - [ ] 저장소에 토큰/비밀값 없음
  - 테스트 체크리스트 (Playwright MCP, 프로덕션 모드)
    - [ ] 정상: `npm run build && npm run start` 후 S1~S7 시나리오 순서대로 실행, 항목별 통과 여부 기록
    - [ ] 정상: 전체 플로우 1회(목록 → 완주 → 결과 → 다음 예문)
    - [ ] 오류: 오류 시나리오(토큰 오류, 빈 DB, 네트워크 오류) 재확인
    - [ ] 엣지: `/dev/ime-log`, `/dev/typing-lab` 접근 시 404(또는 제거 확인)
    - [ ] S4: 프로덕션 빌드 산출물과 네트워크 응답에서 토큰 0건, `git grep` 0건
    - [ ] 공통: 콘솔 오류 0건
  - 테스트 결과: (미수행)

### 선택 기능 (MVP 안에서 여유 시, Phase 4 이후)

MVP 필수 Task가 모두 끝난 뒤 착수한다. 각 Task는 독립적이며 실패해도 MVP 동작에 영향을 주지 않아야 한다. 선택 Task도 구현 후 Playwright MCP 테스트를 통과해야 ✅ 처리한다.

- **Task 019: 최근 기록 저장 (F011, 선택)**
  - 의존: 014
  - 구현 사항
    - usehooks-ts `useLocalStorage`로 예문별 최고 WPM/정확도 저장(`TypingResult` 기반), 저장·파싱 실패 시 무시
    - 결과 뷰에 최고 기록 갱신 표시, 목록 카드에 최고 기록 표시(하이드레이션 불일치 없도록 클라이언트 마운트 후 표시)
  - 수용 기준
    - [ ] 새로고침 후에도 카드에 최고 기록이 보인다
    - [ ] localStorage 차단 환경에서도 오류 없이 동작한다
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: 완주 → 결과 뷰에 "최고 기록 갱신" → `/` 카드에 WPM/정확도 표시, 새로고침 후 유지
    - [ ] 정상: 더 낮은 기록으로 재도전 → 최고 기록 유지, 더 높은 기록 → 갱신
    - [ ] 오류: `browser_evaluate`로 localStorage 값을 손상된 JSON으로 주입 → 오류 없이 무시되고 새 기록 저장 가능
    - [ ] 엣지: localStorage 접근 차단(`Storage.prototype.setItem` throw로 대체) → 완주와 결과 표시가 정상, 하이드레이션 경고 없음
    - [ ] 공통: 콘솔 오류 0건
  - 테스트 결과: (미수행)

- **Task 020: 노션 즉시 새로고침 버튼 (F008 선택 항목)**
  - 의존: 011
  - 구현 사항: 서버 액션에서 `updateTag('passages')`(타이핑 화면에서는 `passage-{id}` 포함) 호출, 목록 헤더에 [새로고침] 버튼, 진행 중 상태와 완료 토스트(sonner)
  - 수용 기준
    - [ ] 노션 수정 직후 버튼 클릭으로 5분 대기 없이 반영된다
  - 테스트 체크리스트 (Playwright MCP)
    - [ ] 정상: 노션 행 수정/추가 → [새로고침] 클릭 → 즉시 갱신된 목록, 완료 토스트 표시
    - [ ] 오류: 토큰 오류 상태에서 클릭 → 오류 안내(또는 토스트), 이전 화면 유지
    - [ ] 엣지: 연타 → 진행 중에는 버튼 비활성화, 중복 요청 없음
    - [ ] 공통: 콘솔 오류 0건, 토큰 비노출
  - 테스트 결과: (미수행)

- **Task 021: 조합 중 불일치 경고 (PRD 7.4 선택, D8에서 MVP 제외 시)**
  - 의존: 013
  - 구현 사항: 조합 중 글자의 NFD 자모가 목표 글자 NFD의 접두가 아니면 약한 경고 상태 표시(틀림 색 사용 금지), `judgeLine`에 옵션으로 추가
  - 수용 기준
    - [ ] "닭" 입력 중 "다" 단계는 경고 없음, 다른 자모 입력 시에만 약한 경고
  - 테스트 체크리스트
    - [ ] 정상 (`/dev/typing-lab`): target `닭`, 조합 중 `ㄷ`/`다` → 경고 없음. 조합 중 `ㅂ` → 약한 경고
    - [ ] 엣지: 조합 확정 후에는 경고가 사라지고 일반 판정으로 전환, 경고가 틀림 색을 쓰지 않음
    - [ ] 합성 (Playwright MCP): `compositionupdate` 합성 이벤트로 위 시나리오를 입력 화면에서 재확인
    - [ ] 수동: macOS 한글 IME로 실입력 확인
  - 테스트 결과: (미수행)

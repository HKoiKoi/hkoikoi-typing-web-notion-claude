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

| 용도                     | 도구                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| 페이지 이동, 상태 확인   | `browser_navigate`, `browser_snapshot`, `browser_wait_for`                     |
| 조작                     | `browser_click`, `browser_type`, `browser_press_key`, `browser_select_option`  |
| 값/DOM 검증, 합성 이벤트 | `browser_evaluate`                                                             |
| 네트워크, 토큰 비노출    | `browser_network_requests`, `browser_network_request`                          |
| 오류 감시                | `browser_console_messages`                                                     |
| 반응형, 시각 증거        | `browser_resize`, `browser_take_screenshot`, `browser_emulate_media`(다크모드) |

**공통 검증 (모든 Playwright 테스트에서 확인)**

- `browser_console_messages`에 오류 0건
- `browser_network_requests` 응답 본문에 노션 토큰 문자열 0건
- 화면에 표시된 수치가 기대값과 일치

**노션 오류 재현**: `.env`의 값을 바꾸고 dev 서버를 재기동한다(토큰 틀림, data source ID 틀림, 값 삭제). 테스트가 끝나면 반드시 원래 값으로 복구하고 정상 동작을 한 번 더 확인한다.

**한글 IME 한계**: Playwright로 실제 IME 조합을 재현하기 어렵다. S2는 macOS 실기기 수동 시나리오(Chrome)가 기준이다. `browser_evaluate`로 `compositionstart/update/end`와 `input` 이벤트를 디스패치하는 합성 시나리오는 로직 회귀 확인용 보조 수단이며 수동 결과를 대체하지 않는다.

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
  - 라우트 골격: 홈(`/`)은 `PageHeader` + `Suspense`로 감싼 `PassageListSection`(Task 011에서 노션 연동, Task 008 당시에는 더미 데이터의 `PassageBrowser`). `/passages/[id]`는 `page.tsx`(params를 `Suspense` 안에서 해석), `_components/passage-placeholder.tsx`, `loading.tsx`, `not-found.tsx`
  - 타입과 계약(Task 006, 시그니처만 있고 본문은 `throw` 스텁. `filter.ts`는 Task 008에서 구현 완료): `src/types/passage.ts`, `src/types/typing.ts`, `src/lib/typing/{normalize,judge,metrics,truncate}.ts`(구현 Task 010), `src/lib/passages/load.ts`(구현 Task 011, 012). 스텁 파일마다 있는 `eslint-disable` 한 줄은 구현 Task에서 제거
  - 스파이크 산출물(Task 004, 005): `src/lib/typing/pending-enter.ts`(Task 013에서 재사용), `src/lib/notion/client.ts`·`passages.ts`·`lines.ts`(Task 011의 출발점, Lines 본문 프로퍼티명 `Text`와 D11 대응책 반영 필요), `src/lib/notion/dev-probe.ts`와 개발 전용 라우트 `/dev/ime-log`, `/dev/notion-cache`(+`probe/route.ts`)는 Task 018에서 제거 또는 비노출 확인
- 아직 없는 것: 노션 행 → `PassageSummary`/`Line` 매핑(`mappers.ts`), 판정·필터·정렬·래퍼 실제 구현, `src/hooks/` 내용(`.gitkeep`뿐), `/dev/typing-lab`, 예문 목록·타이핑·결과·오류 UI
- 미확인으로 남은 것: Task 004 수동(선택) `suppressEnter` 수정 후 macOS 한글 IME 실입력 재확인, Task 003의 다크 모드·스크린샷 시각 확인
- Task 007 산출물: 판정 토큰 `--typing-*` 7종(`globals.css`), 더미 데이터 `src/lib/mock/passages.ts`(목록 참조는 Task 011에서 제거, 파일 삭제는 `/dev/typing-ui`가 쓰므로 Task 018), 임시 미리보기 `/dev/typing-tokens`(Task 018에서 제거)
- Task 008 산출물: `src/lib/passages/filter.ts` 구현(`parseFilter`, `filterPassages`, `sortPassages`, `getNextPassageId`, `buildFilterQuery`), `src/app/_components/`의 `passage-card.tsx`·`passage-filters.tsx`·`passage-browser.tsx`·`passage-list-skeleton.tsx`, 홈(`/`)과 `loading.tsx` 통합(더미 데이터는 Task 011에서 노션 데이터로 교체), 개발 전용 `/dev/passage-list`(Task 018에서 제거)
- Task 009 산출물: `src/app/passages/[id]/_components/`의 `line-chars.tsx`·`typing-board.tsx`·`typing-stats.tsx`·`result-view.tsx`·`typing-screen.tsx`·`passage-screen.tsx`·`dummy-states.ts`(Task 014에서 `useTypingSession`으로 대체), `PassageErrorState`에 `description` prop 추가, `/passages/[id]` 정적 화면(더미), 개발 전용 `/dev/typing-ui`(Task 018에서 제거)
- Task 010 산출물: `src/lib/typing/{normalize,judge,metrics,truncate}.ts` 구현(`normalizeLine`, `toCodePoints`, `judgeLine`, `isLineComplete`, `accumulateStats`, `computeMetrics`, `truncateToLine`, 스텁의 `eslint-disable` 제거), 개발 전용 `/dev/typing-lab`(`cases.ts` 45케이스, `_components/lab-results.tsx`, `page.tsx`, Task 018에서 제거). `typed` 0 정확도 기본값 100으로 확정
- Task 011 산출물: `src/lib/notion/mappers.ts`(`toPassageSummary`, `mapPassageRows`), `passages.ts`의 `getPassageSummariesCached`(`stale 30`·`revalidate 300`·`expire 600`, 태그 `passages`), `src/lib/passages/load.ts`의 `loadPassageSummaries`(D11 확정, `loadPassage`는 Task 012 스텁 유지), 홈 연동 `src/app/_components/passage-list-section.tsx`(`connection()`으로 요청 시점 실행)·`passage-retry-button.tsx`(transient [다시 시도]). 스파이크 export(`getPassageRowsCached` 등)는 `/dev/notion-cache`가 쓰므로 유지(Task 018 제거)
- Task 012 산출물: `src/lib/notion/lines-mapper.ts`(`toLine`, `mapLineRows`), `passage-lines.ts`의 `getPassageLinesCached`, `load.ts`의 `loadPassage`(`classifyByProbe` 일반화), `/passages/[id]`의 `PassageScreen` 연동(`nextHref`/`listHref`), `PassageRetryButton`을 `src/components/common/`으로 이동. 더미 `src/lib/mock/passages.ts`는 `/dev/typing-ui`가 쓰므로 유지(삭제는 Task 018). 타이핑 보드는 아직 정적 표시(입력 엔진은 Task 013)
- Task 013 산출물: `src/lib/typing/session.ts`(순수 `sessionReducer`, `createInitialSessionState`, 시간은 이벤트로 주입, `pending-enter.ts` 재사용), `src/hooks/use-typing-session.ts`(`useTypingSession`: `inputProps`, 붙여넣기·드롭·줄바꿈 차단, Esc 초기화, `mismatch`/`shakeKey`, `getElapsedMs`), 개발 전용 `/dev/typing-session`(reducer 케이스 23건과 훅 데모, Task 018 제거 대상). `TypingBoard`의 입력창은 아직 읽기 전용이라 Task 014에서 훅의 `inputProps`로 연결해야 한다
- Task 014 산출물: `src/app/passages/[id]/_components/typing-screen.tsx`(`"use client"`, `useTypingSession` 연결, `finished`에서 `ResultView`, [다시 도전] 뒤 포커스 복구), `typing-board.tsx`(`inputProps`·`shakeKey`·`onBoardClick` 선택 prop, 줄 전환 자동 스크롤과 포커스 복구, 입력 포커스 시 재정렬, 불일치 흔들림은 Web Animations API), `typing-stats.tsx`(1초 틱, `computeMetrics`로 타수·정확도), `result-view.tsx`(`onRetry`), `/dev/typing-ui` 데모는 정적 미리보기를 데모 안으로 이동(`dummy-states.ts`는 데모용 유지, Task 018 제거 대상). 서버 코드 변경 없음
- Task 015 산출물: 코드 변경은 줄 전환 직후 오판 수정뿐(`src/lib/typing/session.ts`의 `lastAdvanceAt`·`STRAY_ENTER_WINDOW_MS`·`repeat` 처리, `use-typing-session.ts`가 `e.repeat` 전달, `/dev/typing-session` 케이스 28건). 나머지는 검증 결과 기록. 이월 항목은 Task 016(HTTP 200 not-found, 결과 뷰 유지)·017(예문 화면의 이전 목록 링크, 스크롤 실기기)·018(S1 stale 순서 재확인)에 추가
- Task 016 산출물: `src/components/common/passage-retry-button.tsx`(`label` prop, `useTransition`으로 재조회 중 비활성화), `passage-error-state.tsx`(config 설명), `src/app/_components/passage-list-section.tsx`·`passages/[id]/_components/passage-screen.tsx`(config·0건·본문 없음에 [다시 확인] 주입), `passages/[id]/not-found.tsx`(`PassageErrorState` 사용), `src/app/error.tsx`(`retry` + [예문 목록으로], `reset` 미사용), `passage-browser.tsx`(도달 불가 분기 제거). 결정: HTTP 200 not-found 허용(`noindex`), 결과 뷰 복원은 `<Activity>` 보존으로 의도된 동작. 이월 항목은 Task 017(숨겨진 목록 화면의 `h1`이 뒤로 가기 후 DOM에 남음, `EmptyState` 제목이 `h3`라 헤딩 레벨이 건너뜀)에 추가
- 다음은 Task 017. Task 018은 016·017 이후

## 결정 기록 (Task 002, 004, 005에서 채움)

| #   | 항목 (PRD 10장)                               | 현재안/권장안                                                                        | 결정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 결정 Task |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| D1  | `server-only` 패키지 도입 (10-6)              | 도입. `src/lib/notion/*`와 서버 래퍼 첫 줄에 `import "server-only"`                  | 확정: 도입(`server-only@0.0.1` 정확 고정 설치)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 002       |
| D2  | 환경 변수 이름 (10-6)                         | `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID` (`NEXT_PUBLIC_` 금지), 로컬은 `.env`         | 확정: 권장안 그대로 (D12로 `NOTION_LINES_DATA_SOURCE_ID` 추가)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 002       |
| D3  | `@notionhq/client` 버전 (10-2)                | 설치 시점 최신 안정 버전을 `^` 없이 정확히 고정, API 버전은 SDK 기본값(`2025-09-03`) | 확정: `5.27.0` 정확 고정, 기본 API 버전 `2025-09-03`(`Client.js`의 `defaultNotionVersion`으로 확인)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 002       |
| D4  | 순수 함수 검증 방식                           | Vitest 미도입. 개발 전용 `/dev/typing-lab` 페이지 + Playwright MCP로 검증            | 확정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 002       |
| D5  | 한글 타수 기준 (10-3)                         | 음절 기준 유지                                                                       | 확정: 음절 기준                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 002       |
| D6  | 결과 뷰 위치 (10-4)                           | 타이핑 화면 내 상태, 새로고침 시 결과 미유지                                         | 확정: 타이핑 화면 내 상태, 새로고침 시 미유지                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 002       |
| D7  | 다음 예문 순서 (10-5)                         | URL 필터 쿼리로 다시 계산한 목록의 다음 항목(분류 → 순서 → 제목)                     | 확정: 권장안 그대로                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 002       |
| D8  | 조합 중 불일치 경고 (10-7)                    | MVP 제외, 선택 기능으로 분리                                                         | 확정: MVP 제외(Task 021로 분리)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 002       |
| D9  | 줄 최대 길이 제한 (10-9), 빈 줄 Enter (10-10) | 제한 없음(입력 줄 줄바꿈 허용), 빈 줄은 건너뜀                                       | 확정: 길이 제한 없음, 빈 줄은 건너뜀                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 002       |
| D10 | 입력 요소 제어 방식 (10-1b, 1c)               | 스파이크 결과로 controlled/uncontrolled 확정                                         | 확정: controlled 유지 + 조합 중 `value` 미변경 규칙(onChange 값을 그대로 setState). 근거(Chrome·macOS 실측, 2026-10-05): 조합 중 `value`를 바꾸면 자모가 합쳐지지 않고 키마다 `compositionstart`가 새로 시작해 조합이 깨진다. 변경하지 않으면 controlled·uncontrolled의 이벤트 순서와 값이 동일하며 글자 중복/누락이 없다. 줄 일치 판정은 `compositionend` 시점의 `e.currentTarget.value`로 한다                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 004       |
| D11 | 재검증 실패 시 기존 캐시 유지 여부 (10-1a)    | 스파이크 결과로 확정, 미유지 시 대응책 기록                                          | 확정: **미유지**. 프로덕션(`next start`) 실측(2026-10-05): stale 30·revalidate 30·expire 600에서 토큰을 틀리게 하고 30초 경과 후 새로고침하면 이전 데이터가 아니라 오류가 나고, 오류는 캐시되지 않아 매 요청 노션을 재호출하며 토글 해제 즉시 복구된다. 또한 `use cache` 경계를 지난 오류는 `APIResponseError`가 아니라 `digest`만 가진 일반 `Error`가 되어 캐시 밖에서 `isNotionClientError`/`APIErrorCode`로 분류할 수 없다(`unknown`). 대응책(Task 011): (1) 캐시 밖 래퍼가 마지막 성공값(`globalThis`)을 폴백으로 표시 — 단일 프로세스 실측에서 동작 확인, 서버리스 다중 인스턴스에서는 보장 안 됨 (2) 오류 분류는 캐시 함수 안에서 하고 결과 객체(`kind`)로 반환하되 실패 결과가 캐시되지 않도록 하는 방법은 미검증(실패 시 `cacheLife`를 짧게 지정하는 방식을 Task 011에서 실측) **Task 011 확정(2026-10-05)**: 시도2 채택 — 캐시 함수는 throw 유지, `loadPassageSummaries`가 환경 변수를 선검사하고 실패 시 캐시 밖에서 `dataSources.retrieve` 사전 점검 1회로 `error.code` 분류(`unauthorized`/`restricted_resource`/`object_not_found` → config, 그 외·사전 점검 성공·네트워크 실패 → transient). 오류는 캐시되지 않아 복구 즉시 반영, 마지막 성공값(`globalThis`) 폴백은 단일 프로세스에서만 보장. 대안 A(캐시 안 분류)는 기준을 이미 충족해 구현·측정하지 않음. **중요**: 홈이 정적 프리렌더되면 오류 화면이 `revalidate 1d`로 박제되므로(환경 변수 누락 빌드로 확인) 섹션에서 `connection()`으로 요청 시점에 실행해야 한다 | 005, 011  |
| D12 | 노션 DB 구조 (PRD 5장, 10-11)                 | 단일 DB + 페이지 본문 블록                                                           | 확정: DB 2개 — Passages(예문 속성) + Lines(줄 단위 본문: `Text`, `Passage` 관계, `Line Number`, `Label`). 속성명·select 옵션 값은 영어. 환경 변수 `NOTION_LINES_DATA_SOURCE_ID` 추가 (2026-10-05)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | 002       |

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
                        011,012,013 ─> 014(타이핑 화면 통합) ✅ ─> 015(통합 테스트)
Phase 4 (마무리)        015 ─> 016(오류 상태) , 017(접근성/반응형/다크/성능) ─> 018(최종 검증/배포)
선택                    015 이후 019(F011 최근 기록), 020(새로고침 버튼), 021(조합 중 불일치 경고)
```

- **병렬 가능 구간**: Task 004와 005(서로 독립), Phase 2 UI(007~009)와 Task 010(순수 함수), Task 011/012(노션 트랙)와 Task 013(입력 엔진 트랙).
- **조기 검증 원칙**: 가장 위험한 두 영역(한글 IME 이벤트 순서/조합 중 value 변경, 노션 캐시 재검증 동작)은 UI 구현 전 Phase 1에서 스파이크로 확인하고, 결과를 Task 011~013 설계에 반영한다.

## 성공 기준 매핑

| 기준 | 내용                                                           | 1차 검증 Task                         | 최종 검증 |
| ---- | -------------------------------------------------------------- | ------------------------------------- | --------- |
| S1   | 노션 수정 → 5분 재검증 후 반영(stale-while-revalidate)         | 005(짧은 주기로 동작 확인), 011, 012  | 018       |
| S2   | 한글 조합 오판정 없음(겹받침/이중모음/빠른 연타 각 5줄)        | 004(이벤트 순서), 010(집계 함수), 013 | 015, 018  |
| S3   | 키 입력 → 표시 갱신 100ms 이내(30줄 이상)                      | 014                                   | 017, 018  |
| S4   | 토큰이 번들/네트워크 응답에 없음                               | 005, 011                              | 015, 018  |
| S5   | 예문 선택 → 전체 줄 → 결과 → 다음 예문 무중단(창세기 1장 31줄) | 014                                   | 015, 018  |
| S6   | 토큰 오류/빈 DB/네트워크 오류 시 안내 화면                     | 011, 012                              | 016, 018  |
| S7   | 줄 전환과 자동 스크롤, 마지막 줄 Enter 시 결과 진입            | 014                                   | 015, 018  |

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
    - macOS 한글 IME로 Chrome에서 "닭", "읽", "왜", "의", 빠른 연타, 음절 끝 Enter를 입력해 이벤트 순서표 작성(Chrome의 `compositionend`와 Enter keydown 순서 확인)
    - 결정(2026-10-05): 앱은 Chrome + macOS에서만 사용하므로 실입력 검증은 Chrome만 대상으로 한다. 이벤트 순서표·pendingEnter 확인은 Chrome(macOS 한글 IME)만 대상으로 한다.
    - `pendingEnter` 프로토타입: 조합 중 Enter는 보류 → `compositionend` 직후 확정값으로 판정, 비조합 Enter는 즉시 판정. Chrome에서 Enter 한 번으로 동작하는지 확인(Chrome은 조합 확정 Enter 한 번에 keydown을 두 번 보내므로 두 번째 Enter 무시 규칙 `suppressEnter` 추가)
    - 조합 중 controlled input `value` 변경(잘라내기 등)의 영향과 음절별 `compositionstart/end` 발생 패턴 기록 → D10 결정(controlled 유지 + 조합 중 value 미변경 규칙 / uncontrolled + ref 읽기)
    - 붙여넣기 차단(`onPaste`, `beforeinput`의 `insertFromPaste`)과 `autocomplete/autocorrect/autocapitalize/spellcheck` 끄기 동작 확인
  - 수용 기준
    - [x] Chrome(macOS) 이벤트 순서 요약이 이 Task의 `테스트 결과`와 PRD 10장에 기록되어 있다
    - [x] 프로토타입에서 Chrome 음절 끝 Enter 1회로 줄 전환되고 중복/누락 글자가 없다 (실입력으로 전환 1회·글자 중복/누락 없음 확인. 두 번째 Enter 불일치 오경고는 수정 후 CDP 재현으로만 확인, 실입력 재확인은 아래 선택 항목)
    - [x] D10이 결정 기록에 반영되어 Task 013 설계 입력으로 쓸 수 있다
  - 테스트 체크리스트
    - [x] 정상 (Playwright MCP): `browser_navigate` `/dev/ime-log` → `browser_evaluate`로 영어 `input` 이벤트 디스패치 → 로그에 `input`/`onChange` 값이 입력과 일치
    - [x] 정상 (합성): `browser_evaluate`로 `compositionstart → compositionupdate → compositionend → keydown(Enter)` 순서 디스패치 → pendingEnter 프로토타입이 줄 전환 1회
    - [x] 오류/엣지 (합성): `keydown(Enter, isComposing=true, keyCode=229)` 후 `compositionend` → 보류되었다가 확정값 판정 후 전환 1회(중복 전환 없음). `compositionend`가 Enter보다 먼저 오는 순서도 동일 결과
    - [x] 엣지 (Playwright MCP): `browser_press_key`로 Ctrl+V 붙여넣기 시도 → 입력 값 불변, `spellcheck/autocorrect` 속성 off 확인(`browser_evaluate`)
    - [x] 수동(필수): macOS 한글 IME로 Chrome 실입력. 합성 이벤트는 실제 IME 순서를 대체하지 않는다
    - [ ] 수동(선택): `suppressEnter` 수정 후 macOS 한글 IME 실입력으로 "의" 조합 중 Enter 1회 → `전환 1 / 불일치 0` 재확인
  - 테스트 결과 (2026-10-05):
    - Playwright MCP(Chromium, `npm run dev`) 합성 검증. controlled·uncontrolled 두 입력 모두 동일 결과: 영어 `input` 후 값 "abc"가 로그/onChange와 일치. Chrome형(조합 중 keydown Enter keyCode 229 -> compositionend)은 전환 카운터 +1, keydown preventDefault됨, 종료 후 pendingEnter=false, 입력 비워짐. `compositionend`가 먼저 오는 순서(compositionend -> 비조합 Enter)도 +1. 표준 순서(start -> update -> end -> Enter)도 +1. 불일치 줄(조합 중 Enter 후 compositionend)은 전환 0회, pendingEnter 해제. 마지막 Enter 이후 advance 횟수 중복 없음
    - 붙여넣기: 합성 paste 이벤트는 defaultPrevented=true, 실제 `ControlOrMeta+v` 후에도 두 입력 값 불변("닭이" 유지), 로그에 paste 행 기록. 두 입력 모두 `spellcheck=false`, `autocorrect/autocapitalize/autocomplete=off`. 콘솔 오류 0건
    - 빌드: `npm run build` 통과(에이전트 보고). 프로덕션에서 `/dev/ime-log`는 not-found UI가 렌더되고 lab은 노출되지 않지만 cacheComponents 정적 셸 때문에 HTTP 상태는 404가 아니라 200(soft 404). 진짜 404가 필요하면 `proxy.ts`에서 프로덕션 `/dev/*`를 차단하며, Task 018에서 재확인한다
    - macOS 한글 IME + Chrome 실입력 이벤트 순서(사용자 로그, controlled·uncontrolled 동일): 조합 중 keydown은 `isComposing=true, keyCode=229`. 단어 끝 스페이스는 조합을 확정하며 확정 데이터에 공백이 포함된다(`"읽 "`). 단어 안에서 받침이 붙을 수 없는 자음이 오면 그 keydown 안에서 `compositionend`(직전 음절) → `compositionstart`(새 음절)가 1ms 안에 연속 발생한다(예: `닭`+`ㅇ`). 따라서 `compositionstart/end`는 음절마다가 아니라 "단어 끝(스페이스)"과 "받침 불가 자음" 지점에서 발생한다. 조합 중 `input`의 `value`에는 조합 중인 글자가 마지막에 포함된다. 빠른 연타("닭이 읽은")에서도 이벤트 유실·중복 없이 값이 정확했다
    - **Chrome은 조합 확정 Enter 한 번에 keydown을 두 번 보낸다**: `keydown Enter(isComposing=true, 229)` → `compositionupdate/beforeinput/input` → `compositionend`(1~2ms) → `keydown Enter(isComposing=false, 13)`(1.5~2ms 뒤, 이때 입력창 `value`는 이미 비어 있음) → `beforeinput insertLineBreak`. 수정 전 pendingEnter로 실입력하면 첫 Enter가 `compositionend`에서 advance한 뒤 두 번째 Enter(13)가 빈 값을 불일치로 판정해 `전환 1 / 불일치 1(reject)`이 나왔다(controlled·uncontrolled 모두)
    - 수정: `src/lib/typing/pending-enter.ts`에 `suppressEnter`와 `keyup-enter` 이벤트 추가. 보류된 Enter를 `compositionend`에서 판정하면 `suppressEnter`를 켜 다음 비조합 Enter 1개를 무시하고, `keyup`/`compositionstart`/조합 중 Enter에서 해제한다. lab은 무시된 Enter에서 "마지막 Enter 이후 advance 횟수"를 리셋하지 않는다. `tsx` 시나리오 재생 4종(Chrome형·Chrome(mac) 실측형·compositionend 선행형·영어) 모두 advance 1 / reject 0, `tsc`·`lint` 통과, lab의 시나리오 재생 버튼도 사용자가 4종 일치 확인
    - 수정 후 재현(Playwright MCP, CDP `Input.imeSetComposition`/`insertText`로 Chromium이 실제 `composition*` 이벤트를 내도록 하고 Enter(229) → 확정 → Enter(13) → keyup 순서를 재현): controlled·uncontrolled 각각 2회 연속 시도에서 `전환 1→2 / 마지막 Enter 이후 advance 1 / 불일치 0`, Enter 후 입력창 비워짐. 이 순서는 macOS IME가 아니라 위 실측 순서를 재현한 것이다
    - D10 근거(E 실험, controlled 조합 중 `value` 강제 변경 토글): "닭"·"읽" 입력 시 자모가 합쳐지지 않고 키마다 `isComposing=false`인 `compositionstart`가 새로 시작하며 `value`가 `""`로 되돌려져 음절이 만들어지지 않았다. 토글을 끈 controlled와 uncontrolled는 B·C·D에서 동일하게 정상 동작했다 -> D10 확정
    - **미확인**: 수정 후 macOS 한글 IME 실입력 재확인(선택 항목), 모바일 IME
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

- **Task 011: 노션 목록 조회·캐싱·오류 분류 구현 및 목록 페이지 연동** ✅
  - 관련: F001, F002, F008, F009, S1, S4, S6
  - 의존: 005, 006, 008
  - 구현 사항
    - `src/lib/notion/passages.ts`(서버 전용): `getPassageSummariesCached()` — `'use cache'`, `cacheLife({ stale: 30, revalidate: 300, expire: 600 })`(프리렌더 제외 하한 준수), `cacheTag('passages')`, `collectPaginatedAPI`로 100건 초과 전부 수집, `filter_properties`로 필요한 프로퍼티만 수신, 실패 시 throw
    - `src/lib/notion/mappers.ts`: 프로퍼티 이름(`Title`/`Language`/`Category`/`Order`/`Difficulty`/`Tags`/`Enabled`) 기반 매핑, `in_trash`만 삭제 판정, 언어 ko/en 외·필수값 누락·타입 불일치 행은 건너뛰고 로그, `Enabled === false` 제외(프로퍼티 없으면 전부 사용), 분류 기본 "기타", 태그 기본 `[]`
    - `src/lib/passages/load.ts`(캐시 밖 래퍼): try/catch로 `PassageResult` 분류 — 환경 변수 누락·`unauthorized`/`restricted_resource`/`object_not_found` → `config`, `rate_limited`/5xx/타임아웃 → `transient`, 0건 → `empty`. `isNotionClientError`/`APIErrorCode`로만 분기(`error.message` 분기 금지)
    - `/` 페이지에서 더미 데이터를 `loadPassageSummaries()` 결과로 교체, `kind`별 `PassageErrorState` 렌더
    - D11 결과에 따른 재검증 실패 대응 적용
  - 수용 기준
    - [x] 노션 DB의 모든 유효 행이 정렬(분류 → 순서 → 제목)되어 표시되고 `Enabled` 해제 행은 보이지 않는다
    - [x] 행 하나의 프로퍼티를 깨뜨려도 나머지 목록은 정상 표시된다
    - [x] 토큰 오류/빈 DB에서 각각 config/empty 안내가 나온다(S6 1차)
    - [x] 클라이언트 번들·RSC 페이로드에 토큰 없음(S4)
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: `/` → 카드 수가 노션 유효 행 수(검증용 DB 기준 `Enabled` 해제·언어 불일치 제외)와 일치, 정렬이 분류 → 순서 → 제목
    - [x] 정상: 카드의 분류/언어/난이도/태그 표시가 노션 값과 일치, 분류 없음 → "기타"
    - [x] 정상: 필터 조합 → 결과 수 일치, URL 쿼리 반영
    - [x] 오류 (config): `NOTION_TOKEN`을 틀린 값으로 바꿔 재기동 → 설정 오류 안내와 복구 버튼, 빈 화면 아님. 복구 후 정상 확인
    - [x] 오류 (config): `NOTION_DATA_SOURCE_ID` 삭제/틀림 → 설정 오류 안내
    - [x] 오류 (empty): 전부 `Enabled` 해제(또는 빈 data source) → 0건 안내("노션 DB에 예문 행을 추가하세요")
    - [x] 오류 (transient): 노션 도메인 요청 차단/오프라인 상태로 새로고침 → 일시 오류 안내와 [다시 시도], 캐시가 있으면 이전 데이터(D11)
    - [x] 엣지: 프로퍼티 하나를 깨뜨린 행(`Language` 값 `jp`, `Title` 비움)이 있어도 나머지 행 정상 표시, 서버 로그에 건너뜀 기록
    - [x] 엣지: 100건 초과 DB에서 전체 행 표시(가능하면 테스트용 DB 또는 `page_size` 축소로 확인)
    - [x] S4: `browser_network_requests` 응답 본문과 `outerHTML`에 토큰 문자열 0건
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: (2026-10-05, `next build && next start`, 노션 실호출, 기준선 Passages 4행) `tsc`/`lint`/`build` 통과. 홈 카드 4개, `?lang=en&difficulty=Medium` → 1개·URL 쿼리 유지·콘솔 오류 0건. **config**: 틀린 토큰(`unauthorized`), 틀린 data source ID(`object_not_found`), 환경 변수 누락 모두 설정 오류 안내, 토글로 틀린 토큰 → 정상 복구 즉시 반영(오류 미캐시). **transient**: 프록시 거부로 노션 차단 시 일시 오류 안내와 [다시 시도] 버튼. 캐시 후 토큰을 틀리게 바꿔도 320초 뒤까지 이전 목록 유지(캐시 stale 또는 마지막 성공값, 둘은 구분하지 못함). **S4**: HTML·RSC 응답·`outerHTML`에서 토큰 0건. **빌드**: 홈이 `◐`(PPR)이라 `.env` 없이도 빌드되며 빌드 중 노션 호출 없음. 발견: 홈을 정적 프리렌더에 두면 오류 화면이 1일 박제되고 빌드 중 노션 오류가 빌드를 실패시켜 `connection()`으로 해결. **노션 데이터 조작 검증(사용자 조작)**: `Empty Passage Sample`의 `Category`를 비우면 '기타'로 표시되고 정렬은 기타 → 애국가 → 창세기 → English Text(분류 한글 순. 4행은 분류가 모두 달라 같은 분류 안의 순서→제목 비교는 미확인), `Enabled` 해제 행은 목록에서 제외(로그 없음), `Language jp`(`reason=invalid-language`)와 `Title` 공백(`reason=empty-title`) 행은 건너뛰고 나머지는 정상 표시하며 서버 로그에는 행 id와 사유 코드만 기록, 유효 행 0건이면 '표시할 예문이 없습니다'와 'DB에 예문 행을 추가하세요' 안내(다시 시도 버튼 없음). 4행 복구 후 카드 4개 확인. **100건 초과**: 실제 100건 초과 DB는 없어 `page_size: 1` 임시 실험으로 대체(4행 전부 수집, 임시 코드 원복과 `git diff` 확인). 관찰: 노션 복구 직후 서버를 재기동한 첫 로드가 빈 화면이었다가 이후 같은 서버에서 정상으로 바뀐 1회가 있었고 원인은 확인하지 못했다(노션 실제 조회 결과는 정상). config 안내에는 복구 버튼이 없다(기본 `action: null`, 설정 변경은 재배포·재기동이 필요해 의도적으로 두지 않음)

- **Task 012: 노션 본문 줄(Lines DB) 조회·매핑 및 타이핑 화면 데이터 연동** ✅
  - 관련: F003, F008, F009, F015, S1, S6
  - 의존: 010(정규화 함수), 011(클라이언트·래퍼 패턴)
  - 구현 사항
    - `src/lib/notion/passage-lines.ts`: `getPassageLinesCached(id)` — `'use cache'`, `cacheLife({ stale: 30, revalidate: 300, expire: 600 })`(프리렌더 제외 하한 때문에 revalidate만 적을 수 없어 Task 011과 같은 값), `cacheTag(\`passage-${id}\`)`와 `passages`를 함께 부착(F008 새로고침 버튼이 `revalidateTag('passages')`한 번으로 목록·모든 줄 캐시를 갱신), Lines data source를`Passage`관계`contains`필터 +`Line Number`오름차순 정렬로`collectPaginatedAPI`전부 수집,`filter_properties`로 `Text`/`Line Number`/`Label`만 수신, 실패 시 throw
    - `src/lib/notion/lines-mapper.ts`(순수 함수): 행 → `Line` — `Text`(title) plain text → `normalizeLine`, `Label`(rich_text) plain text → `normalizeLine`(비면 `undefined`). 정규화 후 `Text`가 빈 행, `Line Number`가 빈 행, `in_trash` 행은 건너뛰고 로그. `Line Number` 기준 안정 정렬(중복은 경고 로그 후 응답 순서 유지)
    - 래퍼 `loadPassage(id)`: 캐시된 목록(`loadPassageSummaries`)에서 id를 찾지 못하면 `notFound`(잘못된 ID, `Enabled` 해제 예문 포함), 줄 0개 → `empty`, 나머지 오류 분류는 011과 동일(Lines data source ID 누락·권한 오류도 `config`)
    - `/passages/[id]/page.tsx`: `<Suspense>` 안에서 `params`/`searchParams` 해석 → `loadPassage` → 성공 시 `Passage`만 클라이언트 컴포넌트로 전달, 실패 시 `PassageErrorState`
    - [다음 예문] 계산: 캐시된 목록(`loadPassageSummaries`) + `parseFilter(searchParams)` + `getNextPassageId`로 서버에서 `nextHref` 계산(마지막이면 `/` + 필터 쿼리)
  - 수용 기준
    - [x] 창세기 1장이 31줄, 애국가 `Label`(`1절`/`후렴`)이 Badge로 분리되어 표시된다
    - [x] 같은 예문 재진입 시 노션을 다시 호출하지 않는다(서버 로그로 확인)
    - [x] 없는 ID → notFound 안내, 줄이 없는 예문 → empty 안내(S6 1차)
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: 목록에서 창세기 1장 카드 클릭 → 줄 수 31, 첫 줄·마지막 줄 텍스트가 노션과 일치
    - [x] 정상: 애국가 → `Label`(`1절`/`후렴`)이 Badge로 분리되고 본문에는 라벨이 없음, 영어 글 → 줄 수와 텍스트 일치
    - [ ] 정상: 필터 쿼리를 가진 채 진입 → `nextHref`가 필터 목록의 다음 항목, 마지막 예문이면 `/` + 필터 쿼리
    - [x] 정상: 같은 예문 재진입/새로고침 → 서버 로그에 노션 줄 조회 호출 추가 없음
    - [x] 오류: `/passages/존재하지않는ID` → notFound 안내 + [목록으로] 동작
    - [x] 오류: Lines 행이 없는 예문 → "노션 Lines DB에 이 예문의 줄을 추가하세요" 안내
    - [ ] 오류: 토큰 틀림/네트워크 차단/Lines DB 통합 연결 해제 → config/transient 안내와 복구 버튼
    - [x] 엣지: Lines 행을 `Line Number`와 다른 순서로 입력해도(행을 섞어 입력) `Line Number` 순으로 표시
    - [x] 엣지: `Text`가 빈 행, `Line Number`가 빈 행, `Label`이 빈 행 → 앞의 둘은 줄에서 제외되고 서버 로그에 건너뜀 기록, `Label` 빈 행은 배지 없이 표시
    - [x] 엣지: 다른 예문에 연결된 Lines 행이 섞이지 않음(`Passage` 관계 필터), 줄이 100개를 넘는 예문(페이지네이션)은 전부 수집됨
    - [x] S4: 응답 본문에 토큰 0건, 공통: 콘솔 오류 0건
  - 테스트 결과: (2026-10-05, `next build && next start -p 3100`, 노션 실호출, 기준선 Passages 4행) `tsc`/`lint`/`build` 통과(`/passages/[id]`는 `◐` PPR, `.env` 존재 상태로 빌드). **정상**: 창세기 1장 31줄, 애국가 16줄(`1절`/`후렴` Badge 분리, 본문에 라벨 없음, Playwright `innerText`로 확인), The Road Not Taken 10줄. **재진입**: 같은 예문을 3회 요청해도 서버 로그의 `[notion] 줄 조회` 증가 없음(4건 최초 조회 후 고정). **오류**: `Empty Passage Sample` → '노션 Lines DB에 이 예문의 줄을 추가하세요'와 [예문 목록으로], 없는 ID(`zzz`, 한글 ID) → 본문에 `NEXT_HTTP_ERROR_FALLBACK;404`와 noindex(스트리밍이라 HTTP 상태는 200). 애국가 페이지 콘솔 오류 0건. **결정**: `cacheTag`에 `passage-<id>`와 `passages` 병행, `cacheLife` stale 30·expire 600 추가, `classifyByProbe(target)` 일반화(lines는 `linesDataSourceId`로 `dataSources.retrieve`), `safeDecode`와 `SearchParamsLike` 어댑터, `PassageScreen`에서 `connection()` 호출(오류 화면 박제 방지), `TypingScreen`의 `nextHref`/`listHref`는 `/dev/typing-ui`가 쓰므로 optional, 예문별 마지막 성공값 Map(`globalThis`)은 단일 프로세스에서만 보장. **깨진 % 인코딩**: `/passages/%E0%A4%A`는 `PassageScreen`에 도달하기 전에 Next 라우터가 평문 500을 반환해 `safeDecode`로는 막을 수 없었다. `src/proxy.ts`(matcher `/passages/:path*`)에서 디코드 실패 경로를 평문 404로 응답하도록 추가해 `%E0%A4%A`와 `%` 모두 404 확인(Task 018 정리 때 유지 여부 재검토). **추가 확인(노션 SDK 직접 조회 대조)**: 창세기 1장 31줄과 첫·마지막 줄 텍스트가 노션과 일치, HTML에서 토큰 0건(`/`, `/passages/[id]`)·`.next/static` 0건. **노션 데이터 조작 검증(사용자 조작, 2026-10-05)**: The Road Not Taken에서 8↔10 `Line Number`를 바꾸자 화면은 `Line Number` 순서 유지, 9번 `Label` 삭제 시 Badge 없이 표시, 7→6 중복 시 `duplicate-line-number` 경고(행 id만)와 응답 순서 유지, `test` 예문의 빈 `Text`(`empty-text`)·`Line Number` 없음(`missing-line-number`) 행은 줄에서 제외되고 로그에 행 id와 사유 코드만 기록(본문·라벨 없음), 유효한 줄이 0개가 되면 empty 안내. `Empty Passage Sample`에 유효한 줄 1개를 추가하면 그 예문만 1줄이고 다른 예문(31·16·10줄)에는 섞이지 않음. 모두 원복 확인. **페이지네이션**: 100줄 초과 예문이 없어 `page_size: 2` 임시 실험(창세기 31줄 전부 수집, 임시 코드 원복과 `git diff` 확인). **config**: 틀린 토큰으로 기동 시 '노션 연결 설정을 확인해 주세요' 안내(관찰: `@notionhq/client` 경고 로그가 응답 헤더 전체를 출력해 서버 로그에 쿠키 값이 남는다, 토큰은 아님). **미확인**: 네트워크 차단(Node `fetch`가 `HTTP(S)_PROXY`를 무시해 차단되지 않음)과 Lines DB 통합 연결 해제의 config/transient 복구(사용자가 연결 해제는 하지 않기로 함), 영어 글 텍스트 대조, 필터 쿼리 `nextHref`(Task 014 이후), 375px 레이아웃

- **Task 013: IME 대응 타이핑 입력 엔진 훅 구현** ✅
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
    - [x] macOS 한글 IME, Chrome에서 겹받침/이중모음/빠른 연타 각 5줄 오판정 없이 통과(S2)
    - [x] 조합 중 Enter 1회로 줄 전환, 불일치 Enter는 이동 없이 경고
    - [x] 붙여넣기 불가, 초과 입력은 조합 확정 후 잘림, 글자 중복/누락 없음
  - 테스트 체크리스트 (Playwright MCP + 수동)
    - [x] 정상 (영어): 영어 예문 `browser_type`으로 한 줄 입력 → 글자 상태가 correct로 진행, Enter → 다음 줄, 마지막 줄 Enter → `finished`
    - [x] 정상: 첫 입력 시 타이머 시작(경과 시간 증가), 줄 전환 시 입력 버퍼 비워짐
    - [x] 오류: 불일치 상태에서 Enter → 줄 이동 없음, "줄이 일치하지 않습니다" 표시. 일부만 입력하고 Enter → 이동 없음
    - [x] 오류: 틀린 글자 입력 → 틀림 표시 유지, 백스페이스로 수정 후 Enter → 이동
    - [x] 엣지: 줄 길이 초과 입력 → 잘림(조합 중 아닐 때), 붙여넣기(Ctrl+V, `browser_evaluate`로 paste 이벤트) → 차단, 첫 줄에서 백스페이스 연타 → 이전 줄로 못 돌아감
    - [x] 엣지: Esc → 입력·타이머·줄 위치 전체 초기화, 빠르게 연타 입력 시 글자 누락/중복 없음
    - [x] 합성(한글): `browser_evaluate`로 `compositionstart → input(조합 중) → compositionend` 디스패치 → 조합 중에는 오타 수/진행도 불변, 확정 후 갱신. 조합 중 Enter 후 `compositionend` → 전환 1회, `compositionend`가 먼저 오는 순서도 동일 결과
    - [x] 합성(엣지): 조합 중 초과 입력 → value 강제 변경 없이 "초과" 표시, `compositionend` 이후 잘림
    - [x] 수동(필수, S2): macOS 한글 IME로 겹받침(닭, 읽)·이중모음(왜, 의)·빠른 연타 각 5줄, Chrome. 결과 표를 이 Task의 `테스트 결과`에 기록
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: (2026-10-05, 개발 서버 `localhost:3000`, Playwright MCP) `tsc`/`lint`/`build` 통과(`/dev/typing-session` 정적 생성). `/dev/typing-session` reducer 케이스 `통과 23 / 전체 23`, 실패 0건, 콘솔 오류 0건. **영어(`pressSequentially`)**: `hello` 입력 시 `typed 5`, 타이머 시작과 경과 시간 증가 확인, `hello worlx` Enter → 줄 유지·`rejectSeq 1`·'줄이 일치하지 않습니다' 표시, 백스페이스+`d` 수정 후 표시 해제와 Enter 전환(buffer 비워짐), 초과 입력 `good dayXYZ` → `good day`로 잘림, `delay 0` 빠른 연타 `hello world` 11글자 누락·중복 없음(DOM value 일치), 첫 줄 백스페이스 6회 후 줄 유지, Esc → `idle`/0줄/0집계 초기화. **붙여넣기**: `paste` 이벤트와 `beforeinput(insertFromPaste)` 모두 `defaultPrevented`, 상태 불변. **한글 합성(`browser_evaluate` 이벤트 디스패치)**: 조합 중 `닭` → `typed` 19 유지·`composing true`, `compositionend` 후 20, 조합 중 Enter(`keyCode 229`) → `pendingEnter true`·전환 없음, `compositionend` 후 `finished` 1회(`committed 3`, `typed 26`), Chrome(mac)형 두 번째 Enter(`keyCode 13`) 무시(`rejectSeq 0`·상태 불변), `compositionend`가 먼저 오는 순서도 Enter 1회로 `finished`, 조합 중 초과 입력 `…왜가나`는 DOM value 강제 변경 없이 유지되다 `compositionend` 후 `…왜`로 잘리고 집계는 잘린 글자만(`typed 26`). **결정**: 줄 판정 상태를 순수 reducer(`src/lib/typing/session.ts`)로 분리해 시간은 이벤트 payload로 주입, `pending-enter.ts` 재사용, `mismatch` 플래그는 reducer가 관리(입력이 바뀌면 해제), 줄 전환 시 `pending`(`suppressEnter`)은 초기화하지 않음, `finished` 이후에는 `reset` 외 이벤트 무시, `TypingBoard`의 입력창은 읽기 전용이라 Task 014에서 훅의 `inputProps`로 교체 필요(데모는 별도 입력창 사용). **수동(S2, 사용자 조작, 2026-10-05)**: Chrome + macOS 한글 IME로 `/dev/typing-session`에서 겹받침(닭, 읽)·이중모음(왜, 의)·빠른 연타를 입력해 모두 통과(사용자 보고, 항목별 수치는 제공되지 않음). **미확인**: 모바일 IME, 프로덕션 `notFound()` 동작은 Task 018에서 재확인

- **Task 014: 타이핑 화면 통합 — 실시간 판정, 자동 스크롤, 진행도, 결과/재도전** ✅
  - 관련: F003, F004, F006, F007, F014, S3, S5, S7
  - 의존: 011, 012, 013
  - 구현 사항
    - Task 009 UI에 `useTypingSession` 연결: 현재 줄만 `judgeLine` 재계산·재렌더, 완료/남은 줄은 정적 렌더 유지
    - 자동 스크롤: 줄 전환 시 현재 줄을 본문 영역 세로 중앙 부근으로 `scrollIntoView`, `prefers-reduced-motion`이면 즉시 스크롤, 모바일 가상 키보드에 가리지 않도록 입력 포커스 시 현재 줄 재정렬
    - 실시간 지표: 경과 시간(1초 단위 갱신), "n / 총 줄 수" + Progress, 타수(음절/분)·정확도를 `computeMetrics`로 표시
    - 결과 뷰: `status === 'finished'`에서 `computeMetrics` 결과 표시, `aria-live`로 결과 안내, [다음 예문] → `nextHref`, [다시 도전] → 입력·타이머·줄 위치 초기화, [목록으로] → `/` + 필터 쿼리
    - 줄 완료 시 `aria-live`로 "n번째 줄 완료" 안내
  - 수용 기준
    - [x] 31줄 예문에서 현재 줄이 항상 화면 안에 보이고 마지막 줄 Enter 시 결과 뷰 진입(S7)
    - [x] 목록 → 창세기 1장 완주 → 결과 → 다음 예문까지 막힘 없음(S5)
    - [ ] DevTools Performance에서 키 입력 → 표시 갱신 100ms 이내(S3 1차) — 프로파일은 찍지 않고 `performance.now()` 측정으로 갈음(테스트 결과 참조)
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: 영어 예문 전체 줄 입력 → 결과 뷰에 정확도/소요 시간/타수/WPM/오타 수/총 줄 수 표시, 수치가 `/dev/typing-lab` 기대 계산식과 일치
    - [x] 정상: 줄 전환마다 `browser_evaluate`로 현재 줄 요소의 `getBoundingClientRect()`가 viewport 안(S7), 진행도 "n / 총 줄 수"와 Progress 값 증가
    - [x] 정상: [다시 도전] → 입력·타이머·줄 위치 초기화, [다음 예문] → `nextHref` 이동, [목록으로] → `/` + 필터 쿼리
    - [x] 정상: 31줄 창세기 1장 (영어 대체 예문 또는 `browser_evaluate`로 값 주입)으로 완주 → 결과 → 다음 예문(S5)
    - [x] 오류/엣지: 필터 적용 상태에서 마지막 예문 완주 → [다음 예문]이 목록(`/` + 필터)으로 이동
    - [x] 엣지: 한 번도 입력하지 않고 새로고침 → 결과 없이 처음 상태, 결과 뷰에서 새로고침 → 같은 예문 타이핑 화면으로 복귀(결과 미유지)
    - [x] 엣지: 첫 입력 전 경과 시간 0 유지, `prefers-reduced-motion`(`browser_emulate_media`)에서 스크롤이 즉시 이동
    - [x] 성능(S3 1차): `browser_evaluate`에서 키 입력 이벤트 → 다음 프레임까지 시간을 `performance.now()`로 측정, 30줄 이상 예문에서 100ms 이내
    - [x] 공통: 콘솔 오류 0건
  - 테스트 결과: (2026-10-05, 개발 서버 `localhost:3000`, Playwright MCP) `tsc`/`lint`/`build` 통과. **영어(The Road Not Taken 10줄)**: 줄마다 현재 줄 rect가 viewport 안, 진행 1/10→10/10, 마지막 줄 Enter에서 결과 뷰(타수 3250·WPM 650·정확도 100%·오타 0·10줄, 연습 시간 6초). 타수·WPM은 경과 시간(약 6.5초)으로 역산한 값과 일치(WPM = 타수/5). 첫 입력 전 경과 시간 00:00·진행 1 / 10 유지. **오타/부분 입력**: 첫 글자를 틀리면 `incorrect` 표시·정확도 97.1%, Enter는 이동 없이 '줄이 일치하지 않습니다', 백스페이스로 고친 뒤 Enter로 이동, 부분 입력 Enter도 이동 없이 메시지, Esc → 00:00·1/10·정확도 100%로 초기화. **다시 도전**: 입력값·줄 위치·타이머 초기화와 입력창 포커스 복구. **링크**: 필터(`?lang=영어&difficulty=Medium`) 상태 마지막 예문 완주 시 [다음 예문]·[목록으로] 모두 `/?difficulty=Medium`(유효하지 않은 `lang` 값은 `parseFilter`가 무시). **새로고침**: 입력 전·결과 뷰에서 모두 결과 없이 처음 상태(D6). **reduced-motion**(`browser_emulate_media`): 전환 두 프레임 뒤 이미 목표 위치(간접 확인). **창세기 1장 31줄(S5·S7)**: 목록 카드 클릭 → 입력 이벤트 주입으로 완주 → 31줄 모두 viewport 안, 결과 뷰(타수 1458·WPM 291.5·정확도 100%·오타 0·31줄, 1분 6초) → [다음 예문]으로 The Road Not Taken 이동. **성능(S3 1차, 개발 서버, 입력 1600회)**: 입력→두 프레임 뒤까지 p50 33.3ms·p95 34.1ms·최대 34.5ms, 줄 전환 Enter 최대 50.4ms(두 프레임 대기 자체가 60Hz에서 약 33ms라 대부분은 측정 바닥). 콘솔 오류 0건. **결정**: `TypingScreen`만 `"use client"`, `TypingBoard`는 `inputProps`를 선택 prop으로 받아 없으면 읽기 전용(`/dev/typing-session` 호환), `TypingStats`가 1초 틱을 내부 state로 소유해 보드 재렌더 방지, 실시간 `totalChars`는 PRD 7.6의 '지금까지의 값'으로 해석해 완료 줄 + 현재 줄 입력분(줄 길이까지)으로 계산, 결과는 전체 줄 글자 수, `/dev/typing-ui`는 정적 미리보기를 데모 안으로 이동, 페이지 진입 시 입력창 자동 포커스는 하지 않음(포커스 시 스크롤 정렬이 첫 화면을 점프시킴, 화면 클릭으로 포커스). **발견·수정한 버그**: (1) 불일치 Enter의 흔들림 효과를 `key={shakeKey}` 리마운트로 구현하자 입력창이 포커스를 잃음 → Web Animations API(`animate()`)로 교체, reduced-motion이면 재생 안 함. (2) 줄이 바뀌면 현재 줄 `li`가 바뀌어 입력창이 다시 마운트되며 포커스를 잃음 → 줄 전환 시 포커스가 `body`에 있으면 입력창에 복구. **참고**: Playwright `pressSequentially`가 `”`를 `"`로 입력해 오판정처럼 보였으나 도구 현상이며 `insertText`로는 일치했다. **미확인**: 실제 한글 IME 입력(줄 전환 시 입력창 재마운트가 IME에 영향이 없는지는 수동 확인 필요), 모바일 가상 키보드 재정렬과 375px 레이아웃, 프로덕션 빌드 성능 측정, DevTools Performance 프로파일, 스크린 리더의 aria-live 낭독, [목록으로] 클릭 이동(href만 확인)

- **Task 015: 핵심 기능 통합 테스트** ✅
  - 관련: F001~F010, F012~F015, S1, S2, S4, S5, S6, S7
  - 의존: 014
  - 구현 사항
    - Playwright MCP 전체 사용자 플로우: 목록 → 필터 → 카드 → 전체 줄 입력 → 결과 → 다음 예문/다시 도전/목록으로
    - 오류 시나리오: 토큰 오류, 빈 DB(빈 data source 또는 전부 `Enabled` 해제), 네트워크 오류(노션 도메인 차단 또는 오프라인), 없는 예문 ID, 줄이 없는 예문, 필터 0건
    - 한글 IME 수동 시나리오(S2) Chrome 결과 표 작성
    - S1: 노션 행 추가/본문 수정 → 5분 경과 → 새로고침 2회로 반영 확인
    - S4: `npm run build` 후 `.next/`와 네트워크 응답에서 토큰 검색
  - 수용 기준
    - [x] S2(Chrome만, 사용자 구두 확인·항목별 표 없음), S4, S5, S7 통과, S1·S6 시나리오 결과 기록 — S1의 "1회째 이전 데이터, 2회째 갱신" 순서는 관찰하지 못함(테스트 결과 참조)
    - [x] 발견된 결함은 Phase 4 Task 또는 새 Task로 등록 (Task 016·017·018에 이월 항목 추가, 줄 전환 직후 오판은 이 Task에서 수정)
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: 목록 → 필터(언어) → 카드 → 전체 줄 → 결과 → [다음 예문] → [다시 도전] → [목록으로] 전 구간 무중단 (분류 필터 단독은 미확인)
    - [x] 오류: 토큰 오류 / 빈 DB / 네트워크 오류 / 없는 예문 ID / 줄이 없는 예문 / 필터 0건 각각에서 빈 화면 없이 안내, 복구 후 정상 동작 (config 안내에는 복구 버튼이 없었음 — D11 의도가 아니라 구현 상태였고 Task 016에서 [다시 확인]을 추가. 토큰·빈 DB·네트워크는 Playwright 연결 끊김으로 `curl` 응답 HTML 기준)
    - [ ] 정상(S1): 노션 수정 → 5분 경과 → 새로고침 1회째 이전 데이터, 2회째 갱신 데이터 — 5분 이내 이전 데이터 유지와 5분 후 갱신은 확인했으나 1회째부터 갱신 데이터가 나와 순서는 미확인
    - [x] 정상(S4): 빌드 산출물과 모든 네트워크 응답에서 토큰 0건
    - [x] 수동(S2): Chrome(macOS) 한글 IME 통과(사용자 구두 확인). Safari·Firefox는 PRD 7.3 제외 범위(commit `bc5b368`)라 미검증, 겹받침/이중모음/빠른 연타별 표는 제출되지 않음
    - [x] 엣지: 연속으로 [다시 도전]을 여러 번 눌러도 상태가 누적되지 않음, 뒤로 가기/앞으로 가기에서 필터 상태 유지
    - [ ] 공통: 시나리오별 콘솔 오류 0건 — Playwright로 확인한 시나리오(T015-1~3)는 0건, 토큰·빈 DB·네트워크 시나리오는 콘솔 미측정
  - 테스트 결과: (2026-10-05, `next build && next start -p 3100`, 노션 실호출, 기준선 Passages 4행) `tsc`/`lint`/`build` 통과. **S4**: 토큰(길이 50)을 `.next/static`·`.next/server`·`.next` 전체·git 추적 파일에서 검색해 모두 0건(값은 출력하지 않음), `/`·`/passages/[id]`의 HTML과 RSC 응답에서 0건, 브라우저에서 노션 도메인 직접 요청 0건, 콘솔 오류 0건. **정상 플로우(S5·S7)**: 언어 필터 `?lang=en` → The Road Not Taken 10줄 완주 → 결과(정확도 100·오타 0·총 줄 수 10, WPM = 타수/5 일치), [다음 예문]·[목록으로] 링크가 `?lang=en` 유지. 창세기 1장 31줄은 줄마다 500ms 대기 시 31줄 모두 현재 줄이 viewport 안(1/31→31/31, 총 줄 수 31). 필터 `ko`의 마지막 예문 완주 후 [다음 예문]은 `/?lang=ko`. **엣지**: [다시 도전] 5회 연속마다 1/10·00:00·타수 0·입력 비움·포커스 복구, 오타 1건을 낸 라운드의 값이 다음 라운드에 누적되지 않음. 뒤로/앞으로 가기에서 `?lang=en`과 필터 값 유지. **비파괴 오류**: 없는 예문 ID → '예문을 찾을 수 없습니다'와 [예문 목록으로](HTTP 200, 스트리밍), `%E0%A4%A` → 404, 줄 없는 예문 → '노션 Lines DB에 이 예문의 줄을 추가하세요'와 목록 링크, 필터 0건(`?lang=ko&difficulty=Easy&category=Sample`) → '조건에 맞는 예문이 없습니다'와 [조건 초기화](클릭 시 `/`). **파괴적 오류(`.env`는 수정하지 않고 서버 기동 시 환경 변수만 덮어씀)**: 틀린 토큰 → 목록·상세 모두 '노션 연결 설정을 확인해 주세요'(로그 `unauthorized -> config`, 복구 버튼 없음), `HTTPS_PROXY=http://127.0.0.1:9` + `NODE_USE_ENV_PROXY=1` → '예문을 불러오지 못했습니다'와 [다시 시도](로그 `unknown -> transient`), 사용자가 Passages `Enabled`를 전부 해제 → 목록은 '표시할 예문이 없습니다 / 노션 DB에 예문 행을 추가하세요', 상세는 not-found. 모두 원복 후 서버 재기동으로 카드 4개와 창세기 본문 표시 확인, `git status` clean. **S1(사용자 노션 조작)**: 제목 `애국가`→`애국가(수정)`은 보고 직후 첫 요청부터 갱신되어(캐시 생성 시각 불명확) 근거로 쓰지 못함. 2차로 `(수정)`→`(수정2)` 변경(19:24:22 보고) 직후 응답은 `(수정)` 유지, 5분 20초 뒤 19:29:50 첫 새로고침과 19:29:57 두 번째 새로고침 모두 `(수정2)`. 5분 이내 유지와 5분 후 반영은 확인, "1회째 이전·2회째 갱신" 순서는 미관찰(Task 018 재확인). **수동(S2, 사용자 조작)**: Chrome + macOS 한글 IME에서 Enter 한 번에 다음 줄 이동은 정상이나, 줄 전환 직후 빈 입력창에서 '줄이 일치하지 않습니다'가 표시되는 오판 보고(애국가 2절). 원인 이벤트 순서는 확정하지 못했고(Playwright 연결 끊김, 실제 IME 재현 불가) 순서와 무관한 방어를 추가: 줄 전환 후 300ms(`STRAY_ENTER_WINDOW_MS`) 안에 빈 입력창으로 오는 비조합 Enter와 `e.repeat` Enter는 판정하지 않음(`src/lib/typing/session.ts`, `use-typing-session.ts`, PRD 7.3 반영). `/dev/typing-session` 케이스 23→28건 `통과 28 / 전체 28`(`tsx`로 reducer 직접 실행), 수정 전 reducer에서는 신규 3건 실패 확인. 재빌드 후 사용자가 수정 확인. **결정**: S2 항목별 표는 받지 못해 구두 확인으로 기록(Task 013 선례), 줄 전환 오판 수정은 요청에 따라 이 Task에서 반영. **발견·이월**: ① 없는 예문·비활성 예문이 HTTP 200으로 응답(Task 012에서 인지, Task 016에서 허용 여부 결정) ② 결과 뷰에서 [목록으로] 후 뒤로 가기를 하면 결과 뷰가 유지됨(D6는 새로고침 기준이라 충돌은 아니나 Task 016·017에서 의도 확인) ③ 예문 화면의 `main`에 이전 목록 링크가 존재(보이지 않는 보존 화면으로 추정, 포커스·스크린리더 영향은 Task 017에서 확인) ④ 줄당 약 32ms로 입력을 주입하면 smooth 스크롤이 따라가지 못해 18~31번 줄이 viewport 밖으로 측정됨(대기를 주면 사라짐, 실제 타이핑 속도에서는 문제 없다고 보나 Task 017 실기기 확인) ⑤ Task 012 기록의 "네트워크 차단 미확인(Node `fetch`가 프록시를 무시)"은 `NODE_USE_ENV_PROXY=1`로 재현 가능하므로 보정. **미확인**: 분류 필터 단독 동작, 토큰·빈 DB·네트워크 시나리오의 콘솔 오류, S1의 stale 순서, Safari·Firefox(PRD 7.3 제외), 겹받침/이중모음/빠른 연타별 수동 표. **운영 메모**: 서버 정리 중 `pkill -f next-server`가 3000번 포트의 다른 `next-server`를 함께 종료했고(개발 서버로 추정) 같은 시점에 Playwright MCP 연결이 끊겨 T015-4는 `curl` 기반으로 확인

### Phase 4: 마무리 (오류 상태, 접근성, 다크모드, 최종 검증)

**목표**: 오류/엣지 케이스, 접근성, 다크모드 대비, 성능을 다듬고 S1~S7 전체를 최종 검증한다.
**Phase 완료 조건**: Task 018에서 S1~S7 전 항목 통과 기록.

- **Task 016: 오류·빈 상태와 복구 플로우 완성 ✅**
  - 관련: F009, S6
  - 의존: 015
  - 구현 사항
    - 케이스별 문구·버튼 최종화: 설정 오류(토큰/통합 연결/ID 확인 안내), 일시 오류([다시 시도] → `router.refresh()` 후 목록), 예문 0건, 본문 없음, 필터 0건, 없는 예문
    - `src/app/error.tsx`를 예상 밖 오류 전용 최후 방어선으로 정리(`error.message` 분기 금지, `retry` 제공·`reset` 미사용 — Next 16.3 `error.md`는 재조회가 필요한 일반 경우 `retry()`를 권장하고 `reset()`은 재조회 없이 상태만 지우는 특수 용도라고 명시, `retry`는 16.3.0부터 stable), `/passages/[id]/not-found.tsx` 문구 정리
    - transient 상황에서 캐시된 이전 데이터 폴백 동작을 D11 결론대로 확인
    - Task 015 이월: 없는 예문·비활성 예문이 HTTP 200으로 응답하는 것을 허용할지 결정(스트리밍 한계, noindex는 있음), 결과 뷰에서 뒤로 가기 시 결과 뷰가 유지되는 동작의 의도 확인, 네트워크 차단 재현은 `NODE_USE_ENV_PROXY=1`과 `HTTPS_PROXY`로 가능(서버 기동 환경 변수만 사용, `.env` 수정 불필요)
  - 수용 기준
    - [x] 토큰 오류/빈 DB/네트워크 오류 각각 재현 시 빈 화면 없이 안내와 복구 버튼 표시(S6) (네트워크 오류는 `curl` 응답 HTML 기준)
    - [x] 모든 복구 버튼이 목록 또는 재시도로 이어진다
  - 테스트 체크리스트 (Playwright MCP)
    - [x] 정상: 6개 케이스(config, transient, 예문 0건, 본문 없음, 필터 0건, 없는 예문) 각각 재현 → 문구와 버튼 존재 (transient는 `curl`)
    - [x] 정상: 각 복구 버튼 클릭 → 목록 또는 재시도 결과로 이동, 조건 복구 후 정상 표시 (transient의 [다시 시도] 복구 성공은 차단 서버가 계속 차단 상태라 미확인)
    - [x] 오류: 예상 밖 오류(예: 매핑 단계에서 강제 throw) → `error.tsx` 최후 방어선과 `retry` 동작 (`reset` 아님, 위 구현 사항 참조)
    - [x] 엣지: [다시 시도]를 연타해도 중복 요청/오류 없음, 오류 화면에서 뒤로 가기 (`router.refresh` 버튼은 연타 시 1건만 처리, `error.tsx`·응답이 빠른 경우는 비활성화되지 않음 — 결과 참조)
    - [x] 공통: 콘솔 오류 0건(의도한 서버 오류 로그 제외) (transient는 `curl`이라 브라우저 콘솔 미확인)
  - 테스트 결과: (2026-10-06, `next build && next start`를 3100(정상)·3101(틀린 토큰)·3102(프록시 차단)에 기동, 노션 실호출, 기준선 Passages 7행) `tsc`/`lint`/`build` 통과. **시나리오 결과**:

    | 시나리오 | 기대 | 실제 | 통과 |
    |---|---|---|---|
    | config(3101, 목록) | 안내와 복구 버튼 | '노션 연결 설정을 확인해 주세요' + 환경 변수 재시작 안내 + [다시 확인], 로그 `unauthorized -> config` | ✅ |
    | config(3101, 상세) | 안내와 복구 버튼 | 같은 문구 + [다시 확인] + [예문 목록으로](`/`) | ✅ |
    | transient(3102, `HTTPS_PROXY=http://127.0.0.1:9` + `NODE_USE_ENV_PROXY=1`) | 안내와 재시도 | 목록·상세 모두 '예문을 불러오지 못했습니다' + [다시 시도], 로그 `unknown -> transient` (`curl` 기준) | ✅ |
    | 예문 0건(사용자가 `Enabled` 전체 해제 후 서버 재기동) | 안내와 복구 버튼 | '표시할 예문이 없습니다 / 노션 DB에 예문 행을 추가하세요. 추가한 예문은 반영까지 몇 분 걸릴 수 있습니다.' + [다시 확인], 카드 0개, 상세는 not-found | ✅ |
    | 본문 없음(Empty Passage Sample) | 안내와 복구 버튼 | '노션 Lines DB에 이 예문의 줄을 추가하세요' + [다시 확인] + [예문 목록으로] | ✅ |
    | 필터 0건(`?lang=ko&difficulty=Easy&category=Sample`) | 안내와 초기화 | '조건에 맞는 예문이 없습니다' + [조건 초기화] 클릭 시 `/`, 카드 7개 | ✅ |
    | 없는 예문(`/passages/not-exist-id`) | 안내와 목록 링크 | '예문을 찾을 수 없습니다' + [예문 목록으로], HTTP 200, `<meta name="robots" content="noindex">`, 깨진 인코딩 `%E0%A4%A`는 404 | ✅ |
    | `error.tsx`(임시 `throw`를 `passage-screen.tsx`에 넣고 빌드, 검증 후 원복) | 최후 방어선 | '문제가 발생했습니다' + [다시 시도] + [예문 목록으로], 목록 이동 후 뒤로 가기로 오류 화면 복귀, 정상 빌드로 바꾼 뒤 [다시 시도] 클릭 시 예문 화면 복구(빌드 ID가 바뀌어 전체 이동으로 처리됨) | ✅ |
    | 결과 뷰 → [목록으로] → 뒤로 가기 | 결과 뷰 유지(의도 확인) | 결과 뷰가 복원되고 포커스는 '연습 결과' 제목, 새로고침하면 입력 화면(D6와 일치) | ✅ |

    **엣지(연타)**: config 화면 [다시 확인]을 50ms 간격으로 8회 눌렀을 때 1건만 처리하고 7건은 비활성화됨('확인 중...'). 반면 예문 0건 화면은 재조회가 50ms 안에 끝나 8건 모두 처리됨(중복 요청이 겹치는 것은 아니고 매번 완료된 요청). `error.tsx`는 `retry()`가 transition이 아니라 `isPending`으로 막을 수 없고, 상태로 막는 방식도 재시도가 50ms 안에 새 오류로 끝나 효과가 없어 단순 `retry`로 되돌림(클릭 8회 → RSC 요청 9건, 겹치는 요청 없음). **콘솔**: 최종 페이지 기준 오류 0건. 세션 누적 오류는 모두 검증 환경 때문(3100번 이전 서버의 정적 chunk 500, 강제 throw의 React #441, 재빌드 중 이전 빌드 ID의 `_rsc` 404). **결정**: ① config와 목록 0건에 [다시 확인]을 추가한다. PRD F009(55행)가 각 케이스에 안내 문구와 복구 버튼을 요구하고, 오류는 캐시되지 않아 복구가 즉시 반영되므로(D11) 재조회가 유효하다. Task 015 기록의 'config는 버튼 없음, D11 의도'는 D11이 캐시 폴백 결정이라 근거가 없는 오기이며 현재 구현은 이를 정정한다. config는 환경 변수 수정 시 서버 재시작이 필요하다는 안내를 설명에 넣었다. ② 없는 예문·비활성 예문의 HTTP 200은 허용한다. Suspense 안에서 `notFound()`를 호출하면 헤더가 이미 전송되어 200이 되는 것이 Next 문서(`loading.md`, `not-found.md`, `streaming.md`)에 명시되어 있고, Next가 `noindex`를 자동 주입하며(실측 확인) 단일 사용자 앱이다. Suspense 밖에서 선검사하면 404가 가능하나 노션 조회가 로딩 UI를 막아 비용이 크다. ③ 결과 뷰 복원은 의도된 동작으로 둔다. `cacheComponents: true`에서 이전 라우트가 `<Activity mode="hidden">`으로 보존되어 상태가 유지되며(`cacheComponents.md`, `preserving-ui-state.md`), D6는 새로고침 기준이라 충돌하지 않는다. ④ `error.tsx`는 `retry` 주 버튼 + [예문 목록으로] 링크로 하고 `reset`은 쓰지 않는다. ⑤ `/passages/[id]/not-found.tsx`는 `PassageErrorState kind="notFound"`로 문구를 단일 소스화했다. ⑥ `passage-browser.tsx`의 `passages.length === 0` 분기는 `loadPassageSummaries`가 0건을 먼저 `empty`로 걸러 도달할 수 없어 제거했다. **변경 파일**: `passage-retry-button.tsx`(`label` prop, `useTransition`으로 재조회 중 비활성화), `passage-error-state.tsx`(config 설명), `passage-list-section.tsx`·`passage-screen.tsx`(config·empty 복구 버튼 주입), `[id]/not-found.tsx`, `error.tsx`, `passage-browser.tsx`. **미확인**: D11 마지막 성공값 폴백의 실제 재현(서버 기동 후 환경을 바꿀 수 없어 코드 경로 확인으로 한정), `retry()` 성공 경로를 같은 빌드에서 재현(복구 확인은 빌드가 바뀐 전체 이동), transient 시나리오의 브라우저 콘솔과 [다시 시도] 복구 성공, 목록 0건에서 행 추가 후 `refresh()` 즉시 반영 여부(캐시 최대 5분), `global-error.tsx` 필요 여부. **운영 메모**: 검증 서버는 `lsof`로 PID를 지정해 종료했고 3000번 포트에는 서버가 없었다. 3100번에 Task 015의 이전 `next-server`(PID 28310)가 남아 있어 새 서버 기동이 `EADDRINUSE`로 실패했고 이전 빌드 결과를 잠시 보고 있었으므로, 검증 전 `lsof`로 포트 점유를 확인한다

- **Task 017: 접근성·반응형·다크모드 대비·성능 점검**
  - 관련: F010, F014, PRD 8장, S3
  - 의존: 015 (016과 병렬 가능)
  - 구현 사항
    - 다크모드: 판정 토큰 7종과 결과/오류 화면을 라이트/다크에서 대비 측정(4.5:1 이상), `ThemeToggle` 전환 시 깜빡임 없음 확인
    - 접근성: 키보드만으로 목록 → 타이핑 → 결과 버튼 조작, 포커스 링, `aria-current`/`aria-live` 낭독 범위(글자 단위 낭독 없음), 색 외 보조 표시 확인
    - 반응형: 모바일/태블릿/데스크톱, 모바일 가상 키보드 표시 중 현재 줄 가시성
    - 성능: 30줄 이상 예문에서 DevTools Performance로 입력 → 갱신 100ms 이내, React DevTools로 완료/남은 줄 재렌더 없음 확인
    - Task 015 이월: 예문 화면 `main` 안에 이전 목록 링크가 존재하는 이유 확인(보존된 숨김 화면이면 포커스·스크린리더에 노출되지 않는지), 실제 타이핑 속도에서 줄 전환마다 smooth 스크롤이 따라가는지 실기기 확인(줄당 약 32ms 주입 시 18~31번 줄이 viewport 밖으로 측정된 사례)
    - Task 016 이월: 결과 뷰에서 [목록으로] 후 뒤로 가기를 하면 숨겨진 목록 화면의 `h1`('예문 목록')이 DOM에 남는다(`<Activity mode="hidden">` 보존 추정) — 숨김 처리되어 포커스·스크린리더에 노출되지 않는지 확인. `EmptyState`의 제목이 `h3`라 페이지에 `h2`가 없으면 헤딩 레벨이 건너뛰므로 영향 범위(필터 0건 등)와 함께 확인. 오류·빈 상태 화면이 재조회 후 바뀔 때 `role="alert"` 또는 포커스 이동 없이 스크린리더에 전달되는지 확인
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
    - Task 016 이월: D11 마지막 성공값 폴백(목록·줄)은 서버 기동 후 환경을 바꿀 수 없어 코드 경로 확인으로 한정했으므로 재현 방법이 있으면 재확인, `retry()` 성공 경로(같은 빌드에서 일시 오류 후 복구)와 transient 시나리오의 브라우저 콘솔·[다시 시도] 복구 성공 확인, 목록 0건에서 행 추가 후 `refresh()` 반영 시점(캐시 최대 5분) 확인, `/dev/*` 제거 후 `passage-error-state.tsx`·`error.tsx` 문구 최종 점검
    - Task 015 이월: S1의 "새로고침 1회째 이전 데이터, 2회째 갱신 데이터" 순서를 정확한 캐시 생성 시각과 노션 수정 시각을 기록해 재확인(015에서는 1회째부터 갱신 데이터가 나옴), S2 겹받침/이중모음/빠른 연타별 수동 표 확보
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

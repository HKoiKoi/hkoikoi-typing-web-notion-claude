# Development Guidelines

> AI Agent 전용 규칙. 프로젝트 고유 규칙만 기술한다. 요구사항 단일 소스는 `docs/PRD.md`, 진행 상태는 `docs/ROADMAP.md`.

## 프로젝트 개요

- 노션 DB의 한국어/영어 여러 줄 예문을 불러와 한 줄씩 따라 치는 **단일 사용자, 로그인 없음, 노션 읽기 전용** 타이핑 웹앱
- 스택: Next.js 16.3.8 (App Router) · React 19.2.8 · React Compiler · TypeScript · Tailwind CSS v4 · shadcn/ui(`radix-nova`) · next-themes · usehooks-ts · `@notionhq/client`(Task 002에서 설치, 정확한 버전 고정)
- 용어: 노션 DB 한 행 = **예문(Passage)**, 예문의 한 단위 = **줄(Line)**
- **Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 먼저 읽는다.** 학습 데이터의 Next.js 지식을 신뢰하지 않는다.

## 프로젝트 아키텍처

### 컴포넌트 4계층 (import 단방향: 상위 → 하위만 허용)

| 계층 | 경로 | 규칙 |
|---|---|---|
| L1 | `src/components/ui/` | shadcn 전용. **`npx shadcn@latest add <name>`으로만 추가** |
| L2 | `src/components/common/` | 2개 이상 페이지가 쓰는 공통 조합. L3/L4 import 금지 |
| L3 | `src/components/layout/` | SiteHeader/SiteFooter/MainNav/MobileNav. L4 import 금지 |
| L4 | `src/app/` | layout/page/loading/error/not-found + 페이지 전용 `_components/` |

- ✅ `src/components/common/page-header.tsx`가 `@/components/ui/button` import
- ❌ `src/components/ui/*`가 `@/components/common/*` import
- ❌ `src/components/common/*`가 `@/components/layout/*` 또는 `@/app/*` import
- 한 페이지에서만 쓰는 컴포넌트 → 해당 라우트의 private 폴더: `src/app/_components/`, `src/app/passages/[id]/_components/` (예: `PassageCard`, `TypingBoard`, `LineChars`, `ResultView`)
- 두 페이지 이상이 쓰는 컴포넌트 → L2로 승격 (예: `PassageErrorState`, `StatItem`)
- 기존 L2 재사용 우선: `Container`, `EmptyState`(icon/title/description/action), `PageHeader`, `Logo`, `ThemeToggle`, `ThemeProvider`. **같은 역할의 컴포넌트를 새로 만들지 않는다.**

### 로직 위치

| 종류 | 경로 | 제약 |
|---|---|---|
| 노션 접근 (서버 전용) | `src/lib/notion/` | 첫 줄 `import "server-only"`(결정 D1 확정 후). 클라이언트 컴포넌트에서 import 금지 |
| 서버 래퍼 (`PassageResult` 반환) | `src/lib/passages/load.ts` | 캐시 밖에서 try/catch로 오류 분류 |
| 필터/정렬 순수 함수 | `src/lib/passages/filter.ts` | React/Next/노션 SDK import 금지 |
| 타이핑 순수 함수 | `src/lib/typing/` (`normalize.ts`, `judge.ts`, `metrics.ts`, `truncate.ts`) | React/Next/DOM 전역/노션 SDK 사용 금지 |
| 타입 | `src/types/passage.ts`, `src/types/typing.ts` | PRD 5장 개념 타입과 1:1 |
| 훅 | `src/hooks/` | 만들기 전에 usehooks-ts에 있는지 확인 |
| 개발 전용 검증 코드 | (없음) | `src/app/dev/*`, `src/lib/mock/`, `src/lib/notion/dev-probe.ts`는 Task 018에서 제거했다. 임시 검증용 라우트·더미 데이터를 다시 두면 같은 Task 안에서 지운다 |

- 경로 alias `@/*` → `src/*` 만 사용한다. 상대경로로 `src/` 밖을 가리키지 않는다.

## 코드 표준

- 문서, UI 문구, 주석 모두 **한국어**. 영어 UI 문구 금지 (예외: 코드 식별자)
- 파일명 kebab-case (`passage-card.tsx`), 컴포넌트명 PascalCase, 훅은 `use-` 접두사 파일명
- **React Compiler 활성화**: `useMemo`/`useCallback`/`React.memo` 수동 추가 금지
- 서버 컴포넌트가 기본. 상태/이벤트/브라우저 API가 필요한 파일에만 `"use client"`
- Tailwind v4 CSS-first: `tailwind.config.*` 생성 금지. 테마 토큰은 `src/app/globals.css`의 `:root`/`.dark` + `@theme inline`에만 추가
- 클래스 병합은 `cn()` (`@/lib/utils`) 사용
- 다크모드는 next-themes class 방식(`.dark`). `dark:` 변형 또는 토큰으로 처리
- 아이콘은 `lucide-react`

## 노션 연동 표준

- 환경 변수(서버 전용): `NOTION_TOKEN`, `NOTION_DATA_SOURCE_ID` (결정 D2 확정 전 잠정). **`NEXT_PUBLIC_` 접두사 금지**. 로컬 값은 `.env`
- 목록: `dataSources.query` + `filter_properties` + `collectPaginatedAPI`. **서버 쿼리에 필터를 걸지 않는다** (`사용` 체크박스 포함 모두 매핑 단계에서 처리)
- 본문: `blocks.children.list`(page id를 block id로 사용) + `collectPaginatedAPI`. 목록 조회에서 본문을 읽지 않는다
- 블록 변환: `paragraph`의 `rich_text` plain text 연결 → `\n` 분리 → `normalizeLine` → `splitLabel` → 빈 줄 제거. 그 외 블록 타입은 건너뛰고 로그만 남긴다
- 매핑: 프로퍼티는 **이름**으로 접근, 삭제 판정은 `in_trash`만 사용, 언어 `ko`/`en` 외·필수값 누락·타입 불일치 행은 건너뛰고 로그, 분류 기본값 `"기타"`, 태그 기본값 `[]`, `사용 === false` 제외(프로퍼티 없으면 전부 사용)
- 정렬: 분류 → 순서 → 제목
- 캐싱: `next.config.ts`에 `cacheComponents: true`. 조회 함수는 `'use cache'` + `cacheLife({ revalidate: 300 })` + `cacheTag`. 목록 태그 `passages`, 본문 태그 `passage-{id}`. 수동 갱신은 `revalidateTag(tag, 'max')`(두 번째 인자 필수) 또는 서버 액션의 `updateTag`
- **`'use cache'` 함수는 성공 데이터만 반환하고 실패하면 throw한다.** 오류 결과를 반환하면 5분간 캐시된다
- 오류 분류는 **캐시 밖 래퍼**에서 `isNotionClientError` + `APIErrorCode`로만 한다. **`error.message` 분기 금지** (프로덕션에서 가려짐)

| 상황 | `PassageResult.kind` |
|---|---|
| 환경 변수 누락, `unauthorized`, `restricted_resource`, `object_not_found`(설정 문제) | `config` |
| `rate_limited`, 5xx, 타임아웃 | `transient` |
| 없는/잘못된 예문 ID | `notFound` |
| 본문 줄 0개, 목록 0건 | `empty` |

- 페이지(서버 컴포넌트)가 `kind`에 따라 `PassageErrorState`를 렌더한다. `error.tsx`는 예상 밖 오류 최후 방어선으로만 쓴다
- **`cacheComponents: true`에서 `params`/`searchParams`는 런타임 API다.** `/passages/[id]` 본문은 `<Suspense>` 안에서 해석·렌더하고 `loading.tsx`를 둔다. 목록 필터(`useSearchParams`)도 `<Suspense>` 경계 안에 둔다
- 목록 페이지는 빌드 시 프리렌더되어 노션을 호출한다. 빌드 환경에도 노션 환경 변수가 필요하다

### 토큰 비노출 (성공 기준 S4)

- ✅ 토큰은 `src/lib/notion/`에서만 읽는다. 클라이언트 컴포넌트에는 가공된 `PassageSummary[]`/`Passage`만 prop으로 전달
- ❌ `process.env.NOTION_*`를 `"use client"` 파일 또는 그 import 체인에서 참조
- ❌ 노션 SDK 응답 원본 객체를 클라이언트로 전달
- ❌ 토큰/ID를 로그, 에러 메시지, 커밋 대상 파일(`.env.example` 포함)에 값으로 기록

## 타이핑 로직 표준 (PRD 7장)

- 비교 단위: NFC 정규화 후 `Array.from` 코드 포인트. 대소문자 구분, 스마트 따옴표 등 자동 치환 금지
- 줄 라벨: `^\([^)]{1,10}\)\s` 패턴만 `label`로 분리(타이핑 제외, Badge로만 표시). 긴 괄호·줄 중간 괄호는 본문 유지
- 판정은 **현재 줄 하나**에 대해서만 수행. 완료/남은 줄은 정적 렌더(현재 줄만 재렌더되는 구조)
- **조합 중(`isComposing || keyCode === 229`) Enter**: 줄 전환하지 않고 `pendingEnter = true`만 기록 → `compositionend` 직후 확정값으로 판정. 브라우저별 이벤트 순서 차이에 의존하지 않는다
- **조합 중 input `value`를 강제로 바꾸지 않는다.** 길이 초과 잘라내기(`truncateToLine`)는 조합 중이 아닐 때만
- 조합 중 마지막 글자는 `composing`(중립 표시). `incorrect` 색 사용 금지. 조합 중에는 오타 수·진행도를 갱신하지 않는다
- 오타/입력 수 집계는 **이전·새 확정 문자열의 차이**로만 계산(`accumulateStats`). 음절마다 `compositionend`가 온다고 가정 금지. 같은 확정 문자열 재전달 시 수치 불변
- 붙여넣기 차단. 입력 요소에 `autocomplete/autocorrect/autocapitalize/spellcheck` 끔. 숨은 input에 `aria-label`
- Enter: 줄 전체 일치일 때만 이동, 불일치면 이동 없이 "줄이 일치하지 않습니다" 표시. 마지막 줄 일치 Enter → 결과 뷰
- 지표: 정확도 = (1 − 오타 ÷ 입력 글자) × 100, CPM = 전체 글자 ÷ 소요 분(음절 기준, 라벨 "타수(음절/분)"), WPM = (전체 글자 ÷ 5) ÷ 소요 분. 0분/입력 0 나눗셈은 `NaN`/`Infinity` 대신 0 또는 정의한 기본값
- 판정 색상은 색에만 의존 금지: 밑줄/취소선/배경 등 보조 표시 병행. 토큰은 `globals.css`에 `--typing-*`로 정의, 라이트/다크 대비 4.5:1 이상
- 접근성: 현재 줄 `aria-current="true"`, `aria-live="polite"`는 줄 완료·결과에만 사용(글자 단위 낭독 금지), `prefers-reduced-motion`이면 부드러운 스크롤 끔

## 다중 파일 동시 수정 규칙

| 수정 대상 | 함께 수정할 파일 |
|---|---|
| `src/config/site.ts`의 `name`/`description` | `src/app/layout.tsx`(metadata는 `siteConfig` 참조 유지), `README.md`, `CLAUDE.md` |
| `siteConfig.nav` | `MainNav`/`MobileNav`가 참조하는지 확인. 현재 `Home`은 Task 003에서 `예문 목록`(`/`)으로 변경 예정 |
| 라우트 추가/삭제 | `README.md` "주요 페이지", `docs/PRD.md` 4장, `docs/ROADMAP.md` |
| 환경 변수 추가/이름 변경 | `.env.example`(키만, 값 없음), `src/lib/notion/` 환경 검증 코드, `docs/PRD.md` 6장, `docs/ROADMAP.md` 결정 기록 D2 |
| 새 판정 상태(`CharState`) 추가 | `src/types/typing.ts`, `src/lib/typing/judge.ts`, `line-chars.tsx`, `globals.css` 토큰(라이트·다크 둘 다) |
| 노션 프로퍼티 추가/변경 | `src/types/passage.ts`, `src/lib/notion/mappers.ts`, `filter_properties` 목록, `docs/PRD.md` 5장 |
| 결정 기록(D1~D11) 확정 | `docs/ROADMAP.md` 결정 기록 표 **와** `docs/PRD.md` 10장 모두 반영 |
| 패키지/스택/명령 변경 | `CLAUDE.md` Stack·Commands, `README.md`, `docs/PRD.md` 9장 |
| Task 완료 | `docs/ROADMAP.md`에서 해당 Task ✅, `테스트 결과` 줄에 날짜와 한두 줄 기록, "현재 상태" 섹션 갱신 |
| 설정/규약 변경 | 이 파일(`shrimp-rules.md`)과 `CLAUDE.md`가 서로 모순되지 않게 유지 |

## 워크플로우 표준

1. 작업 시작 전 `docs/ROADMAP.md`의 해당 Task 명세(구현 사항·수용 기준·테스트 체크리스트)와 `docs/PRD.md`의 관련 장을 읽는다
2. 의존 Task가 ✅인지 확인한다. 미완료면 진행하지 않고 보고한다
3. 구현한다
4. **테스트 게이트 (건너뛰기 금지)**
   - 정적: `npx tsc --noEmit`, `npm run lint` (테스트 러너 없음)
   - API 연동·비즈니스 로직 Task: **Playwright MCP**로 시나리오(정상/오류/엣지, `도구 → 입력 → 기대 결과`) 수행
   - 공통 검증: 콘솔 오류 0건, 네트워크 응답·`outerHTML`에 노션 토큰 0건, 화면 수치가 기대값과 일치
   - 모두 통과해야 ✅ 처리. **실패한 채 ✅ 금지**
5. 노션 오류 재현으로 `.env` 값을 바꿨다면 **반드시 원복**하고 정상 동작을 재확인한다
6. 스크린샷은 커밋하지 않는다
7. **Task 하나를 끝내면 중단하고 사용자의 다음 지시를 기다린다**
8. 한글 IME 실입력은 Playwright로 재현 불가. 합성 이벤트는 보조 수단이며 macOS 실기기 수동 결과(Chrome)를 대체하지 못한다 — 수동 검증 항목은 사용자에게 요청한다

## 현재 상태 스냅샷 (2026-10-05)

- 완료: Phase 0(Task 001). 다음 Task: 002
- 이미 존재(다시 만들지 않음): 루트 `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, L2(`Container`, `EmptyState`, `Logo`, `PageHeader`, `ThemeProvider`, `ThemeToggle`), L3 4종, L1 shadcn 21종(alert, avatar, badge, breadcrumb, button, card, checkbox, dialog, dropdown-menu, field, input, label, navigation-menu, select, separator, sheet, skeleton, sonner, tabs, textarea, tooltip)
- 아직 없음: `@notionhq/client`, `cacheComponents` 설정, `src/hooks/`, `src/types/`, `/passages/[id]`, 노션 환경 변수, shadcn `progress`/`toggle-group`/`scroll-area`
- 이 스냅샷이 코드와 다르면 코드를 기준으로 삼고 이 섹션을 갱신한다

## AI 의사결정 기준

- 요구사항이 PRD와 충돌 → **PRD 우선**. PRD가 모호하면 `docs/ROADMAP.md` 결정 기록(D1~D11)을 확인, 미정이면 "현재안/권장안"을 따르고 사용자에게 보고
- 새 UI가 필요 → ① 기존 L2/L3 재사용 가능? 사용 ② shadcn에 있나? `npx shadcn@latest add` ③ 한 페이지 전용? `_components/` ④ 둘 이상 페이지? L2
- 새 로직이 필요 → React/DOM 비의존이면 `src/lib/typing|passages/`(순수), 노션 접근이면 `src/lib/notion/`(서버 전용), 상태·이벤트면 `src/hooks/`
- 훅이 필요 → usehooks-ts에 이미 있으면 그것을 사용
- Next.js API가 불확실 → `node_modules/next/dist/docs/` 확인, 필요 시 context7 MCP로 라이브러리 문서 조회
- 복잡한 문제 분해 → `sequential-thinking` MCP, 브라우저 검증 → `playwright` MCP
- 커밋 요청 → `git-commit` 스킬(`타입: 제목` 한국어 컨벤셔널 커밋) 사용

## 금지 사항

- ❌ `src/components/ui/`에 shadcn 컴포넌트를 손으로 작성 (CLI로만 추가)
- ❌ 상위 계층을 하위 계층에서 import (역방향 import)
- ❌ `NEXT_PUBLIC_NOTION_*` 또는 클라이언트 번들에서 노션 토큰/SDK 접근
- ❌ 노션에 쓰기(페이지 생성/수정 등), 앱 내 예문 편집
- ❌ 서버 쿼리 필터 사용, 오류 결과를 `'use cache'` 안에서 반환
- ❌ `error.message` 문자열로 오류 종류 분기
- ❌ 수동 `useMemo`/`useCallback`, `tailwind.config.*` 생성
- ❌ Vitest/Jest 등 테스트 러너 도입 (순수 함수 검증은 `tsx` 임시 스크립트 + Playwright MCP, 결정 D4)
- ❌ 별도 `tasks/` 작업 파일 생성 (Task 명세는 `docs/ROADMAP.md`에 직접 작성)
- ❌ 로그인/DB/랭킹/설정 화면 등 PRD "MVP 제외" 항목 구현
- ❌ 조합 중 `value` 강제 변경, 조합 중 오타/진행도 갱신, 이벤트 순서 가정
- ❌ 영어 UI 문구, 폼 검증 라이브러리·인증 라이브러리 도입
- ❌ `AGENTS.md` 상단 Next.js 경고 블록 삭제 (`next dev`가 다시 생성함)
- ❌ `.env`, `shrimp_data/` 커밋
- ❌ 테스트를 건너뛰거나 실패한 채 Task를 ✅ 처리

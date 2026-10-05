# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run start   # 프로덕션 서버
npm run lint    # eslint (flat config, eslint.config.mjs)
```

테스트 러너는 설정되어 있지 않다. 타입 체크는 `npx tsc --noEmit`.

## MCP

- `sequential-thinking`: 프로젝트 `.mcp.json`에 등록. 복잡한 문제를 단계별로 분해해 추론할 때 사용.
- `context7`, `playwright`: 사용자 수준(`~/.claude.json`)에 전역 등록되어 있다. 라이브러리 문서 조회(context7)와 브라우저 검증(playwright)에 사용.

## Stack

Next.js 16 (App Router) · React 19 · React Compiler 활성화(`next.config.ts`의 `reactCompiler: true`, 수동 `useMemo`/`useCallback` 불필요) · TypeScript · Tailwind CSS v4 (CSS-first, `tailwind.config` 없음 — 테마 토큰은 `src/app/globals.css`의 `@theme inline`) · shadcn/ui (`radix-nova` 스타일, `components.json`) · next-themes · usehooks-ts · Pretendard (`src/app/layout.tsx`에서 CDN 로드).

경로 alias: `@/*` → `src/*`.

## 아키텍처: 컴포넌트 계층

import 방향이 단방향인 4계층 구조. **상위 계층은 하위 계층만 import 한다.**

| 계층 | 경로 | 비고 |
|---|---|---|
| L1 Primitives | `src/components/ui/` | shadcn 컴포넌트. 직접 작성하지 말고 `npx shadcn@latest add <name>`으로만 추가 |
| L2 Common | `src/components/common/` | 프로젝트 공통 조합 컴포넌트 (ThemeToggle, Logo, PageHeader, EmptyState, Container 등) |
| L3 Layout | `src/components/layout/` | SiteHeader, SiteFooter, MainNav, MobileNav |
| L4 Page | `src/app/` | layout / page / error / loading / not-found |

- `src/config/site.ts`의 `siteConfig`가 사이트 이름·설명·내비게이션 링크의 단일 소스. 메타데이터(`layout.tsx`)와 내비 컴포넌트가 이를 참조한다.
- `src/hooks/`: 프로젝트 전용 훅. 만들기 전에 usehooks-ts에 이미 있는지 확인.
- 루트 `layout.tsx`가 `ThemeProvider`(class 방식 다크모드, `.dark`) → `TooltipProvider` → Header/main/Footer, 그리고 `Toaster`를 구성한다. 새 전역 provider는 여기에 추가.
- `/components` 라우트(`src/app/components/`)는 컴포넌트 쇼케이스 페이지. 컴포넌트를 추가/변경하면 여기에 예시를 반영.
- 프로젝트 문서와 UI 문구는 한국어.

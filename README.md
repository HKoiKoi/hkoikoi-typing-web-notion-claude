# HKoiKoi Next Starter Kit

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react · usehooks-ts · Pretendard(CDN)

## 시작하기

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run lint
```

## 폴더 구조 (컴포넌트 계층)

| 계층 | 경로 | 설명 |
|---|---|---|
| L1 Primitives | `src/components/ui/` | shadcn 컴포넌트. `npx shadcn@latest add <name>`으로만 추가 |
| L2 Common | `src/components/common/` | 공통 조합 컴포넌트 (ThemeToggle, Logo, PageHeader, EmptyState, Container) |
| L3 Layout | `src/components/layout/` | SiteHeader, SiteFooter, MainNav, MobileNav |
| L4 Page | `src/app/` | layout / page / error / loading / not-found |

- `src/config/site.ts`: 사이트 이름·설명·내비게이션 링크
- `src/hooks/`: 프로젝트 전용 훅 (먼저 [usehooks-ts](https://usehooks-ts.com)에 있는지 확인)
- 상위 계층은 하위 계층만 import 합니다.

## 포함된 shadcn 컴포넌트

button, badge, card, separator, sheet, dropdown-menu, sonner, skeleton, input, label, textarea, checkbox, select, field, alert, dialog, tooltip, tabs, avatar, navigation-menu, breadcrumb

필요 시 추가: `npx shadcn@latest add table accordion pagination`

## 기타

- 다크모드: `next-themes` (shadcn/sonner 표준), `.dark` 클래스 방식
- 폰트: `src/app/layout.tsx`에서 Pretendard Variable CDN 로드
- `/components` 페이지에서 컴포넌트 예시 확인

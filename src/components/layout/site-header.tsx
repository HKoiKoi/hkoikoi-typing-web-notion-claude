import { Suspense } from "react";

import { Container } from "@/components/common/container";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <MobileNav />
          <Logo />
          {/* usePathname이 동적 라우트에서 런타임 값이므로 Suspense로 감싼다 */}
          <Suspense fallback={null}>
            <MainNav className="hidden md:flex" />
          </Suspense>
        </div>
        <ThemeToggle />
      </Container>
    </header>
  );
}

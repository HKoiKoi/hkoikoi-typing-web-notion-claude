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
          <MainNav className="hidden md:flex" />
        </div>
        <ThemeToggle />
      </Container>
    </header>
  );
}

import { cacheLife } from "next/cache";

import { Container } from "@/components/common/container";
import { siteConfig } from "@/config/site";

/** cacheComponents 환경에서 `new Date()`는 프리렌더 시점에 고정해야 하므로 캐시한다. */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <Container className="text-sm text-muted-foreground">
        © <CurrentYear /> {siteConfig.name}. All rights reserved.
      </Container>
    </footer>
  );
}

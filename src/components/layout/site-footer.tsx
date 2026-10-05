import { Container } from "@/components/common/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t py-6">
      <Container className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </Container>
    </footer>
  );
}

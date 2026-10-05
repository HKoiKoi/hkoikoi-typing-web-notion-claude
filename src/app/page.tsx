import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/common/container";
import { HooksDemo } from "@/components/common/hooks-demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const stack = [
  { title: "Next.js 16", desc: "App Router, React 19, React Compiler" },
  { title: "TypeScript", desc: "엄격한 타입 안전성" },
  { title: "Tailwind CSS v4", desc: "유틸리티 퍼스트 스타일링" },
  { title: "shadcn/ui", desc: "복사해서 쓰는 접근성 좋은 컴포넌트" },
  { title: "lucide-react", desc: "일관된 아이콘 세트" },
  { title: "usehooks-ts", desc: "검증된 React 훅 모음" },
  { title: "Pretendard", desc: "CDN으로 적용된 한글 폰트" },
];

export default function Home() {
  return (
    <Container className="space-y-12 py-16">
      <section className="space-y-6 text-center">
        <Badge variant="secondary">Starter Kit</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{siteConfig.name}</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">{siteConfig.description}</p>
        <Button asChild size="lg">
          <Link href="/components">
            컴포넌트 보기 <ArrowRight />
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stack.map(({ title, desc }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="size-4 text-primary" /> {title}
              </CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>usehooks-ts 예시</CardTitle>
          <CardDescription>직접 구현하지 않고 검증된 훅을 사용합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <HooksDemo />
        </CardContent>
      </Card>
    </Container>
  );
}

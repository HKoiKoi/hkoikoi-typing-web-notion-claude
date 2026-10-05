import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "컴포넌트" };

export default function ComponentsPage() {
  return (
    <Container className="pb-16">
      <PageHeader title="컴포넌트" description="스타터킷에 포함된 shadcn/ui 컴포넌트 예시입니다." />
      <Showcase />
    </Container>
  );
}

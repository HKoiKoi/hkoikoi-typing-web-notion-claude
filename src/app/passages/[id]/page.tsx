import { Suspense } from "react";

import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";

import { PassagePlaceholder } from "./_components/passage-placeholder";

export default function PassagePage({ params }: PageProps<"/passages/[id]">) {
  return (
    <Suspense
      fallback={
        <Container className="space-y-4 py-16">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </Container>
      }
    >
      <PassagePlaceholder params={params} />
    </Suspense>
  );
}

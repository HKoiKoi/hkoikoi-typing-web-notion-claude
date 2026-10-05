import { Container } from "@/components/common/container";

import { PassageListSkeleton } from "./_components/passage-list-skeleton";

export default function Loading() {
  return (
    <Container className="pb-16">
      <PassageListSkeleton />
    </Container>
  );
}

import { Container } from "@/components/common/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="space-y-4 py-16">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </Container>
  );
}

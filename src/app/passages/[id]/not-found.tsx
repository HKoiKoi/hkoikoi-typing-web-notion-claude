import { Container } from "@/components/common/container";
import { PassageErrorState } from "@/components/common/passage-error-state";

export default function NotFound() {
  return (
    <Container className="py-16">
      <PassageErrorState kind="notFound" />
    </Container>
  );
}

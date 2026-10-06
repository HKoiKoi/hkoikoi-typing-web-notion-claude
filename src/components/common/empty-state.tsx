import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  headingLevel = 2,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** 페이지에 다른 `h1`이 없는 화면(예문 상세 오류 등)에서는 1을 쓴다. */
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <Heading className="font-semibold">{title}</Heading>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}

import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="space-y-2 py-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}

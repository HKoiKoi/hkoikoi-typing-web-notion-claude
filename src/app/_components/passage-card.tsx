import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildFilterQuery } from "@/lib/passages/filter";
import type {
  Language,
  PassageFilter,
  PassageSummary,
} from "@/types/passage";

const LANGUAGE_LABEL: Record<Language, string> = {
  ko: "한국어",
  en: "영어",
};

type PassageCardProps = {
  passage: PassageSummary;
  filter: PassageFilter;
};

/** 예문 목록의 카드 한 장. 카드 전체가 예문 상세(타이핑) 링크다. */
export function PassageCard({ passage, filter }: PassageCardProps) {
  const href = `/passages/${encodeURIComponent(passage.id)}${buildFilterQuery(filter)}`;

  return (
    <Link
      href={href}
      className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors hover:bg-muted/40 hover:ring-foreground/20">
        <CardHeader>
          <CardTitle className="line-clamp-2 break-words">
            {passage.title}
          </CardTitle>
          <CardDescription>{passage.category}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{LANGUAGE_LABEL[passage.language]}</Badge>
            {passage.difficulty ? (
              <Badge variant="secondary">{passage.difficulty}</Badge>
            ) : null}
          </div>
          {passage.tags.length > 0 ? (
            <ul aria-label="태그" className="flex flex-wrap gap-1.5">
              {passage.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

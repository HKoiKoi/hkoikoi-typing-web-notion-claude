"use client";

import { SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  filterPassages,
  parseFilter,
  sortPassages,
} from "@/lib/passages/filter";
import type { PassageSummary } from "@/types/passage";

import { PassageCard } from "./passage-card";
import { PassageFilters } from "./passage-filters";

type PassageBrowserProps = {
  passages: PassageSummary[];
};

/** URL 쿼리 기준으로 예문을 필터·정렬해 카드 그리드로 보여준다. <Suspense> 안에서 사용한다. */
export function PassageBrowser({ passages }: PassageBrowserProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  if (passages.length === 0) {
    return (
      <EmptyState
        title="아직 불러온 예문이 없습니다"
        description="노션 DB에 예문 행을 추가하세요. 추가한 예문이 이곳에 표시됩니다."
      />
    );
  }

  const filter = parseFilter(searchParams);
  const visible = sortPassages(filterPassages(passages, filter));

  return (
    <div className="flex flex-col gap-6">
      <PassageFilters
        passages={passages}
        filter={filter}
        resultCount={visible.length}
      />
      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="조건에 맞는 예문이 없습니다"
          description="필터 조건을 바꾸거나 초기화해 보세요."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace(pathname, { scroll: false })}
            >
              조건 초기화
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((passage) => (
            <PassageCard key={passage.id} passage={passage} filter={filter} />
          ))}
        </div>
      )}
    </div>
  );
}

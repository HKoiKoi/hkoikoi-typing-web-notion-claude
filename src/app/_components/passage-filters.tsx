"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildFilterQuery } from "@/lib/passages/filter";
import type {
  Difficulty,
  Language,
  PassageFilter,
  PassageSummary,
} from "@/types/passage";

const ALL = "all";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "영어" },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

/** 중복 없이 ko 정렬. URL에만 있는 값(extra)은 임시 선택지로 포함한다. */
function uniqueSorted(values: string[], extra?: string): string[] {
  const set = new Set(values);
  if (extra !== undefined) set.add(extra);
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

type FilterSelectProps = {
  label: string;
  allLabel: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
  className?: string;
};

function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps) {
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type PassageFiltersProps = {
  passages: PassageSummary[];
  filter: PassageFilter;
  resultCount: number;
};

/** 예문 목록 필터. URL 쿼리가 단일 상태 소스이며 변경 시 router.replace로 동기화한다. */
export function PassageFilters({
  passages,
  filter,
  resultCount,
}: PassageFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const categories = uniqueSorted(
    passages.map((passage) => passage.category),
    filter.category,
  );
  const tags = uniqueSorted(
    passages.flatMap((passage) => passage.tags),
    filter.tag,
  );
  const toOptions = (values: string[]) =>
    values.map((value) => ({ value, label: value }));

  const hasFilter = Object.values(filter).some((value) => value !== undefined);

  function update(patch: Partial<PassageFilter>) {
    router.replace(pathname + buildFilterQuery({ ...filter, ...patch }), {
      scroll: false,
    });
  }

  return (
    <div
      role="search"
      aria-label="예문 필터"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <FilterSelect
        label="분류"
        allLabel="전체 분류"
        value={filter.category}
        options={toOptions(categories)}
        onChange={(category) => update({ category })}
        className="w-full sm:w-40"
      />
      <FilterSelect
        label="언어"
        allLabel="전체 언어"
        value={filter.lang}
        options={LANGUAGE_OPTIONS}
        onChange={(lang) => update({ lang: lang as Language | undefined })}
        className="w-full sm:w-32"
      />
      <FilterSelect
        label="난이도"
        allLabel="전체 난이도"
        value={filter.difficulty}
        options={DIFFICULTY_OPTIONS}
        onChange={(difficulty) =>
          update({ difficulty: difficulty as Difficulty | undefined })
        }
        className="w-full sm:w-36"
      />
      <FilterSelect
        label="태그"
        allLabel="전체 태그"
        value={filter.tag}
        options={toOptions(tags)}
        onChange={(tag) => update({ tag })}
        className="w-full sm:w-40"
      />
      <Button
        type="button"
        variant="outline"
        disabled={!hasFilter}
        onClick={() => router.replace(pathname, { scroll: false })}
      >
        조건 초기화
      </Button>
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground sm:ml-auto"
      >
        {resultCount}개의 예문
      </p>
    </div>
  );
}

// 임시 개발용 화면: 순수 함수 검증 결과 표. Task 018에서 제거한다.

import { CircleCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { LabResult } from "../cases";

type LabResultsProps = {
  results: LabResult[];
};

export function LabResults({ results }: LabResultsProps) {
  const total = results.length;
  const passed = results.filter((result) => result.pass).length;
  const allPassed = passed === total;

  // 입력 순서를 유지하며 그룹명별로 묶는다
  const groups = new Map<string, LabResult[]>();
  for (const result of results) {
    const list = groups.get(result.group);
    if (list) list.push(result);
    else groups.set(result.group, [result]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        role="status"
        className={cn(
          "flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold",
          allPassed
            ? "border-typing-correct/40 bg-typing-correct/10 text-typing-correct"
            : "border-typing-incorrect/40 bg-typing-incorrect-space-bg text-typing-incorrect",
        )}
      >
        {allPassed ? (
          <CircleCheck className="size-4" aria-hidden="true" />
        ) : (
          <TriangleAlert className="size-4" aria-hidden="true" />
        )}
        <span data-testid="lab-summary">{`통과 ${passed} / 전체 ${total}`}</span>
      </div>

      {[...groups].map(([group, rows]) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{group}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                {`${group} 검증 케이스의 실제 값, 기대 값, 통과 여부`}
              </caption>
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    케이스 이름
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    실제 값
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    기대 값
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    결과
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.name}-${index}`}
                    data-pass={row.pass ? "true" : "false"}
                    className={cn(
                      "border-t align-top text-foreground",
                      !row.pass && "bg-typing-incorrect-space-bg",
                    )}
                  >
                    <th
                      scope="row"
                      className="px-3 py-2 font-normal break-words"
                    >
                      {row.name}
                    </th>
                    <td className="px-3 py-2 font-mono break-all">
                      {row.actualText}
                    </td>
                    <td className="px-3 py-2 font-mono break-all">
                      {row.expectedText}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-semibold",
                          row.pass
                            ? "border-typing-correct text-typing-correct"
                            : "border-typing-incorrect text-typing-incorrect",
                        )}
                      >
                        {row.pass ? "통과" : "실패"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

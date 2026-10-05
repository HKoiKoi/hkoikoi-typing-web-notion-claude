// 임시 미리보기 화면: 판정 색상 토큰 대비 검증용. Task 018에서 제거한다.
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PageHeader } from "@/components/common/page-header";
import { PassageErrorState } from "@/components/common/passage-error-state";
import { StatItem } from "@/components/common/stat-item";
import type { PassageErrorKind } from "@/types/passage";

type TokenSample = {
  token: string;
  label: string;
  note: string;
  sample: string;
  className: string;
};

// 색에만 의존하지 않도록 밑줄/취소선/배경 보조 표시를 함께 둔다.
const TOKEN_SAMPLES: TokenSample[] = [
  {
    token: "typing-correct",
    label: "맞음",
    note: "색만 사용(기본 표시)",
    sample: "가나다 abc",
    className: "text-typing-correct",
  },
  {
    token: "typing-incorrect",
    label: "틀림",
    note: "취소선 + 밑줄",
    sample: "가나다 abc",
    className: "text-typing-incorrect underline line-through",
  },
  {
    token: "typing-incorrect-space-bg",
    label: "틀린 공백 배경",
    note: "배경 + 글자(foreground)",
    sample: "가 나",
    className: "bg-typing-incorrect-space-bg text-foreground",
  },
  {
    token: "typing-pending",
    label: "대기",
    note: "흐린 색",
    sample: "가나다 abc",
    className: "text-typing-pending",
  },
  {
    token: "typing-current",
    label: "현재 위치",
    note: "굵게 + 아래 테두리(커서)",
    sample: "가나다 abc",
    className: "font-bold text-typing-current border-b-2 border-typing-current",
  },
  {
    token: "typing-composing",
    label: "조합 중",
    note: "점선 밑줄",
    sample: "가나다 abc",
    className: "text-typing-composing underline decoration-dotted",
  },
  {
    token: "typing-extra",
    label: "초과 입력",
    note: "물결 밑줄",
    sample: "가나다 abc",
    className: "text-typing-extra underline decoration-wavy",
  },
];

const ERROR_KINDS: PassageErrorKind[] = ["config", "transient", "notFound", "empty"];

export default function TypingTokensPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-10 py-8">
      <PageHeader
        title="판정 색상 토큰 미리보기"
        description="임시 개발용 화면입니다. 라이트/다크 대비와 보조 표시를 확인합니다."
      />

      <section aria-labelledby="tokens-heading" className="flex flex-col gap-4">
        <h2 id="tokens-heading" className="text-lg font-semibold">
          판정 토큰 7종
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TOKEN_SAMPLES.map(({ token, label, note, sample, className }) => (
            <li
              key={token}
              data-token={token}
              className="flex flex-col gap-1 rounded-md border p-4"
            >
              <span className="text-xs text-muted-foreground">
                {label} · {token} · {note}
              </span>
              <span
                data-sample={token}
                className={`w-fit font-mono text-xl whitespace-pre ${className}`}
              >
                {sample}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stats-heading" className="flex flex-col gap-4">
        <h2 id="stats-heading" className="text-lg font-semibold">
          통계 항목
        </h2>
        <dl className="flex flex-wrap gap-8">
          <StatItem label="타수" value={320} unit="타/분" />
          <StatItem label="정확도" value={97.5} unit="%" />
          <StatItem label="진행" value="12 / 31" unit="줄" />
        </dl>
      </section>

      <section aria-labelledby="errors-heading" className="flex flex-col gap-4">
        <h2 id="errors-heading" className="text-lg font-semibold">
          예문 오류 상태 4종
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {ERROR_KINDS.map((kind) => (
            <div key={kind} data-error-kind={kind} className="rounded-md border">
              <PassageErrorState kind={kind} />
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}

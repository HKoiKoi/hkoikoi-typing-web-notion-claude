import type { LucideIcon } from "lucide-react";
import { FileQuestion, FileX, SearchX, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import type { PassageErrorKind } from "@/types/passage";

type ErrorContent = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** 기본 복구 액션. 서버 컴포넌트에서도 쓸 수 있도록 링크만 사용한다. */
  action: ReactNode;
};

const backToListAction = (
  <Button asChild variant="outline">
    <Link href="/">예문 목록으로</Link>
  </Button>
);

// PassageErrorKind가 추가되면 컴파일 에러로 누락을 알려 준다.
const ERROR_CONTENT: Record<PassageErrorKind, ErrorContent> = {
  config: {
    icon: TriangleAlert,
    title: "노션 연결 설정을 확인해 주세요",
    description:
      "노션 토큰, 데이터베이스 ID, 연결(권한) 설정에 문제가 있어 예문을 불러올 수 없습니다.",
    action: null,
  },
  transient: {
    icon: FileX,
    title: "예문을 불러오지 못했습니다",
    description: "일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.",
    // 재시도는 이벤트 핸들러가 필요하므로 호출 측이 action으로 주입한다.
    action: null,
  },
  notFound: {
    icon: FileQuestion,
    title: "예문을 찾을 수 없습니다",
    description: "삭제되었거나 존재하지 않는 예문입니다.",
    action: backToListAction,
  },
  empty: {
    icon: SearchX,
    title: "표시할 예문이 없습니다",
    description: "노션 데이터베이스에 예문이나 줄을 추가한 뒤 다시 확인해 주세요.",
    action: null,
  },
};

export function PassageErrorState({
  kind,
  description,
  action,
}: {
  kind: PassageErrorKind;
  /** 지정하면 kind별 기본 설명을 대체한다. (예: 줄이 0개인 예문의 empty 안내) */
  description?: string;
  /** 지정하면 kind별 기본 복구 액션을 대체한다. `null`이면 액션을 숨긴다. */
  action?: ReactNode;
}) {
  const content = ERROR_CONTENT[kind];
  const { icon, title, action: defaultAction } = content;
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description ?? content.description}
      action={action === undefined ? defaultAction : action}
    />
  );
}

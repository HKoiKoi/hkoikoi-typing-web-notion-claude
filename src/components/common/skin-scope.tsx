import type { ComponentType, ReactNode } from "react";

import type { PassageSkin } from "@/types/passage";

import { BibleCorner, BibleCross } from "./bible-ornaments";
import { HanjiCloud, HanjiCorner } from "./hanji-ornaments";
import { bibleFont, hanjiFont } from "./skin-font";

type Ornament = ComponentType<{ className?: string }>;

/**
 * 스킨별 폰트 변수 클래스와 장식 컴포넌트. 키를 Exclude<PassageSkin, "default">로 두어
 * PASSAGE_SKINS에 스킨을 추가하고 이 매핑을 빠뜨리면 tsc가 잡는다.
 */
const SKINS: Record<
  Exclude<PassageSkin, "default">,
  { fontClass: string; Corner: Ornament; Divider: Ornament }
> = {
  hanji: { fontClass: hanjiFont.variable, Corner: HanjiCorner, Divider: HanjiCloud },
  bible: { fontClass: bibleFont.variable, Corner: BibleCorner, Divider: BibleCross },
};

/**
 * 예문 스킨 적용 범위 (Task 023·026, PRD 8장 테마 스킨, F016).
 * - skin이 "default"가 아니면 루트에 data-skin과 폰트 변수 클래스를 붙이고 스킨별 장식 문양을 둔다.
 *   색·폰트 재정의는 globals.css의 [data-skin="..."] / .dark [data-skin="..."]가 담당한다.
 * - "default"면 data-skin 속성과 문양 없이 같은 구조의 div만 렌더해 스킨 전환 시 자식이 리마운트되지 않게 한다.
 * - 서버 컴포넌트다(훅·상태 없음). 서버 렌더 HTML에 data-skin이 들어가 첫 페인트부터 적용된다.
 *   F017(테마 효과 끄기, Task 025)은 이 컴포넌트에 skin="default"를 넘기는 방식으로 결합한다.
 * - 오류·빈 상태·not-found 화면에는 쓰지 않는다(호출부인 passage-screen이 정상 분기에서만 감쌈).
 */
export function SkinScope({
  skin,
  children,
}: {
  skin: PassageSkin;
  children: ReactNode;
}) {
  if (skin === "default") {
    return <div>{children}</div>;
  }

  const { fontClass, Corner, Divider } = SKINS[skin];

  return (
    <div data-skin={skin} className={`${fontClass} relative`}>
      {/* 장식은 모서리·하단 구분선에만 둔다. 글자 영역과 겹치지 않도록 pointer-events 없음. */}
      <Corner className="pointer-events-none absolute top-0 left-0" />
      <Corner className="pointer-events-none absolute top-0 right-0 rotate-90" />
      {children}
      <div className="relative flex h-12 items-center justify-center" aria-hidden="true">
        <Corner className="pointer-events-none absolute bottom-0 left-0 -rotate-90" />
        <Divider />
        <Corner className="pointer-events-none absolute right-0 bottom-0 rotate-180" />
      </div>
    </div>
  );
}

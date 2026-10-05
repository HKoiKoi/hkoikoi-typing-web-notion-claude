"use client";

import { Copy, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCopyToClipboard, useCounter } from "usehooks-ts";

import { Button } from "@/components/ui/button";

export function HooksDemo() {
  const { count, increment, decrement } = useCounter(0);
  const [, copy] = useCopyToClipboard();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="icon" onClick={decrement} aria-label="감소">
        <Minus />
      </Button>
      <span className="w-8 text-center tabular-nums">{count}</span>
      <Button variant="outline" size="icon" onClick={increment} aria-label="증가">
        <Plus />
      </Button>
      <Button
        variant="secondary"
        onClick={async () => {
          if (await copy("npx shadcn@latest add button")) toast.success("복사되었습니다");
        }}
      >
        <Copy /> shadcn add 명령 복사
      </Button>
    </div>
  );
}

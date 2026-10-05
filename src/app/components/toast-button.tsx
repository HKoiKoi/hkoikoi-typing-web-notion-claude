"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ToastButton() {
  return <Button onClick={() => toast.success("제출되었습니다")}>제출</Button>;
}

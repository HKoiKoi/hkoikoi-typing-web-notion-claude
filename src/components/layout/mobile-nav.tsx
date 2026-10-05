"use client";

import { Menu } from "lucide-react";
import { useBoolean } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MainNav } from "./main-nav";

export function MobileNav() {
  const { value: open, setValue: setOpen, setFalse: close } = useBoolean(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>
        <MainNav aria-label="모바일 내비게이션" className="flex-col items-start gap-4 px-4 text-base" onNavigate={close} />
      </SheetContent>
    </Sheet>
  );
}

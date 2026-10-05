import { Info } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToastButton } from "./toast-button";

export function Showcase() {
  return (
    <Tabs defaultValue="actions">
      <TabsList>
        <TabsTrigger value="actions">액션</TabsTrigger>
        <TabsTrigger value="form">폼</TabsTrigger>
        <TabsTrigger value="feedback">피드백</TabsTrigger>
      </TabsList>

      <TabsContent value="actions" className="space-y-6 pt-4">
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">다이얼로그</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>다이얼로그</DialogTitle>
                <DialogDescription>모달 예시입니다.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">툴팁</Button>
            </TooltipTrigger>
            <TooltipContent>툴팁 내용</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">드롭다운</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>항목 1</DropdownMenuItem>
              <DropdownMenuItem>항목 2</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">시트</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>시트</SheetTitle>
                <SheetDescription>사이드 패널 예시입니다.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Avatar>
            <AvatarFallback>HK</AvatarFallback>
          </Avatar>
        </div>
      </TabsContent>

      <TabsContent value="form" className="max-w-md pt-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">이름</FieldLabel>
            <Input id="name" placeholder="홍길동" />
          </Field>
          <Field>
            <FieldLabel>역할</FieldLabel>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">개발자</SelectItem>
                <SelectItem value="design">디자이너</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="bio">소개</FieldLabel>
            <Textarea id="bio" />
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="terms" />
            <FieldLabel htmlFor="terms">약관에 동의합니다</FieldLabel>
          </Field>
          {/* Label 단독 사용 예시 (Field 없이 Label + Input 직접 연결) */}
          <div className="grid gap-2">
            <Label htmlFor="nickname">닉네임</Label>
            <Input id="nickname" placeholder="닉네임을 입력하세요" />
          </div>
          <ToastButton />
        </FieldGroup>
      </TabsContent>

      <TabsContent value="feedback" className="space-y-6 pt-4">
        <Alert>
          <Info />
          <AlertTitle>알림</AlertTitle>
          <AlertDescription>Alert 컴포넌트 예시입니다.</AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">홈</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>컴포넌트</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card>
          <CardHeader>
            <CardTitle>카드</CardTitle>
            <CardDescription>Card 컴포넌트 예시입니다.</CardDescription>
          </CardHeader>
        </Card>
        <EmptyState title="데이터가 없습니다" description="EmptyState 공통 컴포넌트 예시입니다." />
      </TabsContent>
    </Tabs>
  );
}

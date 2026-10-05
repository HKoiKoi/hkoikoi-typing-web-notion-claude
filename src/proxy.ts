import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 깨진 % 인코딩(예: /passages/%E0%A4%A)은 Next 라우터가 페이지에 도달하기 전에
// 500을 반환하므로, 디코드할 수 없는 경로는 여기서 404로 돌려보낸다.
export function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);
  try {
    decodeURIComponent(pathname);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/passages/:path*",
};

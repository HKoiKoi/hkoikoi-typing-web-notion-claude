import { Gowun_Batang } from "next/font/google";

/**
 * 한지 스킨 전용 한글 명조 폰트 (Task 023, PRD 10장 18).
 * skin-scope.tsx에서만 import 하므로 SkinScope를 쓰는 타이핑 라우트에서만 @font-face가 포함된다.
 * - 선택: Gowun Batang(400/700). Hahmlet(가변, 약 92파일/1.8MB)보다 가볍고 한지 분위기에 맞는 고전 명조다.
 * - subsets: 한글 슬라이스는 이름이 아닌 번호로 쪼개져 있어 preload 대상이 되지 못한다.
 *   그래서 preload는 끄고 unicode-range 슬라이스를 화면에 쓰인 글자 분량만 지연 로드한다.
 * - variable: CSS 변수 --font-hanji 로 노출하고 실제 적용은 globals.css의 [data-skin="hanji"]가 한다.
 */
export const hanjiFont = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-hanji",
  fallback: ["Batang", "AppleMyungjo", "Noto Serif KR", "serif"],
});

# 노션 타이핑 연습

노션 데이터베이스에 등록한 한국어/영어 여러 줄 본문(예문)을 불러와 한 줄씩 따라 치는 타이핑 연습 웹앱입니다.

## 🎯 프로젝트 개요

- **목적**: 직접 관리하는 본문(성경 한 장, 애국가, 영어 글 등)으로 타이핑을 연습하고, 글자별 실시간 판정과 결과 요약(정확도, 소요 시간, CPM/WPM)을 제공
- **범위**: 단일 사용자, 로그인 없음, 노션 DB는 읽기 전용
- **사용자**: 노션으로 본문을 관리하는 본인 1인

## 📱 주요 페이지

1. **예문 목록** (`/`) - 예문 카드 조회 및 분류/언어/난이도/태그 필터
2. **타이핑 화면** (`/passages/[id]`) - 한 줄씩 타이핑, 완료 후 결과 뷰 표시
3. **오류/빈 상태** - 노션 오류, 예문 0건, 잘못된 예문 접근 안내

## ⚡ 핵심 기능

- 노션 DB 연동 및 캐싱 (서버 전용 조회, 토큰 비노출)
- 글자별 실시간 판정, 한글 IME 조합 처리
- 줄 전환(Enter), 자동 스크롤, 진행도 표시
- 결과 요약, 다음 예문/다시 도전
- 다크모드

## 🛠️ 기술 스택

- Framework: Next.js 16 (App Router)
- Runtime: React 19 (React Compiler)
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui, lucide-react
- 기타: next-themes, usehooks-ts, Pretendard(CDN)

## 🚀 시작하기

```bash
npm install
cp .env.example .env   # 노션 환경 변수 3종 입력 (아래 "노션 설정 가이드" 참고)
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run start          # 프로덕션 서버
npm run lint
```

## 🗂️ 노션 설정 가이드

앱은 노션 데이터베이스를 **읽기만** 합니다. 데이터베이스(DB)를 두 개 직접 만들어야 합니다.

- **Passages DB**: 행 하나 = 예문 한 편(창세기 1장, 애국가, 영어 글 등). 이 DB의 페이지 본문은 비워 둡니다.
- **Lines DB**: 행 하나 = 예문의 줄 한 개. 페이지 본문(블록)은 읽지 않습니다.

프로퍼티 이름과 select 옵션 값은 영어이며 아래 표와 **정확히 일치**해야 합니다.

### Passages DB 프로퍼티

| 프로퍼티명 | 노션 타입 | 필수 | 설명 |
|---|---|---|---|
| `Title` | title | O | 예문 제목 (예: `Genesis 1`) |
| `Language` | select (`ko` / `en`) | O | 이 외의 값이면 해당 행은 목록에서 제외 |
| `Category` | select | X | 분류 (예: `Genesis`, `National Anthem`). 비우면 "기타"로 표시 |
| `Order` | number | X | 같은 분류 안의 정렬 순서 (장 번호 등). 비우면 `Title` 순 |
| `Difficulty` | select (`Easy` / `Medium` / `Hard`) | X | 비우면 미지정 |
| `Tags` | multi_select | X | 비우면 태그 없음 |
| `Theme` | select (`default` / `hanji`) | X | `hanji`만 한국 테마 스킨 적용. 행의 값은 비워도 되고 비우거나 그 외 값이면 기본 테마 (행은 제외되지 않음). 단 **속성(열) 자체는 DB에 만들어 두어야** 합니다. 없으면 목록 조회가 실패합니다 |
| `Enabled` | checkbox | X | 체크 해제한 행은 목록에서 제외. 프로퍼티가 없으면 전부 사용 |

### Lines DB 프로퍼티

| 프로퍼티명 | 노션 타입 | 필수 | 설명 |
|---|---|---|---|
| `Text` | title | O | 타이핑할 줄 내용. 비어 있는 행은 제외 |
| `Passage` | relation → Passages DB | O | 이 줄이 속한 예문 |
| `Line Number` | number | O | 1부터 시작하는 줄 순서. 비어 있는 행은 제외 |
| `Label` | rich_text | X | 줄 앞에 배지로만 표시(판정 제외). 예: `1절`, `후렴`, 절 번호 |

### 줄 입력 규칙

- **행 하나 = 한 줄**입니다. 줄 바꿈이 필요한 곳마다 행을 새로 만들고 `Line Number`를 1, 2, 3… 순서로 채웁니다.
- 절 번호나 `1절`·`후렴` 같은 표시는 `Text`에 넣지 않고 `Label`에 넣습니다.
- 줄이 많으면 CSV로 한꺼번에 가져오는 것을 권장합니다. 열 이름을 `Passage`, `Line Number`, `Label`, `Text`로 맞춘 CSV를 Lines DB로 import합니다. import 뒤에는 `Passage` 관계가 올바른 예문에 연결되었는지, `Line Number`가 숫자로 들어갔는지 노션에서 확인하세요(연결이 비어 있는 줄은 앱에 나타나지 않습니다).

```csv
Passage,Line Number,Label,Text
National Anthem,1,1절,동해물과 백두산이 마르고 닳도록
National Anthem,2,,하느님이 보우하사 우리나라만세
National Anthem,3,후렴,무궁화 삼천리 화려강산
National Anthem,4,,대한사람 대한으로 길이 보전하세
```

### 환경 변수

모두 서버 전용입니다. **`NEXT_PUBLIC_` 접두사를 붙이지 마세요.** 토큰이 브라우저로 노출됩니다.

| 이름 | 값 |
|---|---|
| `NOTION_TOKEN` | 노션 통합(Integration) 시크릿 |
| `NOTION_DATA_SOURCE_ID` | Passages DB의 data source ID |
| `NOTION_LINES_DATA_SOURCE_ID` | Lines DB의 data source ID |

1. 노션에서 통합(Integration)을 만들고 시크릿을 `NOTION_TOKEN`에 넣습니다.
2. **두 DB 모두** 통합에 연결합니다. 하나라도 빠지면 앱이 "노션 연결 설정을 확인해 주세요"를 표시합니다.
3. 각 DB의 설정에서 **Manage data sources → Copy data source ID**로 ID를 복사합니다. data source ID는 DB ID(주소창의 ID)와 다른 값이며 서로 바꿔 쓸 수 없습니다.
4. 로컬에서는 `.env`에 세 값을 입력합니다(`.env.example` 참고). `.env`는 커밋하지 않습니다.
5. 배포 환경에서는 같은 이름의 환경 변수 3개를 호스팅 설정에 등록합니다. 빌드 환경에도 필요할 수 있으므로 빌드·실행 양쪽에 설정하세요.

### 반영 시점

노션에서 내용을 고치면 목록과 줄 데이터에 **최대 5분** 안에 반영됩니다(서버 캐시). 같은 예문을 다시 열어도 노션을 다시 호출하지 않습니다.

## ☁️ 배포

서버에서 노션 API를 호출하고 토큰을 서버에만 두는 구조라 Node 서버 런타임이 필요합니다. 정적 호스팅(GitHub Pages 등)은 사용할 수 없습니다. **Vercel 배포를 권장합니다.**

### Vercel

1. GitHub 저장소를 Vercel에 Import합니다(Framework: Next.js 자동 감지, 빌드 설정은 기본값).
2. **Settings → Environment Variables**에 [환경 변수](#환경-변수) 3개를 Production과 Preview 양쪽에 등록합니다. 빌드 중에도 필요할 수 있으니 값은 빌드·실행 양쪽에 적용합니다. `NEXT_PUBLIC_` 접두사는 붙이지 않습니다.
3. 배포가 끝나면 아래를 확인합니다.
   - 홈에 예문 카드가 표시되고 언어/난이도 필터가 동작하는지
   - 페이지 소스(HTML)에 노션 토큰이 없는지
4. 환경 변수를 수정했다면 새 배포(Redeploy)를 해야 반영됩니다.

### 커스텀 도메인

1. Vercel 프로젝트의 **Settings → Domains**에서 도메인을 추가합니다(예: `typing.hkoikoi.dev`).
2. 도메인 DNS에 Vercel이 안내하는 레코드를 등록합니다. 서브도메인은 `CNAME`, 루트 도메인은 `A` 레코드입니다.
3. 검증이 끝나면 HTTPS 인증서가 자동 발급됩니다.

루트 도메인이 이미 다른 용도(홈서버 등)로 쓰이고 있다면 서브도메인만 Vercel로 연결하는 편이 충돌이 없습니다.

### 셀프 호스팅(대안)

홈서버 등에서 직접 운영할 때는 `npm run build && npm run start`로 Node 서버를 상시 실행하고, 리버스 프록시(또는 Cloudflare Tunnel)로 HTTPS를 붙입니다. 환경 변수 3개는 프로세스 환경에 설정합니다. 프로세스 재시작(launchd, pm2 등)과 장애 대응은 직접 관리해야 합니다.

## 📋 개발 상태

- ✅ 예문 목록(필터·정렬), 노션 연동과 캐싱, 타이핑 화면(글자별 판정, 한글 IME 조합, 줄 전환), 결과 뷰, 오류·빈 상태, 접근성·다크모드
- ✅ 개발 전용 코드 제거, 프로덕션 모드 최종 검증(미확인 항목은 [ROADMAP](./docs/ROADMAP.md) Task 018 참고)

## 📖 문서

- [PRD 문서](./docs/PRD.md) - 상세 요구사항
- [개발 로드맵](./docs/ROADMAP.md) - Task별 진행 상태
- [개발 가이드](./CLAUDE.md) - 개발 지침

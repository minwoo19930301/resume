# Resume 리디자인 플랜 — "애플 홈페이지 감성"

> 이 문서는 다른 세션/에이전트가 컨텍스트 없이 그대로 실행할 수 있도록 작성됨.
> 대상 파일: `kr/index.html`, `kr/education.html`, `en/index.html`, `styles.css`
> 배포: GitHub Pages (https://github.com/minwoo19930301/resume)

---

## 0. 작업 금지 사항 (모든 에이전트 필독)

**페이지끼리 연결(navigation/link)을 추가하지 말 것.** 사용자가 의도적으로 제거한 항목이며, 반복해서 다시 추가되고 있어 명시함:

- 상단 nav bar / 탭(`한국어` · `English` · `교육` 전환 탭) 추가 금지.
- footer의 페이지 전환 링크(`한국어` / `English` / `교육`) 추가 금지.
- hero의 CTA 버튼(`연락하기`, `교육 활동 보기`, `경력기술서 보기` 등 페이지 간 이동/메일 버튼) 추가 금지. — `.hero-cta`, `.btn` 마크업을 hero에 다시 넣지 말 것.

세 페이지(`kr/index.html`, `en/index.html`, `kr/education.html`)는 **각각 독립 문서로 둔다.** 서로 링크로 묶지 않는다. CSS에 `.btn` / `.hero-cta` 규칙이 남아 있어도 hero에 재배선하지 말 것.

---

## 1. 목표 컨셉

현재: 밝은 회색 배경 + 흰 카드 + 파란 포인트의 전형적인 "어드민 대시보드" 느낌.
목표: **apple.com 제품 페이지 감성** — 여백이 주인공, 큰 타이포, 절제된 색, 스크롤하면서 콘텐츠가 부드럽게 드러나는 구성.

핵심 원칙 (작업 중 판단 기준):
1. **여백으로 구분하고, 선(border)으로 구분하지 않는다.** 카드 테두리 대부분 제거.
2. **타이포가 디자인이다.** 헤드라인은 크고 두껍고 자간은 좁게(-0.02em ~ -0.03em).
3. **색은 흑백 + 포인트 1색.** 현재 파랑(#2563eb)/청록(#0f766e) 2색 체계를 정리.
4. **모션은 거들 뿐.** fade-up reveal 정도만. 과한 패럴랙스/회전 금지.
5. 라이브러리 추가 금지. 순수 CSS + 소량의 vanilla JS (IntersectionObserver)로 구현.

---

## 2. 현재 상태 요약

- `styles.css` 1200줄+. `:root`에 디자인 토큰 이미 존재 (`--bg-color: #f5f7fb`, `--primary: #2563eb`, `--content-width: 1180px` 등) → 토큰 교체 방식으로 진행 가능.
- 폰트: Pretendard + Noto Sans KR (Google Fonts @import). Pretendard 유지 (한글에서 SF Pro 느낌에 가장 가까움).
- 페이지 공통 구조: `.page-hero > .hero-shell` (이름/연락처/사진) → `.page-shell > .content-section` 반복 → `.main-footer`.
- 연혁 섹션: Chart.js scatter 차트(canvas) + 카드 리스트. **차트는 커스텀 플러그인으로 라벨을 캔버스에 직접 그림** — 색상 하드코딩(`#0f172a`, `#475569`)이라 다크 배경 위에 올리면 안 보임. 주의.
- 기술 스택: 아이콘 무한 마퀴 (`#techIcons`, JS로 그룹 복제).
- `kr/education.html`: 유튜브 임베드 다수 + 인라인 스타일 많음 (`style="position: absolute; ..."` 타임라인 뱃지 등).
- 모바일에서 차트 깨짐 이슈로 수정한 이력 있음 (git log: "Fix chronology chart canvas width on mobile", "Disable chronology chart auto-resize on mobile") → **차트 관련 코드는 건드릴 때 모바일(<768px) 확인 필수.**

---

## 3. 디자인 시스템 (토큰 교체)

`styles.css`의 `:root`를 아래로 교체. 기존 변수명을 최대한 유지해서 하위 셀렉터 수정량을 줄일 것.

```css
:root {
    /* Apple식: 거의 흰 배경, 섹션 교차용 옅은 회색 */
    --bg-color: #ffffff;
    --bg-layer: #f5f5f7;        /* apple.com 시그니처 회색 */
    --bg-panel: #ffffff;
    --bg-panel-strong: #ffffff;
    --bg-muted: #e8e8ed;
    --bg-dark: #000000;          /* 다크 섹션용 */
    --text-primary: #1d1d1f;     /* apple 본문 검정 */
    --text-secondary: #6e6e73;   /* apple 보조 회색 */
    --border-color: #d2d2d7;
    --primary: #0071e3;          /* apple 링크/버튼 블루 단일 포인트 */
    --primary-dark: #0077ed;
    --secondary: #0071e3;        /* 청록 제거, 포인트 1색으로 통일 */
    --gradient-header: none;
    --card-bg: #ffffff;
    --shadow-soft: 0 2px 12px rgba(0, 0, 0, 0.04);
    --shadow-strong: 0 8px 32px rgba(0, 0, 0, 0.08);
    --content-width: 1040px;     /* 1180 → 1040, 본문 폭 좁혀 여백 강조 */
    --radius-lg: 28px;           /* 카드 큰 라운드 */
    --radius-md: 18px;
    --ease-out: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

타이포 스케일 (클램프로 반응형):
- 히어로 이름/헤드라인: `clamp(40px, 7vw, 72px)`, weight 700, `letter-spacing: -0.03em`, `line-height: 1.05`
- 섹션 타이틀(`.section-title`): `clamp(28px, 4.5vw, 48px)`, weight 700, `letter-spacing: -0.025em`
- 섹션 킥커(`.section-kicker`): 12px → 17px, weight 600, **대문자/자간벌림 제거**(현재 uppercase 스타일이면 풀 것). 애플은 킥커도 소문자 그대로 씀.
- 본문: 17px, `line-height: 1.65`, color `--text-secondary` (제목만 `--text-primary`)
- 프로젝트 카드 h3: 21px, weight 600

섹션 리듬: 섹션 간 `padding: 120px 0` (모바일 72px). 섹션 배경을 **흰색 ↔ #f5f5f7 교차**로 깔아 구분선 없이 리듬을 만든다.

---

## 4. 섹션별 리디자인 명세

### 4.1 내비게이션 (신규)
- 현재 language-tabs를 **상단 고정(frosted glass) 나브바**로 승격:
  - `position: sticky; top: 0; backdrop-filter: saturate(180%) blur(20px); background: rgba(255,255,255,0.72);` 높이 48px, 하단 1px 헤어라인 `rgba(0,0,0,0.08)`.
  - 좌측: 이름(로고 역할, 클릭 시 맨 위로). 우측: 한국어 / English / **교육** 탭 + 섹션 앵커(연혁·프로젝트·활동).
  - **중요(콘텐츠 버그 수정 겸):** `kr/index.html`과 `en/index.html`에는 현재 교육 페이지(`kr/education.html`)로 가는 링크가 아예 없음. 나브에 반드시 추가.

### 4.2 히어로
- 카드(`.hero-shell`의 border/배경) 제거 → 풀폭 흰 배경에 **중앙 정렬 대형 타이포**:
  - 1행: 이름 (대형 헤드라인)
  - 2행: 한 줄 포지셔닝 — *"이커머스 도메인 백엔드 엔지니어. 대용량 데이터 파이프라인과 가격 시스템을 만듭니다."* (정확한 문구는 소유자 확인 필요하나 placeholder로 우선 적용)
  - 3행: 연락처/소셜은 작은 회색 텍스트 한 줄로 축소
- 프로필 사진: 사각 카드 → 지름 96~120px **원형**, 헤드라인 위에 배치 (애플 이벤트 페이지의 아바타 느낌).
- 히어로 바로 아래 **핵심 수치 스트립** 추가 (애플 스펙 페이지 스타일 — 큰 숫자 + 작은 설명, 3~4개 그리드):
  - `2.8억 개` 할인 반영 상품 / `1.5h → 15min` 가격 배치 / `200배` 조회 속도 개선 / `45만` 테크블로그 방문
  - 큰 숫자는 56px weight 700, 설명은 14px 회색.

### 4.3 연혁 (chronology)
- Chart.js 캔버스 차트는 **유지하되 톤만 정리** (라벨 색 하드코딩 때문에 흰 배경 섹션에 둘 것). 욕심내서 CSS 타임라인으로 재구현하지 말 것 — 모바일 회귀 이력 있음.
- 카드 리스트는 border 제거, 회사별 색 점(dot)만 유지. 회사 구분색은 채도 낮춰 통일감 (lotte `#0071e3`, gmarket `#1d1d1f`, 기타 `#6e6e73` 권장).

### 4.4 업적 분류 (Core Themes)
- 현재 4카드 그리드 유지하되 **#f5f5f7 배경 섹션** 위에 흰 카드, border 없음, radius 28px, hover 시 `transform: translateY(-4px)` + shadow-strong, `transition: 0.4s var(--ease-out)`.
- 각 카드에 작은 SF Symbols 풍 이모지/아이콘 1개 허용 (선택).

### 4.5 주요 프로젝트 타임라인
- **정렬을 최신 연도(2025) → 과거(2019) 역순으로 변경.** HTML의 `.year-section` 블록 순서를 뒤집으면 됨 (kr/en 둘 다).
- 연도 라벨(`.year-label`)을 sticky로: 스크롤 시 좌측에 연도가 고정되며 따라오는 애플식 레이아웃 (`position: sticky; top: 80px`). 모바일에서는 sticky 해제.
- 프로젝트 카드: border 제거, 흰 배경 + shadow-soft. 첫 문단(성과 요약)을 굵게/검정으로, 나머지 설명은 회색 — 훑어볼 때 성과만 튀게.
- 회사 아이콘(`.project-icon`)은 유지하되 24px로 축소, 제목 왼쪽 인라인 배치.

### 4.6 다크 섹션 1개 (포인트)
- "기술 전파 및 커뮤니티" 또는 핵심 수치 스트립 중 하나를 **검정 배경(#000) + 흰 타이포** 섹션으로 (애플 페이지의 다크 인터루드). 두 곳 이상 쓰지 말 것.
- 다크 섹션에는 canvas 차트 넣지 말 것 (라벨색 하드코딩 이슈).

### 4.7 기술 스택 마퀴
- 마퀴 자체는 유지 (애플 감성과 충돌 안 함). 아이콘을 **그레이스케일 + hover 시 컬러** 처리 (`filter: grayscale(1) opacity(0.6)` → hover 해제).
- **아이콘 목록 수정:** Kafka, Elasticsearch(icon/elastic.png 이미 있음) 추가. 본문에 거의 등장하지 않는 AWS·Node.js는 빼거나 뒤로. 마퀴 아래에 텍스트 한 줄 분류 추가:
  - `Backend — Java · Kotlin · Spring Boot/Batch/Kafka` / `Data — Kafka · Elasticsearch · Databricks · MongoDB · MsSQL` / `Frontend — React · Vue · Next.js`

### 4.8 푸터
- 외부 핫링크 이미지 제거(특히 apkmirror PHP URL — 깨질 위험). `icon/` 폴더에 로컬 저장 후 사용하거나 텍스트 링크로 대체.
- 다크 푸터 또는 #f5f5f7 푸터, 텍스트 링크 중심으로 미니멀하게.

### 4.9 education.html
- 동일 토큰/나브 적용. 인라인 스타일(타임라인 원형 뱃지 등)은 가능한 범위에서 클래스로 이동하되, **유튜브 플레이어 관련 구조(.video-container, overlay, blocker)는 동작 로직과 얽혀 있으니 스타일만 손대고 DOM 구조는 유지.**

---

## 5. 모션

- **Scroll reveal:** `.content-section`과 `.project` 카드에 IntersectionObserver로 `is-visible` 클래스 부여 → `opacity 0→1, translateY(24px)→0, 0.7s var(--ease-out)`. threshold 0.15, 한 번만 실행.
- 나브 frosted blur는 스크롤 0일 때 투명 → 스크롤 시 배경 생기게 (선택).
- `@media (prefers-reduced-motion: reduce)` 블록이 이미 styles.css에 있음 — reveal/마퀴 모두 여기서 무효화할 것 (reveal은 즉시 표시).
- `html { scroll-behavior: smooth; }` 추가 (앵커 이동용).

---

## 6. 디자인과 함께 처리할 콘텐츠 수정 (이전 리뷰에서 나온 것)

디자인 작업 시 같은 PR에서 처리:

1. `kr/index.html:229` "DB 상태값**을를**" → "상태값을"
2. `kr/index.html:230` "주기적으로 확인하며 통해" → "주기적으로 확인하여"
3. `kr/index.html:285` "단순 매출 증대와 순이익 감소 문제" → "매출만 늘고 순이익은 감소하는 문제"
4. `kr/index.html:351` "Databrick" → "Databricks"
5. Databricks 마이그레이션 성과 문구: "연간 Job비용을 30만 원 수준으로 절감" → "기존 인프라(Kafka 컨슈머 12대, Elasticsearch, 배치 앱 4대) 중단으로 운영 비용을 연 30만 원 수준까지 절감" 처럼 **비교 기준 명시** (정확한 기존 비용 수치는 소유자 확인 필요 — 모르면 위 문구로).
6. 해커톤 항목 "최종 순위권에는 들지 못했으나" 삭제 → "특허 심사 후보로 발탁되어 진행." 만 남김.
7. 2023년의 두 항목(실시간 유입 집계 / 판매자 통계 시스템)의 substring·정규식 최적화 서술 중복 → 파이프라인 구축 내용은 첫 항목에, 두 번째 항목은 배치 분리 + 프론트엔드(Context API) 중심으로 정리.
8. 사내 용어 첫 등장 시 한 줄 설명: ESM(G마켓·옥션 통합 판매자 어드민), SLS(전사 임직원 학습 세션).
9. 종결어미 통일: 프로젝트 서술은 명사형("~구축", "~단축")으로 통일 권장. 최소한 같은 항목 안에서 혼용 금지.
10. `@media print` 추가: 나브/마퀴/차트/유튜브 숨김, 섹션 페이지브레이크 방지(`break-inside: avoid`), 흑백 친화 색상. A4 PDF 저장이 목적.

---

## 7. 작업 순서 (권장 커밋 단위)

1. **토큰 교체 + 타이포 스케일** (styles.css `:root`, body, .section-title 등) — 전 페이지에 한 번에 적용됨. 데스크톱/모바일 스크린샷 확인.
2. **나브바 신설 + 교육 링크 추가** (3개 html 공통)
3. **히어로 리디자인 + 핵심 수치 스트립**
4. **프로젝트 역순 정렬 + 카드/타임라인 스타일** (kr/en 동시)
5. **섹션 배경 교차 + 다크 섹션 + scroll reveal JS**
6. **마퀴 아이콘 정리 + 푸터 로컬 아이콘화**
7. **콘텐츠 수정(§6) + @media print**
8. education.html 동기화

각 단계 후 확인: 데스크톱(1280px), 모바일(390px), 그리고 **연혁 차트가 두 페이지 모두에서 정상 렌더링되는지** (과거 모바일 회귀 이력 때문).

## 8. 하지 말 것

- 프레임워크/빌드 도구 도입 금지 (현재 정적 HTML 구조 유지, GitHub Pages 직배포).
- Chart.js 차트 재구현 금지 (톤 정리만).
- 유튜브 플레이어 DOM/JS 로직 변경 금지.
- 다크모드(prefers-color-scheme) 전면 대응은 이번 범위 아님 — 토큰 구조만 호환되게.
- 애니메이션 라이브러리(GSAP 등) 금지.

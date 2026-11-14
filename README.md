# 김민우 · Minwoo Kim

백엔드 개발 경력과 AI 활용 경험, 개인 프로젝트를 소개하는 이력서입니다.

**[이력서 보기](https://minwoo19930301.github.io/resume/)**

한국어·영어·일본어·중국어(간체)·스페인어를 지원하며, 브라우저 언어에 따라 표시됩니다. 페이지에서 직접 언어를 선택할 수도 있습니다.

우측 상단 **PDF로 저장** 버튼으로 현재 언어의 본문을 인쇄하거나 PDF로 저장할 수 있습니다. 상단 영상과 소개는 제외됩니다.

## 수정 및 빌드

본문은 `src/resume.content.json`, 페이지 구조는 `src/resume.template.html`에서 수정합니다.

```sh
node scripts/build.mjs
node --test tests/*.cjs
```

GitHub Pages로 배포합니다.

상단은 검은 화면의 스크롤 안내에서 시작해, 한 번의 스크롤 입력으로 기획·기반 구축·데이터·자동화·AI 활용 장면을 이동합니다. 모바일에는 작은 영상을 사용하고, 동작 줄이기 설정 또는 영상 로딩 실패 시 정적 이미지와 경험 목록을 표시합니다. 제목은 SUIT, 본문은 Pretendard를 사용합니다.

영상 구간·파일 경로는 `assets/builder-config.js`, 스크롤 동작은 `assets/builder-scroll.js`에서 관리합니다. 공개 페이지에는 개인 프로젝트 22개와 메타 글로벌 AI 개발자 해커톤 본선 진출, 한국지역난방공사 AI 해커톤 심사 경험을 포함했습니다.

기존 GitHub Pages 설정이 `main` 브랜치의 루트를 배포합니다. 빌드한 파일을 커밋·푸시한 뒤 실제 페이지와 영상 탐색까지 확인합니다. `release.json`은 빌드가 생성한 파일 해시로 배포 버전을 식별합니다.

```sh
node scripts/verify-deployment.mjs https://minwoo19930301.github.io/resume/
```

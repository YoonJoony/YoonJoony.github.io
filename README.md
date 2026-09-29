# YUN.LOG

Astro로 만든 백엔드·데이터 엔지니어링 학습 블로그입니다.

- 메인: 소개, 최신 개인 글 3개, News Research
- Posts: 태그 필터, 폴더별 펼침 목록, Markdown 본문
- 차콜/밝은 테마, 모바일 탐색, RSS·사이트맵
- [화면 설계](docs/blog-ui-spec.md) · [글 작성 안내](docs/writing-posts.md)

## 실행과 검사

Node.js 24를 권장합니다. 명령은 이 저장소에서 실행합니다.

```sh
npm ci
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop

npm run check
npm test
npm run build
npm run test:e2e
```

브라우저 검사는 빌드된 결과를 로컬 미리보기 서버에서 검증합니다.
macOS에서는 설치된 Google Chrome을 사용합니다.
다른 운영체제에서는 먼저 `npx playwright install chromium`을 실행하세요.
기존 4321 포트에 다른 서버가 실행 중이면 종료한 뒤 검사하세요.

## 글과 폴더

```text
src/content/blog/
├── DE Map/
│   ├── Python/파이썬 기본기/
│   ├── 기록/
│   └── SAM_AXI/2026-09/
├── BE Map/
└── Project Map/

src/content/news/       # 뉴스 원문으로 연결하는 별도 컬렉션
src/data/site.ts        # 소개 문구, 관심 분야, GitHub, 기본 이미지
src/data/categories.ts  # 최상위 카테고리 표시 이름
```

같은 폴더에 직접 작성한 글만 그 폴더 아래에 표시합니다.
하위 폴더의 글은 하위 폴더를 펼쳐서 읽습니다.
폴더의 깊이에 맞춰 카드도 함께 들여씁니다.

공개된 개인 글은 `/posts/<slug>/`에서 읽습니다.
`draft: true`인 글은 메인·Posts·직접 주소·RSS·사이트맵에 포함하지 않습니다.
초안 파일을 공개 Git 저장소에 커밋하면 소스는 저장소에서 볼 수 있습니다.

## 초기 콘텐츠

사용자가 공개를 선택한 기존 학습 글 9개를 옮겼습니다.
`09-22.md`와 `입문시 참고글.md`는 초안으로 유지했습니다.
후자는 준비 과정에서 본문이 추가된 것을 확인했으나, 이번에 선택한 9개 외의 글이어서 초안으로 남겼습니다.
중복되었던 파이썬 공부 방향 글의 slug는 `python-study-roadmap`으로 변경했습니다.
원본 `copy_folder`는 이동하거나 삭제하지 않았습니다.

기존 루트의 기본 템플릿 글 6개는 별도 `legacy` 컬렉션으로 보관합니다.
기존 `/blog/<id>/`는 `/posts/archive-<id>/`로 이동하며,
이전 글은 새 메인·카테고리·RSS·사이트맵에 섞이지 않습니다.

News Research에는 실제 뉴스 데이터가 없어 준비 중 화면이 표시됩니다.
뉴스 자동 수집·요약·발행은 후속 개발 범위입니다.

## 배포

`main`에 push하면 기존 GitHub Actions 워크플로가 빌드 후 GitHub Pages에 배포합니다.
사이트 주소: https://yoonjoony.github.io/

## 검증 범위

- 단위 검사: 폴더 직속 글/깊이, 한글 경로, 숫자 순서, slug 충돌, 태그와 URL
- 브라우저 검사: 레이아웃 정렬, 이미지, 카테고리와 본문, 태그, 히스토리, 테마, 모바일, JavaScript 없는 읽기
- 공개 범위 검사: 공개 글 9개 RSS, 초안 URL 404, 초안과 이전 템플릿의 목록·사이트맵 제외

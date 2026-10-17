---
title: "클로드 스킬"
description: "클로드 스킬"
pubDate: 2026-10-13
slug: cl-usage03
tags: [AI, Claude]
heroImage: ../../../assets/claude-coding.gif
draft: false
---

Claude Skill 관련 정보를 공식 문서와 Reddit·기사 등에서 찾아서 표로 정리해볼게.

공식 문서, Reddit 흐름을 정리한 기사(Snyk, Geekflare 등), 개발자 블로그를 교차해서 표로 정리했어.

## 1. Claude Skill이 뭔가

| 항목 | 내용 |
|---|---|
| 정의 | 지시문·설명·보조 리소스를 SKILL.md 파일로 묶어 두면, 관련 작업이 들어왔을 때 Claude가 스스로 꺼내 쓰는 확장 기능. 한마디로 "업무 매뉴얼 폴더" |
| 등장 시기 | 2025년 10월 16일 Anthropic 엔지니어링 블로그로 공개, 12월 18일 오픈 표준으로 전환 |
| 작동 원리 (점진적 로딩) | 시작 시에는 각 스킬의 이름과 설명(스킬당 약 100토큰)만 읽고, 작업과 맞으면 SKILL.md 본문 전체를, 스크립트·참고자료는 실제로 필요할 때만 불러옴. 그래서 스킬을 수십 개 깔아도 컨텍스트가 덜 낭비됨 |
| 핵심 포인트 | description 필드가 중요함. 설명이 모호하면 잘 안 불리고, 트리거 문구가 명확하면 안정적으로 작동 |
| 사용 가능한 곳 | Claude.ai, Claude Code, Agent SDK, API 전반 |
| 호환성 | Agent Skills 표준을 Claude Code, OpenAI Codex, Cursor, Gemini CLI 등이 채택해서 다른 도구로도 옮겨 쓸 수 있음 |

**다른 기능과의 차이** (Reddit에서 가장 많이 헷갈리는 부분)

| 구분 | 역할 |
|---|---|
| CLAUDE.md | 매 세션 항상 로드되는 프로젝트 메모리 (예: "이 프로젝트는 pytest 사용") |
| MCP 서버 | API·DB·외부 서비스를 호출하게 해주는 실행 중인 프로세스 |
| Skill | Skill은 행동 방식을 바꾸고, MCP는 할 수 있는 능력을 바꿈 |
| 플러그인 | 스킬·에이전트·훅·MCP 서버를 묶어 배포하는 패키지 |

## 2. 사용법

| 환경 | 방법 |
|---|---|
| Claude.ai (앱) | Customize > Skills 메뉴에서 관리. ZIP 업로드도 가능 |
| Claude Code (개인용) | ~/.claude/skills/<스킬이름>/SKILL.md — 모든 저장소에서 사용 |
| Claude Code (팀/프로젝트용) | .claude/skills/<스킬이름>/SKILL.md — 코드와 함께 커밋해서 팀 공유 |
| 플러그인 설치 | `/plugin marketplace add owner/repo` 후 `/plugin menu` |
| 호출 방식 | Claude Code에서는 커스텀 슬래시 명령이 Skills로 통합돼서, `/스킬이름`으로 직접 부르거나 Claude가 관련 있다고 판단하면 자동 로드 |
| 직접 만들기 | skill-creator가 트리거 문구·단계·참고자료를 인터뷰한 뒤 SKILL.md를 써줌 |

⚠️ **보안 주의**: Snyk가 ClawHub·skills.sh의 스킬 3,984개를 검사했더니 13.4%에서 심각한 보안 문제(악성코드, 프롬프트 인젝션, 비밀키 노출)가 나왔음. 설치 전에 SKILL.md와 스크립트를 꼭 읽어봐.

## 3. 기획 자료용 Skill (아이디어 추출 / 기획 정리)

| 스킬 | 출처 | 용도 |
|---|---|---|
| brainstorming | obra/superpowers | 기능 작업 전에 의도·요구사항·설계를 구조적으로 탐색하고 짧은 설계 메모를 작성, 코드 전 승인 요청 |
| Grill Me | Matt Pocock | 아이디어·아키텍처·구현 계획의 약점과 사각지대를 공격적으로 짚어줌 |
| brainstorm-ideas | borghei/Claude-Skills | PM·디자이너·엔지니어 세 관점(Product Trio)과 기회 솔루션 트리로 아이디어를 생성·평가·우선순위화 |
| bmad-brainstorm | aj-geddes/claude-code-bmad-skills | SCAMPER, SWOT, 5 Whys, 마인드맵, 6색 모자 등 기법으로 세션을 진행하고 결과를 보고서로 정리 |
| Product Management 플러그인 | Anthropic 공식 (knowledge-work-plugins) | /write-spec, /roadmap-update, /competitive-brief, /synthesize-research 등 PRD·로드맵·경쟁 분석·리서치 종합을 다루는 6개 스킬 |
| PM-Skills | product-on-purpose/pm-skills | 발견→정의→개발→전달→측정→반복 6단계에 걸친 24개 스킬, 앞 단계 결과가 다음 단계로 이어지게 설계 |
| Ralph (/prd) | snarktank/ralph | 기능 설명을 받으면 객관식 확인 질문 3~5개를 던진 뒤 목표·유저스토리·인수조건·비목표·성공지표까지 담은 PRD 생성 |
| JTBD | wondelai/skills | 고객이 제품을 "고용하는" 이유를 기능·감정·사회적 측면에서 분석 |

**추천 조합**: 구현 전에 Grill Me, 구현 후에 Handoff를 써서 기획→실행 흐름을 완성하는 방식이 커뮤니티에서 자주 언급됨.

## 4. 개발자들이 자주 쓰는 Skill

| 스킬 | 출처 | 용도 |
|---|---|---|
| Superpowers (묶음) | obra/superpowers | 가장 인기 있는 스킬 프로젝트로, 스펙 도출→설계→TDD 중심 계획→서브에이전트 실행→코드리뷰→완료 전 검증까지 개발 전 과정을 엮은 방법론 |
| systematic-debugging | superpowers | 재현→원인 가설→최소 테스트로 검증→근본 원인만 수정의 4단계 강제 |
| test-driven-development | superpowers | 실패하는 테스트를 먼저 작성·실행한 뒤 구현 |
| writing-plans / executing-plans | superpowers | 모호한 요청을 번호 매긴 계획으로 바꾸고, 체크포인트를 두며 한 단계씩 실행 |
| verification-before-completion | superpowers | 완료 보고 전에 실제 앱이나 테스트를 끝까지 돌려 증거를 제시 |
| planning-with-files | OthmanAdi | task_plan.md, findings.md, progress.md 세 파일을 디스크에 써서 긴 작업 중에도 목표를 잃지 않게 함 |
| frontend-design | Anthropic 공식 | 뻔한 AI 기본 스타일이 아닌 개성 있는 UI를 원할 때 |
| mcp-builder | Anthropic 공식 | MCP 서버를 처음부터 끝까지 스캐폴딩 |
| skill-creator | Anthropic 공식 | 일주일에 두 번 이상 반복하는 작업을 스킬로 만들 때 |
| GitHub PR Review | aidankinzett | 리뷰 코멘트를 모아서 보여주고 승인받은 뒤 한 번에 게시 |
| web-quality-skills | Addy Osmani | 성능, Core Web Vitals, 접근성, SEO 감사 |
| 문서 스킬 (docx/xlsx/pptx/pdf) | Anthropic 공식 | Reddit 스레드에서 가장 먼저 설치하는 스킬로 꼽히고, 그 외엔 한 가지 워크플로를 끝까지 처리하는 좁은 스킬이 가장 호평받음 |

**설치 순서 추천** (Amazon 개발자 블로그): superpowers 플러그인을 먼저 깔고(위 스킬 중 7개 포함), 그다음 anthropics/skills를 받아 skill-creator와 mcp-builder를 확보. 그리고 하나 깔고 2주 써본 뒤 다음 걸 깔라는 조언이 인상적이야.

**스킬 찾는 곳**: Skills.sh, Anthropic 공식 저장소, Awesome Claude Skills에서 시작하고, 새로운 실험적 스킬은 Reddit(r/ClaudeSkills)과 GitHub에 먼저 올라옴.

---

참고로 이전 대화 흐름이랑 연결해서 보면, **brainstorming, Grill Me, systematic-debugging** 이 세 개는 "1차원적으로 넘어가지 않고 다른 시각에서 따져보기"를 강제하는 스킬이라 네가 말한 고민이랑도 잘 맞아. 다만 스킬이 생각을 대신해주는 게 아니라 생각하는 *틀*을 주는 거니까, 결과물을 그냥 받지 말고 "왜 이렇게 나왔지?"를 한 번씩 따라가 보는 용도로 쓰면 좋을 것 같아.

Sources:
- [Agent Skills Overview — Claude Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [What Are Claude Skills: Complete Guide 2026 — Verdent](https://www.verdent.ai/guides/what-are-claude-skills-guide-2026)
- [Claude Skills Tutorial — Sid Bharath](https://sidbharath.com/claude-skills/)
- [Top 8 Claude Skills for Developers — Snyk](https://snyk.io/articles/top-claude-skills-developers/)
- [Top 7 Claude Skills for Product Managers — Snyk](https://snyk.io/articles/7-claude-skills-product-managers/)
- [10 Best Claude Skills for Developers in 2026 — Rabinarayan Patra](https://www.rabinarayanpatra.com/blogs/best-claude-skills-for-developers-2026)
- [Where to Find Claude Code Skills — Geekflare](https://geekflare.com/guides/find-claude-code-skills/)
- [Best Claude Skills Reddit — MPG ONE](https://mpgone.com/best-claude-skills-reddit/)
- [12 Best Claude Code Skills — Powerdrill](https://powerdrill.ai/blog/best-claude-code-skills-to-boost-developer-productivity)
- [brainstorm-ideas — ClaudeSkills.info](https://claudeskills.info/skill/brainstorm-ideas/)
- [bmad-brainstorm — ClaudeSkills.info](https://claudeskills.info/ko/skills/aj-geddes/claude-code-bmad-skills/bmad-brainstorm/)
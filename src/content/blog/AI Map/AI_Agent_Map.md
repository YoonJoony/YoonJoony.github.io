---
title: "AI Agent 공부 방향"
description: "AI Agent 직종 전환을 위한 공부 방향"
pubDate: 2026-10-14
slug: ai-agent-map
tags: [AI, Study]
heroImage: ../../../assets/what-is-agentic-ai.avif
draft: false
---

# AI Agent 엔지니어 취업 공부 계획

## 요약

내가 부족한 가장 큰 공백은 Python, Tool Calling, Vector DB, 평가(Eval)다. 1년 10개월의 Java/Spring/MySQL 경력은 약점이 아니라 AI만 다룬 지원자와 구분되는 차별화 포인트다. 목표 기간은 약 4\~5개월, 결과물은 깊이 있는 포트폴리오 프로젝트 1개다.

## 기존 항목 분석

4개 항목 중 "다양한 AI 모델 사용"은 너무 넓어서 구체화가 필요하고, 나머지는 핵심을 짚고 있다.

| 기존 항목 | 평가 | 구체화 |
| --- | --- | --- |
| 다양한 AI 모델 사용 | 너무 넓음 | OpenAI·Anthropic·Gemini API 직접 호출, Ollama 로컬 모델, 비용·속도·품질 기준으로 모델 선택 |
| NLP, RAG 서비스 구축 | 핵심 맞음 | 전통 NLP(형태소 분석 등)보다 임베딩·청킹·벡터DB·검색 품질이 실제 요구사항 |
| AI 오케스트레이션 설계 | 맞음 | 워크플로 vs 에이전트 구분, 라우팅, 멀티 에이전트 설계 |
| LangGraph + LLM 에이전트 | 맞음 | State, 조건 분기, 메모리, 사람 승인(HITL)까지 |

## 추가해야 할 항목

[PwC AI Engineer 공고](https://www.pwc.com/kr/ko/career/experienced/r260519.html)만 봐도 Tool Use·Function Calling, MCP 도구 서버, 에이전트 메모리와 Context Engineering, RAG 품질 평가, Vector DB, RAGAS 같은 평가 프레임워크를 요구한다. 아래 9개를 기존 목록에 더한다.

| 추가 항목 | 왜 필요한가 | 우선순위 |
| --- | --- | --- |
| Python + FastAPI | 대부분 공고가 Python 기반. 지금 가장 큰 공백 | ★★★ |
| Tool / Function Calling | 에이전트의 본질. LLM이 함수를 부르는 구조 | ★★★ |
| Vector DB (pgvector 추천) | MySQL 경험이 있어 Postgres 확장인 pgvector가 진입장벽이 낮음 | ★★★ |
| 평가(Eval) | "만들었다"가 아니라 "몇 % 개선했다"를 말할 수 있어야 함. 신입 포트폴리오의 핵심 차별점 | ★★★ |
| MCP | 도구 연결의 표준. 공고에 점점 자주 등장 | ★★ |
| 메모리 / Context Engineering | 긴 대화, 사용자별 기억 관리 | ★★ |
| 관측(Observability) | LangSmith·Langfuse로 에이전트가 왜 그렇게 답했는지 추적 | ★★ |
| 고급 RAG | 하이브리드 검색, 리랭킹, Agentic·Corrective RAG | ★★ |
| 배포·운영 | Docker, 스트리밍(SSE), 비용·지연시간 관리, 프롬프트 인젝션 방어 (기존 강점) | ★★ |

## 이론 vs 실전 분류

이론은 개념만 이틀 안에 끝내고, 나머지 시간은 전부 코드로 쓴다.

| 구분 | 항목 | 방법 |
| --- | --- | --- |
| 이론은 개념만 (1\~2일) | LLM·토큰·임베딩 개념, RAG 개념, 에이전트 디자인 패턴 | 글 하나 읽고 내 말로 3줄 요약 |
| 무조건 실전 | Python, API 호출, Tool Calling, RAG 파이프라인, LangGraph, MCP, 평가, 배포 | 강의를 따라 코드를 친 직후, 강의에 없는 변형을 직접 만들어보기 |
| 지금은 보류 | ML 수학, 모델 학습·파인튜닝, PyTorch 심화, 전통 NLP | 에이전트 서비스 개발자 신입에게는 우선순위 낮음. 취업 후 필요하면 학습 |

이론 중 꼭 읽을 글은 Anthropic의 [Building effective agents](https://www.anthropic.com/research/building-effective-agents) 하나다. 워크플로(미리 정한 코드 경로)와 에이전트(LLM이 스스로 과정을 결정)를 구분하고, 내부 동작을 이해하기 전에는 프레임워크를 피하라고 권한다. 면접의 "왜 여기에 에이전트를 썼나요?"에 답하는 근거가 된다.

## 공부 순서 (약 4\~5개월)

6단계, 총 15\~16주다. 각 단계는 완료 기준을 통과해야 다음으로 넘어간다.

| 단계 | 기간 | 할 것 | 완료 기준 |
| --- | --- | --- | --- |
| 0. Python 전환 | 1\~2주 | Java와 비교하며 문법, 타입힌트, async, Pydantic, FastAPI | Spring으로 만들던 CRUD API를 FastAPI로 재작성 |
| 1. LLM 맨손 호출 | 2주 | 프레임워크 없이 API 직접 호출, 구조화된 출력, Tool Calling 루프 직접 구현 | 도구 2개를 쓰는 미니 에이전트를 순수 코드로 완성 |
| • 2. RAG | 3주 | 문서 로딩 → 청킹 → 임베딩 → pgvector → 검색 → 생성, 이후 하이브리드 검색·리랭킹 | RAGAS로 점수 측정 후 청킹 방식을 바꿔 점수 비교 |
| 3. LangGraph | 3주 | State, 노드, 조건 분기, 메모리, HITL, Agentic RAG | 1단계 에이전트를 LangGraph로 다시 만들고 차이점 정리 |
| 4. MCP + Spring AI | 2주 | MCP 서버·클라이언트, Spring AI로 기존 Java 서비스를 도구로 노출 | Spring Boot API를 MCP 도구로 만들어 에이전트가 호출 |
| 5. 포트폴리오 완성 | 4주 | 관측(LangSmith/Langfuse), 평가 자동화, Docker 배포, README | 배포 완료 + 성능 수치가 담긴 README |

1단계를 맨손으로 하는 이유: LangGraph부터 시작하면 그래프 그리는 법만 알고 에이전트가 실제로 어떻게 도는지는 모르게 된다. 면접에서 바로 드러나는 부분이다.

진행 체크:

- [ ] 0단계 Python 전환
- [ ] 1단계 LLM 맨손 호출
- [ ] 2단계 RAG
- [ ] 3단계 LangGraph
- [ ] 4단계 MCP + Spring AI
- [ ] 5단계 포트폴리오 완성

## 포트폴리오 프로젝트

여러 개를 얕게 만들지 않고, 기존 경력을 살린 "사내 문서 Q&A + 업무 자동화 에이전트" 하나를 깊게 만든다.

| 구성 요소 | 역할 |
| --- | --- |
| Spring Boot (기존 강점) | 사용자·권한·업무 데이터 API |
| Python + LangGraph | 질문 분류 → RAG 검색 또는 업무 도구 실행 → 답변 검증 |
| MCP 서버 | Spring API를 에이전트가 쓸 수 있는 도구로 노출 |
| 평가 파이프라인 | 질문 50개 테스트셋으로 개선 전후 수치 비교 |
| 관측 | 실패 케이스를 추적하고 개선한 기록 |

README에 "Faithfulness 0.62 → 0.84, 청킹 전략 변경과 리랭커 추가로 개선" 같은 수치 문장이 들어가야 한다(예시 수치). AI만 다룬 지원자는 Spring 운영 경험이 없고, 백엔드 지원자는 AI 경험이 없다. 둘 다 가진 것이 이 포지션의 강점이다.

## 참고 자료

| 단계 | 자료 | 특징 |
| --- | --- | --- |
| 이론 | [Anthropic — Building effective agents](https://www.anthropic.com/research/building-effective-agents) | 필독 1순위. 워크플로 패턴과 에이전트 구분 |
| 1단계 | [DeepLearning.AI — Agentic AI (Andrew Ng)](https://www.deeplearning.ai/courses/agentic-ai) | 프레임워크 없이 순수 Python으로 4가지 디자인 패턴 학습. 유료(Pro 멤버십) |
| 1\~3단계 | [테디노트 랭체인 한국어 튜토리얼 (위키독스)](https://wikidocs.net/book/14314) | 한국어, LangChain부터 LangGraph까지. 유튜브 "테디노트" 채널 병행 |
| 3단계 | [LangChain Academy — Introduction to LangGraph](https://academy.langchain.com/) | 무료 공식 강의, 6\~8시간. 상태, 영속성, HITL, 스트리밍, 배포 |
| 3단계 | DeepLearning.AI — AI Agents in LangGraph | LangChain Academy 전 맛보기. 무료, 약 90분 |
| 4단계 | [Spring AI 에이전트 패턴 블로그](https://spring.io/blog/2025/01/21/spring-ai-agentic-patterns), [예제 코드](https://github.com/spring-projects/spring-ai-examples/tree/main/agentic-patterns) | Anthropic 패턴을 Java로 구현 |
| 4단계 | [Piotr Minkowski — MCP with Spring AI](https://piotrminkowski.com/2025/03/17/using-model-context-protocol-mcp-with-spring-ai/) | Spring Boot 앱을 MCP 서버로 만들어 @Tool 메서드 노출 |
| 2단계 | RAGAS 공식 문서 (docs.ragas.io) | RAG 평가 지표 실습 |

## 단계별 회고 습관

각 단계가 끝날 때마다 "왜 이 방식을 골랐고, 다른 방식이면 뭐가 달라졌을까"를 3줄씩 적는다. 쌓이면 면접 답변이 되고, 깊이 있게 생각하는 습관 훈련도 된다.

## Sources

- [ ] [PwC Korea — AI Engineer 채용](https://www.pwc.com/kr/ko/career/experienced/r260519.html)
- [ ] [Anthropic — Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [ ] [DeepLearning.AI — Agentic AI](https://www.deeplearning.ai/courses/agentic-ai)
- [ ] [LangChain Academy](https://academy.langchain.com/)
- [ ] [AI Agent Rank — Introduction to LangGraph 리뷰](https://aiagentrank.io/learn/course/langchain-academy-langgraph-intro)
- [ ] [테디노트 랭체인 노트 (위키독스)](https://wikidocs.net/book/14314)
- [ ] [Piotr Minkowski — Using MCP with Spring AI](https://piotrminkowski.com/2025/03/17/using-model-context-protocol-mcp-with-spring-ai/)

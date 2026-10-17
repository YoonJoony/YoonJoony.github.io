---
title: "클로드 코드 토큰 별 비용 & 목적에 맞는 모델 사용법"
description: "클로드 코드 모델 관련"
pubDate: 2026-10-13
slug: cl-usage01
tags: [AI, Claude]
heroImage: ../../../assets/claude-coding.gif
draft: false
---
## Claude 모델 가격 및 성능 비교 (2026년 10월 기준)

가격은 Anthropic 공식 가격표를, 성능은 BenchLM의 종합 점수와 벤치마크 값을 사용했습니다. 두 자료 모두 조회 시점 기준이며, 가격이나 점수는 바뀔 수 있으니 실제 도입 전에 [claude.com/pricing](https://claude.com/pricing)에서 다시 확인하세요.

### 1. 가격 (USD, 100만 토큰당)

| 모델 | 포지션 | 입력 | 출력 | 캐시 읽기 | 캐시 쓰기 (5분) |
|---|---|---|---|---|---|
| **Fable 5.1** | 최상위 (추가 안전장치 포함) | $10 | $50 | $0.25 | $12.50 |
| **Opus 5.5** | 최고 성능 | $4 | $20 | $0.20 | $5.00 |
| **Sonnet 5.5** | 성능과 비용의 균형 | $2 | $10 | $0.10 | $2.50 |
| **Haiku 5.5** (100k 토큰 이하) | 빠르고 저렴 | $0.10 | $0.50 | $0.01 | $0.125 |
| **Haiku 5.5** (100k 토큰 초과) | 긴 입력용 | $0.50 | $2.50 | $0.05 | $0.625 |
| Mythos 5.1 | 제한된 접근 | $10 | $50 | $0.25 | $12.50 |

- Batch API를 쓰면 입력과 출력 모두 50% 할인됩니다.
- Haiku 5.5는 요청 전체 프롬프트가 100k 토큰을 넘으면 높은 단가가 적용됩니다.
- 미국 내 전용 추론(`inference_geo: "us"`)은 표시 가격의 1.1배입니다.

### 2. 성능 (BenchLM 기준)

| 모델 | 종합 점수 (순위) | SWE-bench Pro | ARC-AGI-2 | HLE (도구 없음) | Terminal-Bench 4.0 |
|---|---|---|---|---|---|
| **Opus 5.5** | 85.43 (#1 / 891) | 89.9% | 91.7% | 64.4% | - |
| **Sonnet 5.5** | 83.92 (#4 / 889) | 81.3% | - | 56.9% | 70.6% |
| **Fable 5.1** | 82.09 (#5 / 889) | 81.2% | 90% | 60.9% | 55.8% |
| **Haiku 5.5** | 64.19 (#37 / 891) | - | - | 45.9% | 39.2% |

- Fable 5.1은 GPQA Diamond 93.4%, MMLU-Pro 92.4%(Vals 기준)입니다.
- BenchLM은 제3자 집계 사이트라 모든 벤치마크를 채우지 않았고, 점수도 조회 시점에 따라 조금씩 다르게 나옵니다(예: Sonnet 5.5가 한 페이지에서는 83.92, 비교 목록에서는 82.46). 방향만 참고하고, 정확한 수치는 Anthropic 공식 발표로 확인하는 것이 좋습니다.

### 3. 비용 대비 해석

- **Sonnet 5.5**는 Fable 5.1보다 입력·출력 단가가 각각 1/5 수준인데, 종합 점수는 오히려 조금 높게 나옵니다. 대부분의 업무에서 가성비가 가장 좋은 선택입니다.
- **Opus 5.5**는 가장 어려운 추론·코딩 작업용입니다. 비용은 Sonnet의 2배입니다.
- **Haiku 5.5**는 분류, 요약, 대량 처리처럼 단순하고 반복적인 작업에 적합합니다. 100만 입력 토큰당 $0.10이라 비용 부담이 가장 작습니다.
- 예시로 입력 100만 토큰, 출력 100만 토큰을 처리하는 비용은 Fable 5.1 $60, Opus 5.5 $24, Sonnet 5.5 $12, Haiku 5.5 $0.60입니다.

Sources:
- [Claude Platform Docs – Pricing](https://platform.claude.com/docs/en/about-claude/pricing?hsLang=en)
- [BenchLM – Claude Opus 5.5](https://benchlm.ai/md/models/claude-opus-5-5.md)
- [BenchLM – Claude Sonnet 5.5](https://benchlm.ai/md/models/claude-sonnet-5-5.md)
- [BenchLM – Claude Haiku 5.5](https://benchlm.ai/md/models/claude-haiku-5-5.md)
- [BenchLM – Claude Fable 5.1](https://benchlm.ai/md/models/claude-fable-5-1.md)
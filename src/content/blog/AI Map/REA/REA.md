---
title: "REA?"
description: "REA(Reverse Engineer Anything)?"
pubDate: 2026-10-17
slug: rea-00
tags: [AI]
draft: false
---

> 출처: [GitHub - morluto/rea](https://github.com/morluto/rea) README (2026-10-17 기준 정리)

**한 줄 요약:** AI 에이전트가 소스 코드 없는 소프트웨어를 앱 동작부터 네이티브 바이너리까지 분석하게 해 주는 오픈소스 리버스 엔지니어링 도구.
분석은 로컬에서 실행됨

**목표:** 남이 만든 앱의 기능을 에이전트가 들여다보고, 근거와 함께 동작 원리를 설명하고, 내 프로젝트에 비슷하게 구현하도록 돕는 것

## 주요 기능
(읽어만 보기)
- **네이티브 바이너리 분석:** 의사코드(pseudocode), 어셈블리, 문자열, 심볼, 호출 관계, 참조
- **정적 분석:** JavaScript/Electron, .NET, Go, Rust, WASM, EVM 바이트코드, SQLite, 패킷 캡처
- **런타임 관찰:** 웹사이트, 프로세스, Android 기기
- **근거 기반 결과:** 결론마다 근거와 한계를 같이 제시

## 분석 대상
(읽어만 보기)
| 분류 | 대상 |
|---|---|
| 바이너리 | 네이티브 코드, Go, Rust, WASM, EVM, ELF, Linux 크래시 기록 |
| 앱 | JS/Electron, .NET, Android APK, Flutter, Apple 앱 번들 |
| 웹 | 페이지 구조, 스크립트, 네트워크(Chrome 계열), HAR/SAZ 캡처 |
| 기타 | adb로 연결한 기기, 펌웨어, pcap, 로직 분석기 기록, 프로세스 동작 |

## 구성

- **MCP 서버:** 에이전트가 MCP로 REA 도구를 호출
- **CLI (`rea`):** 같은 기능을 터미널에서 실행
- **분석 엔진:** 이미 설치된 **Hopper, Ghidra, IDA**를 사용. 그 밖에 objdump, Rizin, JEB, JADX, Apktool, pwntools, adb 등을 연결 가능. 이 도구들은 REA가 직접 설치하지 않음(Hopper만 승인 시 설치 가능)
- **지원 에이전트:** Claude Code, Codex, Cursor, Gemini CLI 등 로컬 MCP를 지원하는 에이전트

## 설치와 사용

1. Node.js 22.19+ / 24.11+ / 26+ 설치
2. 설정 실행 후 에이전트 선택, 변경 내용 확인, 에이전트 재시작

   ```bash
   npx rea-agents setup
   ```

3. 에이전트에게 분석을 요청하거나 CLI로 실행

   ```bash
   npx -y rea-agents@latest analyze-javascript-application <경로> --json
   ```

4. (선택) 전역 설치하면 `rea` 명령 사용 가능. 업데이트는 `rea update`

   ```bash
   npm install --global rea-agents
   ```

## 라이선스

- REA 자체 코드는 **MIT**, 서드파티 구성요소는 각자의 라이선스를 따름
- IDA Pro, Hopper, JEB 같은 상용 도구는 합법적으로 구한 라이선스가 있어야 함

## 주의할 점

- 네이티브 분석에는 Hopper, Ghidra, IDA 중 하나가 필요. JS나 .NET 정적 분석에는 필요 없음
- Windows에서 Ghidra 지원은 아직 실험 단계
- 런타임 캡처는 내 사용자 권한으로 대상을 실제로 실행하거나 조작함
- macOS에서는 Hopper를 처음 실행할 때 라이선스/데모 창을 먼저 처리해야 함
- REA는 로컬에서 분석하지만, 에이전트가 쓰는 모델 제공사에는 별도의 데이터 정책이 적용됨
- 이름이 비슷한 저장소나 README를 복사한 가짜에 주의. 공식 경로는 `morluto/rea` 저장소, `rea.tools` 사이트, npm 패키지 `rea-agents`
- 사용 범위는 합법적인 연구, 교육, 상호운용성, 소프트웨어 보존, 그리고 내가 소유했거나 권한이 있는 소프트웨어 분석으로 제한. 크랙 도구, 훔친 키, 라이선스 우회는 허용되지 않음

## 참고

저장소 페이지에는 스타 약 29만 개, 포크 약 7만 개로 표시됐지만, README 안에는 "25만 스타"라고 적혀 있다. 이달 초 트렌딩에 오른 프로젝트치고는 매우 높은 수치라 요약 과정에서 잘못 옮겨졌을 수 있으니 저장소에서 직접 확인할 것.
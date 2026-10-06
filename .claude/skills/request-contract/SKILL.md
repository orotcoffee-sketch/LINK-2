---
name: request-contract
description: 개발 요청의 해석과 실행 범위를 통제하는 공통 작업 계약 — 요청 분류, 명세 확인, Source of Truth, 완료 조건(Acceptance Criteria), 추론·범위 확장 방지, 완료 보고 형식. 기능·버그·디자인 등 모든 개발 요청을 시작할 때 가장 먼저 사용.
---

# request-contract — 무엇을, 어디까지 하는가

확정된 요구사항만 구현한다. 요청을 추론하거나 확장하지 않는다. 디자인 값·Next.js 구현 방식·QA 항목은 이 문서에 복사하지 않고 각 Skill을 참조한다.

## 0. Skill 역할 지도

| Skill | 역할 |
|---|---|
| **request-contract** | 요청 범위, 데이터 기준, 완료 조건, 추론 방지 |
| `design-theme` | UI/디자인 규칙 |
| `nextjs-rules` | Next.js 구현 규칙 |
| `architecture-review` | 구조/책임/의존성 검토 |
| `bug-fix` | 버그 수정 절차 |
| `code-review` | 코드 품질 검토 |
| `refactor` | 동작을 유지한 구조 개선 |
| `qa-check` | 검증/QA |

요청 유형별 조합 (request-contract는 항상 먼저):

| 요청 유형 | 사용 Skill |
|---|---|
| BUG | request-contract → bug-fix → qa-check |
| FEATURE (UI 포함) | request-contract → design-theme + nextjs-rules → qa-check |
| FEATURE (데이터·구조 변경) | request-contract → architecture-review → nextjs-rules → qa-check |
| DESIGN | request-contract → design-theme → qa-check |
| REFACTOR | request-contract → architecture-review → refactor → qa-check |
| 리뷰 | code-review (+ 필요 시 architecture-review) |

## 1. 기본 실행 규칙

- 현재 프로젝트 구조를 먼저 확인한다.
- 기존 정상 기능을 유지한다.
- 관련 없는 파일은 수정하지 않는다.
- 요청 하나 때문에 전체 구조를 재작성하지 않는다.
- 요청하지 않은 기능, 리팩터링, 라이브러리를 추가하지 않는다.
- 기존 컴포넌트·함수·타입·데이터 구조를 우선 재사용한다.
- 같은 데이터를 표현하는 중복 state를 만들지 않는다.
- 특정 폴더명·링크명·URL 같은 실제 값을 하드코딩하지 않는다.
- 데이터 관계는 표시 이름이 아니라 id 기준으로 처리한다.
- 확정할 수 없는 요구사항은 추론해서 구현하지 않고 `NEEDS_CONFIRMATION`으로 표시한다. 확정된 부분만 구현한다.

## 2. 요청 분석

작업 전 요청을 BUG / FEATURE / DESIGN / REFACTOR / QA로 구분한다. 복수 유형이면 각각 명시한다.

## 3. 요청 명세 확인

구현 전에 가능한 범위에서 확인한다.

요청 목적 · 현재 상태 · 대상 화면 · 대상 컴포넌트 · 관련 데이터 · 관련 기존 기능 · Source of Truth · 데이터 관계 · 사용자 입력 · 정확한 동작 순서 · 기대 출력 · 상태 변화 · 데이터 지속성 · 예외 상황 · 영향 범위 · 영향 금지 범위 · Non-goals · Acceptance Criteria · 테스트 케이스

코드에서 확정 가능한 정보는 직접 확인한다. 코드와 요청만으로 확정할 수 없는 내용은 임의로 결정하지 말고 정확히 `NEEDS_CONFIRMATION`으로 표시한다.

## 4. Source of Truth

- 기존 데이터의 실제 Source of Truth를 먼저 확인한다.
- 같은 정보를 위한 복제 state를 만들지 않는다. 파생 가능한 데이터는 원본에서 계산한다.
- 표시 이름을 관계 식별자로 쓰지 않는다. id가 있으면 id를 쓴다.
- 기존 데이터 구조를 바꿔야 하면 영향 범위를 먼저 확인한다.

## 5. 상태 변화

기능 동작은 가능하면 아래 흐름으로 정의하고, 어떤 state/data가 바뀌는지 확인한다.

`BEFORE → USER ACTION → STATE/DATA CHANGE → DERIVED DATA → UI RENDER → RESULT`

## 6. 데이터 지속성

사용자가 저장하는 데이터는 새로고침 후 유지 여부, 저장·수정·삭제 시점, 기존 저장 데이터와의 호환성을 확인한다. 현재 저장 방식을 요청 없이 다른 방식으로 교체하지 않는다.

## 7. 예외 처리

해당 기능과 관련된 경우에만 확인한다: 빈 데이터 · 잘못된 입력 · 중복 입력 · 존재하지 않는 id · 실패 상태 · 새로고침 · 삭제된 데이터 참조. 관련 없는 예외 처리를 임의로 추가하지 않는다.

## 8. UI 상태

필요한 경우에만 구현한다: Default · Hover · Focus · Active/Selected · Disabled · Loading · Empty · Error · Success. 값과 모양은 `design-theme`, 구현 방식은 `nextjs-rules`를 따른다.

## 9. 영향 범위

각 작업에서 "변경되어도 되는 영역"과 "변경되면 안 되는 영역"을 구분한다. 관련 없는 UI·데이터·기능은 현재 상태를 유지한다.

## 10. 기본 Non-goals

- 요청하지 않은 기능 추가, UI 변경, 데이터 구조 변경, 외부 라이브러리 추가
- 요구하지 않은 대규모 리팩터링
- 기능 범위의 임의 확대

## 11. Acceptance Criteria

완료 여부는 설명이 아니라 검증 가능한 조건으로 판단한다. 가능하면 `AC-01`, `AC-02` … 형태로 정리하고, 충족되지 않으면 완료로 보고하지 않는다.

## 12. 테스트 규칙

가능한 경우 `TEST — 사전 상태 / 사용자 행동 / 기대 결과` 형식으로 검증하고, 기존 관련 기능의 회귀 테스트도 수행한다. 점검 항목 자체는 `qa-check`를 따른다.

## 13. Definition of Done

- Acceptance Criteria 충족, 지정 테스트 통과
- 기존 관련 기능 회귀 없음, 요청하지 않은 변경 없음
- 새 console error 없음, 새 build/type 오류 없음
- 미검증 내용을 검증 완료라고 표현하지 않음

## 14. 완료 보고

짧게, 이 순서로 보고한다.

1. 작업 분류 2. 수정 파일 3. 파일별 수정 이유 4. 실제 구현 내용 5. 데이터 흐름 변화 6. Acceptance Criteria 결과 7. 테스트 결과 8. 회귀 테스트 결과 9. 미검증 항목 10. `NEEDS_CONFIRMATION` 항목

## 15. 링크 관리 프로젝트 고정값

- 폴더와 링크 관계는 `folder.id` ↔ `link.folderId` 기준. folder name은 표시용.
- All은 전체 링크를 표시한다. 빈 폴더도 정상 선택할 수 있고, 빈 결과는 Empty State를 표시한다.
- 사용자 저장 데이터는 현재 persistence 방식을 유지한다.
- 링크 카드 액션 버튼은 정확히 4개: ① 공유 ② URL 복사 ③ 수정 ④ 삭제. 별도 사이트 열기 버튼은 만들지 않는다.
- 삭제 버튼만 error 스타일을 사용한다.
- 라이트모드를 유지한다.

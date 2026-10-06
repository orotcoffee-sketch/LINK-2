---
name: qa-check
description: UI 변경 후 접근성·상호작용 검증 체크리스트 — 명암비 실측, 키보드(Tab, focus-visible), ARIA, Modal 포커스, 터치 영역, 색 외 상태 전달, reduced-motion. 구현을 마친 뒤 점검할 때 사용. 값은 design-theme, 구현 방식은 nextjs-rules.
---

# qa-check — 제대로 됐는지 어떻게 확인하는가

> 작업 범위와 Skill 조합은 `request-contract`가 정한다. 이 Skill의 역할은 아래 설명에 한정한다. (역할 지도: `request-contract` §0)

각 항목은 통과/실패/해당 없음으로 기록하고, 실패는 재현 방법과 함께 보고한다.

## 1. 색상

- [ ] 명암비를 **실제로 계산**한다 (추정 금지). 기준: 일반 텍스트 4.5:1, 큰 텍스트(18px bold 또는 24px 이상)·아이콘·입력 경계 3:1.
- [ ] 확인 조합: `--text`/`--bg`, `--text-sub`/`--bg`·`--card`·`--hover-bg`, `--accent`/`--hover-bg`, 흰 글자/`--accent`·`--accent-hover`·`--error`, `--placeholder`/`--card`, `--border-input`/`--card`.
- [ ] 정보 전달에 색만 쓰지 않는다 (에러는 문구 포함, 선택은 `aria-current` + 스타일, 토스트는 문구 포함).

## 2. 키보드

- [ ] Tab만으로 모든 인터랙션(헤더 버튼, 사이드바, 검색, 카드 액션, 모달)에 도달하고 실행할 수 있다.
- [ ] 모든 포커스 대상에 `:focus-visible` 표시가 보인다.
- [ ] hover로만 나타나는 버튼(폴더 삭제, 카드 액션)이 키보드 포커스에서도 나타난다.
- [ ] 클릭 가능한 요소는 `<button>` 또는 `<a>`다 (`div onClick` 없음).

## 3. 의미와 ARIA

- [ ] 아이콘 전용 버튼과 라벨 없는 입력에 `aria-label`이 있다.
- [ ] 선택된 사이드바 항목에 `aria-current`가 있다.
- [ ] 랜드마크 `header` / `nav`(aria-label) / `main`이 있다.
- [ ] 제목 순서가 h1 → h2로 이어진다 (단계 건너뜀 없음).
- [ ] 입력 에러는 `role="alert"`와 `aria-describedby`/`aria-invalid`로 연결된다.
- [ ] 토스트 영역은 `aria-live`(`role="status"`/`"alert"`)다.

## 4. Modal

- [ ] `role="dialog"`(또는 `alertdialog`), `aria-modal="true"`, `aria-labelledby`가 있다.
- [ ] 열리면 포커스가 모달 안(첫 입력 또는 안전한 버튼)으로 이동한다.
- [ ] Esc, 오버레이 클릭, 취소 버튼으로 닫힌다.
- [ ] 닫히면 포커스가 모달을 연 버튼으로 돌아간다.
- [ ] 열려 있는 동안 Tab이 모달 밖으로 빠져나가지 않는다.

## 5. 크기·모션

- [ ] 터치 대상이 최소 40×40px이다 (예외는 보고에 이유를 적는다).
- [ ] `prefers-reduced-motion: reduce`에서 transform·animation·transition이 꺼진다.
- [ ] 360px, 768px, 1280px 너비에서 가로 스크롤과 겹침이 없다.

## 6. 기능 회귀

- [ ] 방금 고친 기능의 실패 시나리오를 수정 전에 재현하고, 수정 후 같은 방법으로 통과를 확인한다.
- [ ] 인접 기능(폴더 선택, 링크 추가/수정/삭제, 새로고침 후 복원)이 그대로 동작한다.

---
name: nextjs-rules
description: 이 프로젝트의 Next.js(App Router) 구현 규칙 — Server/Client Component 경계, "use client" 기준, Tailwind와 globals.css의 역할 분담, 스타일링 방식 통일. 컴포넌트를 만들거나 스타일을 코드로 옮길 때 사용. 값과 모양은 design-theme, 검증은 qa-check.
---

# nextjs-rules — 어떻게 구현하는가

> 작업 범위와 Skill 조합은 `request-contract`가 정한다. 이 Skill의 역할은 아래 설명에 한정한다. (역할 지도: `request-contract` §0)

> 이 프로젝트의 Next.js는 학습 데이터와 다를 수 있다. 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 문서를 읽고, deprecation 안내를 따른다.

## 1. Server / Client Component

1. 기본은 Server Component. 상태, 이벤트, 브라우저 API(`localStorage`, `navigator`)가 필요할 때만 `"use client"`를 붙인다.
2. `"use client"`는 필요한 가장 작은 컴포넌트에 붙인다. 페이지 전체를 client로 만들지 않는다.
3. Server Component가 Client Component에 넘기는 props에 이벤트 핸들러(`onClick` 등)를 직접 넘기지 않는다. 인터랙션이 필요한 부분을 `"use client"` 컴포넌트로 분리한다.
4. 브라우저 전용 데이터(`localStorage`)는 렌더 중이 아니라 `useEffect`에서 읽는다. 첫 렌더 값을 서버와 같게 유지해 hydration 불일치를 막는다.

## 2. 스타일링 방식

역할을 이렇게 나눈다. **inline `style`은 사용하지 않는다.**

| 대상 | 위치 |
|---|---|
| 레이아웃, 크기, 간격, 일반 스타일 | **Tailwind** 클래스 |
| 디자인 토큰 (`:root` CSS 변수) | **globals.css** |
| 반복되는 pseudo-state(hover/focus/active/disabled), 그룹 hover, `@media (hover: none)`, `prefers-reduced-motion` | **globals.css** 클래스 |

규칙:
1. 토큰은 `globals.css`의 `:root`에만 정의하고, 컴포넌트에서는 `bg-[var(--accent)]`처럼 Tailwind arbitrary value로 참조한다.
2. hover/focus 스타일을 JS 이벤트(`onMouseEnter`, `onMouseLeave`, `onFocus`로 스타일 변경)로 처리하지 않는다. CSS로 처리한다.
3. 한 컴포넌트 안에서 Tailwind와 직접 작성한 CSS 규칙을 임의로 섞지 않는다. 한 번만 쓰이는 스타일은 Tailwind, 여러 곳에서 반복되는 상태 스타일만 globals.css 클래스로 올린다.
4. 토큰에 없는 색·radius·그림자를 새로 쓰지 않는다 (먼저 `design-theme`에 추가).

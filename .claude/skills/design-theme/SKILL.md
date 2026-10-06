---
name: design-theme
description: 배달의민족 스타일 시각 디자인 규칙 (토큰, 타이포, 간격, radius, 그림자, App Shell, 컴포넌트·상태·모달·토스트 디자인, 라이트모드 전용). 색/간격/모양을 정하거나 UI를 꾸밀 때 사용. 구현 방식은 nextjs-rules, 검증은 qa-check.
---

# design-theme — 무엇이 어떻게 보여야 하는가

민트 포인트, 큰 radius, 부드러운 그림자, 적극적인 bold로 밝고 경쾌한 인상을 만든다.

> 작업 범위와 Skill 조합은 `request-contract`가 정한다. 이 Skill의 역할은 아래 설명에 한정한다. (역할 지도: `request-contract` §0)

## 0. 원칙

1. **라이트모드만 사용한다.** 다크모드 토큰·스타일을 만들지 않는다.
2. **토큰에 없는 값을 쓰지 않는다.** 임의 hex, radius, 그림자 금지. 필요하면 먼저 이 문서에 추가한다.
3. 서브 액센트(노랑)는 로고 점 같은 장식에만 쓴다. 글자색·배경 정보 전달에는 쓰지 않는다.

## 1. 컬러 토큰

명암비 목표: 일반 텍스트 4.5:1, UI 경계(입력창 테두리 등)·큰 텍스트 3:1. 아래 값은 목표를 만족하도록 계산한 값이다. 실제 측정은 `qa-check`에서 한다.

| 토큰 | 값 | 용도 | 대비 |
|---|---|---|---|
| `--bg` | #F5F5F5 | 페이지 배경 | text 15.3 |
| `--card` | #FFFFFF | 카드, 헤더, 모달 | |
| `--text` | #1E1E1E | 기본 텍스트 | |
| `--text-sub` | #6B6B6B | 보조 텍스트 | 흰 배경 5.3 / bg 4.9 |
| `--placeholder` | #767676 | 플레이스홀더 | 흰 배경 4.5 |
| `--border` | #EEEEEE | **장식용** 구분선, 스켈레톤, 비활성 배경 | 1.2 (정보 전달 금지) |
| `--border-input` | #8A8A8A | **입력·선택 필드 경계** | 흰 배경 3.45 |
| `--accent` | #0E7C77 | 버튼 배경, 링크, 강조 텍스트 | 흰 글자 5.0 / hover-bg 위 4.65 |
| `--accent-hover` | #0B6F6A | 액센트 hover | 흰 글자 6.0 |
| `--hover-bg` | #E9F9F8 | hover·선택 배경, 뱃지, 보조 버튼 | |
| `--sub-accent` | #FFD600 | 장식 포인트 (텍스트 사용 금지) | |
| `--error` | #CC2936 | 에러 텍스트·테두리·위험 버튼 | 흰 글자 5.3 |
| `--success` | `var(--accent)` | 성공 표시 | |

그림자: `--shadow: 0 1px 6px rgba(0,0,0,.06)`, `--shadow-hover: 0 2px 10px rgba(0,0,0,.1)`.

## 2. 타이포그래피

- 폰트: `-apple-system, BlinkMacSystemFont, Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- h1 26px / h2 20px (bold, line-height 1.3 / 1.4), 본문 16px / 1.6, 보조 13px / 1.4
- 제목·버튼·뱃지는 bold. 링크는 액센트 색, underline 없음, hover opacity 0.8.

## 3. 간격·모서리·모션

- 간격: 요소 14px, 섹션 28px, 카드 사이 12px, 사이드바 아이템 4px
- radius (이 값만 사용): 카드·모달 16px, 버튼·사이드바 아이템·토스트 12px, 입력 10px, 뱃지 8px
- 전환: 색·그림자 0.2s ease. 버튼 pressed는 `scale(0.97)`.

## 4. App Shell

```
┌ Header (sticky, h-14, z-10) ─────────────┐
├ Sidebar (w-56) ┬ Main (flex-1, p-5) ─────┤
```

- 헤더: 높이 56px, 흰 배경, `0 1px 0 rgba(0,0,0,.06)`, 좌우 20px. 좌측 로고, 우측 액션(보조 버튼 → 기본 버튼, 간격 8px).
- 사이드바: 데스크톱 224px, 배경은 페이지 배경 그대로(카드 아님). 섹션 라벨 13px bold `--text-sub`.
- 메인: 패딩 20px. 카드 그리드는 전체 폭, 폼처럼 읽는 콘텐츠는 최대 640px.
- App Shell에서는 "페이지 상단 패딩 36px" 규칙을 쓰지 않는다.

## 5. 반응형

- 브레이크포인트: Tailwind 기본 (`sm` 640, `md` 768, `lg` 1024, `xl` 1280)
- `md` 미만: 사이드바가 메인 위로 올라온다. `md` 이상: 세로 사이드바.
- 카드 그리드: 1열 → `sm` 2열 → `lg` 3열 → `xl` 4열
- 헤더 버튼은 모바일에서도 한 줄 유지 (14px, 패딩 16px/8px).
- 모달: 폭 100%, 최대 384px, 바깥 여백 20px.

## 6. 상태의 시각 스타일

| 상태 | 스타일 |
|---|---|
| hover | 배경 `--hover-bg` 또는 `--accent-hover`. 카드는 `--shadow-hover` + `translateY(-2px)` |
| selected | 배경 `--hover-bg` + 글자 `--accent` + bold |
| focus | 2px `--accent` 아웃라인, offset 2px. 입력창은 테두리 `--accent` + `0 0 0 3px var(--hover-bg)` |
| disabled | 배경 `--border`, 글자 `--text-sub`, `not-allowed` 커서, hover 변화 없음 |
| pressed | `scale(0.97)` |

## 7. 컴포넌트

- **버튼**: 기본(`--accent` 배경 + 흰 글자) / 보조(`--hover-bg` 배경 + `--accent` 글자) / 위험(`--error` 배경 + 흰 글자). 모두 bold, radius 12px. 헤더 안은 `px-4 py-2 text-sm`, 폼·모달은 `px-5~6 py-2.5~3 text-base`.
- **입력·선택**: 1px `--border-input`, radius 10px, 패딩 12px 14px, 16px. 에러 시 테두리 `--error` + 하단 13px `--error` 메시지. 선택 필드는 입력과 동일 스타일.
- **뱃지**: `--hover-bg` 배경, `--accent` 글자, radius 8px, 패딩 4px 10px, 13px bold.
- **링크 카드**: 카드 스타일. 제목(16px bold, 2줄 말줄임) → URL(14px `--text-sub`, 한 줄 말줄임) → 폴더 뱃지 + 생성일(13px `--text-sub`). 액션(새 탭, 복사, 수정, 삭제)은 우측 상단 2×2 아이콘 버튼 32px, hover/포커스 시 노출, 아이콘 hover는 `--hover-bg` 배경, 삭제는 `--error` 글자.
- **폴더 리스트**: 라벨(15px bold, 말줄임) + 우측 개수(13px bold `--text-sub`). radius 12px. 행 hover 시 삭제 아이콘이 개수 자리에 나타난다.

## 8. 상태 화면

| 상태 | 스타일 |
|---|---|
| empty | 카드 박스, 가운데 정렬. 제목 16px bold + 안내 14px `--text-sub` + (필요 시) 기본 버튼 |
| loading | `--border` 색 스켈레톤 카드, 실제 카드와 같은 크기, `animate-pulse` |
| error | 필드 단위는 입력 에러 스타일. 화면 단위는 `--error` 문구 박스 + 보조 버튼(다시 시도) |
| success | 토스트 |

## 9. Modal / Toast

**Modal**: 오버레이 `bg-black/40`, 가운데 정렬, 패널은 카드(radius 16px, 패딩 20px, 최대 384px). 제목 20px bold. 푸터 버튼은 우측 정렬, 취소(보조) → 확인(기본, 삭제는 위험). 필수값이 비면 확인은 disabled 스타일.

**Toast**: 화면 우측 하단(`bottom-6 right-5`), 흰 카드 + `--shadow`, radius 12px, 14px bold. 성공은 좌측 `--accent` 점, 에러는 `--error` 점. 3초 후 사라지고, 동시에 하나만 보인다.

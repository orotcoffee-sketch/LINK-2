현재 localhost:3000 실제 화면을 기준으로 추가 수정한다.

현재 확인된 상태:

- URL 중복 문제는 해결됨
- Beatport bookmark의 실제 thumbnail은 아직 표시되지 않음
- 대신 hostname initial "B" fallback이 표시됨
- 문제는 fallback인데도 큰 thumbnail 영역을 그대로 차지해서 카드가 지나치게 커 보임

이번 작업은 thumbnail 처리와 카드 레이아웃을 정확하게 수정한다.

중요:
Auth / Kakao / profiles / member-admin / RLS / CRUD / folders / bookmarks 데이터 구조는
이번 작업 때문에 변경하지 않는다.

==================================================
[1. 현재 Beatport thumbnail 상태부터 실제 확인]
==================================================

현재 Supabase bookmarks의 Beatport row를 실제 조회한다.

반드시 확인:

- id
- url
- title
- description
- thumbnail_url
- folder_id

thumbnail_url이:

A. null
B. empty string
C. URL은 있는데 이미지 로드 실패

중 어느 상태인지 정확히 구분한다.

추측하지 않는다.

==================================================
[2. metadata fetch 결과 확인]
==================================================

현재 구현된 metadata fetch를 이용해서
Beatport URL에 대해 실제 결과를 확인한다.

확인:

- request status
- redirect 여부
- final status
- content-type
- og:title
- og:description
- og:image
- twitter:image
- favicon

Beatport가 403 등으로 metadata 요청을 차단하면
그 사실을 그대로 보고한다.

차단을 우회하기 위한:

- anti-bot bypass
- captcha bypass
- proxy 우회
- headless browser 우회

등은 구현하지 않는다.

==================================================
[3. Thumbnail 표시 우선순위]
==================================================

BookmarkCard의 visual preview는 다음 순서로 처리한다.

1. thumbnail_url이 있고 이미지 load 성공
   → 실제 thumbnail 표시

2. thumbnail_url 없음 또는 load 실패
   → favicon 표시

3. favicon도 load 실패
   → hostname 첫 글자 initial 표시

예:

Beatport:
favicon 성공 → Beatport favicon

favicon 실패 → B

==================================================
[4. 매우 중요 — 이미지가 없는 카드 레이아웃]
==================================================

현재처럼 fallback "B" 하나만 있는데
큰 16:9 이미지 영역을 만드는 것은 금지한다.

두 가지 카드 layout을 사용한다.

--------------------------------
A. 실제 thumbnail이 있는 경우
--------------------------------

큰 visual card:

┌───────────────────────────┐
│                           │
│       actual image        │
│           16:9            │
│                           │
├───────────────────────────┤
│ title                     │
│ url                       │
│                           │
│ folder              date  │
└───────────────────────────┘


--------------------------------
B. thumbnail이 없는 경우
--------------------------------

compact card:

┌───────────────────────────┐
│ [favicon/B] title     ... │
│             URL           │
│                           │
│ folder              date  │
└───────────────────────────┘

즉:

thumbnail 없음
→ 큰 빈 이미지 영역 제거
→ 작은 48~56px favicon/initial만 사용

현재 화면처럼
B 하나 때문에 카드 절반 이상을 빈 공간으로 만들지 않는다.

==================================================
[5. Favicon]
==================================================

thumbnail metadata를 못 가져와도
사이트 favicon은 별도로 사용할 수 있는지 확인한다.

현재 프로젝트에 favicon retrieval 로직이 있으면 재사용한다.

없다면 먼저 해당 사이트 origin의 일반적인 favicon 경로를
안전하게 사용할 수 있는지 확인한다.

단:

외부 favicon API 서비스를 임의로 새 의존성으로 추가하지 않는다.

실제 favicon load가 실패하면
hostname initial fallback을 사용한다.

==================================================
[6. Thumbnail이 가능한 사이트 검증]
==================================================

Beatport 하나만 기준으로 thumbnail 기능이 실패했다고 판단하지 않는다.

metadata 접근이 가능한 공개 사이트 하나를 실제 테스트한다.

흐름:

URL 저장
→ server-side metadata fetch
→ og:image 발견
→ thumbnail_url 저장
→ BookmarkCard actual image 표시

이 테스트가 성공해야
thumbnail pipeline 자체가 정상이라고 판단한다.

==================================================
[7. 기존 Beatport row]
==================================================

기존 Beatport bookmark도 확인한다.

metadata를 얻을 수 있으면:

thumbnail_url에 실제 image URL 저장

metadata를 얻을 수 없다면:

thumbnail_url을 가짜 URL로 만들지 않는다.

favicon 또는 B fallback 사용.

==================================================
[8. 이미지 load failure]
==================================================

thumbnail_url이 존재해도 이미지가 깨질 수 있다.

onError 처리:

thumbnail
→ favicon
→ initial

순서로 fallback.

깨진 이미지 icon이 화면에 나타나면 안 된다.

==================================================
[9. Card 크기]
==================================================

현재 카드가 너무 크다.

thumbnail 없는 compact card는:

width:
약 400~480px 범위에서 현재 grid에 맞게 결정

height:
내용에 맞게 자동

padding:
20~24px

thumbnail 있는 card만 visual image 때문에 더 높게 만든다.

카드 전체 height를 고정하지 않는다.

==================================================
[10. Card 디자인 유지]
==================================================

현재 White / Black Soft Monochrome 방향 유지.

background:
#FFFFFF

border:
rgba(0,0,0,0.07)

radius:
18~20px

shadow:
soft neutral

hover:

translateY(-4px)
shadow 증가
border 약간 진하게

180~220ms

실제 thumbnail이 있는 경우에만 이미지:

scale(1 → 1.015)

정도의 미세한 hover 사용.

==================================================
[11. Header 누락 확인]
==================================================

현재 admin Header에서:

관리자 모드
새폴더
링크 추가
로그아웃

은 보인다.

기존 요구사항에 있던:

정보수정

이 현재 실제 화면에 없으므로 확인한다.

기존 /account 기능이 정상 존재한다면:

admin:
[관리자 모드]
[새폴더]
[링크 추가]
[정보수정]
[로그아웃]

member:
[사용자]
[정보수정]
[로그아웃]

구조로 표시한다.

Auth/role 로직은 변경하지 않는다.

==================================================
[12. 이번 작업에서 절대 변경하지 말 것]
==================================================

- Supabase Auth
- Kakao OAuth
- callback
- session
- profiles
- role
- RLS
- folder 권한
- bookmark 권한
- 기존 CRUD
- 기존 데이터 삭제

==================================================
[13. 최종 실제 검증]
==================================================

localhost:3000에서 실제 확인한다.

TEST-1
Beatport thumbnail_url 실제 상태 확인

TEST-2
Beatport metadata status 확인

TEST-3
Beatport thumbnail을 얻을 수 있으면 actual image 표시

TEST-4
얻을 수 없으면 favicon 표시

TEST-5
favicon도 실패하면 B 표시

TEST-6
B fallback일 경우 큰 thumbnail 공간이 사라지고 compact card가 되는지 확인

TEST-7
metadata 가능한 다른 사이트에서 실제 image card 표시

TEST-8
thumbnail image load 실패 → fallback 정상

TEST-9
정보수정 Header 표시 확인

TEST-10
기존 CRUD/Auth/RLS 회귀 없음

==================================================
[완료 보고]
==================================================

아래를 정확히 보고한다.

1. Beatport thumbnail_url 실제 값
2. Beatport metadata HTTP status
3. og:image 존재 여부
4. favicon 확보 여부
5. Beatport 최종 fallback 단계
6. B fallback일 때 compact card 적용 결과
7. 실제 thumbnail 표시 성공한 테스트 사이트
8. thumbnail_url 저장 결과
9. 수정한 파일
10. DB schema 변경 여부
11. Auth/RLS 변경 여부
12. 정보수정 버튼 표시 여부
13. 브라우저 실제 확인 결과

검증하지 않은 것은 성공이라고 말하지 않는다.
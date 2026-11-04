# FLOW — 프론트엔드

AI 대화에서 얻은 인사이트를 저장하고, 카테고리로 묶고, 되돌아보는 개인 지식 관리 앱.
React 18 + Vite. 디자인 방향: "정교한 개인 지식 작업실" (흰 배경 + 그린 글라스).

## 실행 방법

```bash
npm install      # 의존성 설치 (최초 1회)
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

Node 18+ 권장.

## 구조

```
index.html              폰트(IBM Plex Sans KR / Mono) + 루트
src/
  main.jsx              엔트리
  App.jsx               페이지 라우팅(상태 기반) + 카테고리 상태
  index.css             전체 스타일 + 디자인 토큰(라이트/다크)
  data.js               더미 데이터 (→ 백엔드 API로 교체 지점)
  components/
    Sidebar.jsx         좌측 내비게이션
    Topbar.jsx          상단 검색 + 저장 버튼
    Icon.jsx            인라인 SVG 아이콘셋
    Bits.jsx            CatTag / SrcMeta / CheckMark 공용 조각
    DocModal.jsx        선택 인사이트 → 문서(마크다운) 정리
  pages/
    Home.jsx            통계 카드 + 다시 볼/최근 인사이트 + 활동/분포
    SaveInsight.jsx     Q/A 입력 + 출처·카테고리 + 분석 결과
    TableView.jsx       정렬·프로젝트 필터·다중선택·문서화
    CategoryManage.jsx  카테고리 추가/이름변경/삭제
    Analysis.jsx        관심 분야·질문 스타일·키워드·이달의 회고
```

## 백엔드 연결 지점

`src/data.js`의 `INSIGHTS`, `INITIAL_CATEGORIES` 등을 API 응답으로 바꾸면 됩니다.
예) `useEffect`에서 `fetch('/api/insights')` → `setInsights(...)`.

- 저장: `POST /api/insights` (q, a, src, cat)
- 목록: `GET /api/insights?proj=...`
- 카테고리: `GET/POST/PATCH/DELETE /api/categories`
- 분석: `GET /api/analysis?month=2026-10`

## 메모

- 다크 모드: OS 설정을 따라가고, `<html data-theme="light|dark">`로 강제 지정 가능.
- 아이콘은 webfont 대신 인라인 SVG(`Icon.jsx`) — 외부 의존성 없음.

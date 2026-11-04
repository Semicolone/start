// 더미 데이터 — 백엔드 API 응답으로 교체하면 됩니다.

export const INSIGHTS = [
  { id: 1, q: "백엔드 개발자 취업 준비 로드맵 알려줘", a: "CS 기초, 프레임워크 숙련도, 실제 서비스 경험이 담긴 프로젝트가 핵심이에요. 코딩 테스트 준비도 병행해야 해요.", cat: "커리어/진로", src: "ChatGPT", sc: "var(--src-chatgpt)", proj: "취업 준비", date: "2026-10-20" },
  { id: 2, q: "포트폴리오에 어떤 프로젝트를 담아야 할까?", a: "실제 문제를 해결한 서비스, 코드 퀄리티가 보이는 프로젝트. 완성도 높은 1개가 미완성 5개보다 나아요.", cat: "커리어/진로", src: "Claude", sc: "var(--src-claude)", proj: "취업 준비", date: "2026-10-19" },
  { id: 3, q: "React useCallback 써야 하는 상황이 언제야?", a: "자식 컴포넌트에 함수를 props로 넘길 때, 매 렌더링마다 새 함수가 생성되어 불필요한 리렌더링이 발생하는 경우에 써요.", cat: "개발", src: "Claude", sc: "var(--src-claude)", proj: "FLOW 개발", date: "2026-10-18" },
  { id: 4, q: "FastAPI에서 JWT 인증 구현하는 방법", a: "python-jose로 토큰을 발급하고 Depends로 검증. OAuth2PasswordBearer를 의존성으로 주입하면 깔끔해요.", cat: "개발", src: "ChatGPT", sc: "var(--src-chatgpt)", proj: "FLOW 개발", date: "2026-10-17" },
  { id: 5, q: "자소서 지원 동기 잘 쓰는 방법", a: "구체적인 경험 + 해당 회사를 선택한 이유를 연결. 추상적 표현 대신 숫자나 에피소드로 구체화.", cat: "커리어/진로", src: "Claude", sc: "var(--src-claude)", proj: "취업 준비", date: "2026-10-15" },
  { id: 6, q: "딥러닝과 머신러닝의 차이점", a: "딥러닝은 머신러닝의 하위 개념, 다층 신경망을 사용. 데이터가 많을수록 딥러닝이 유리해요.", cat: "학습/공부", src: "ChatGPT", sc: "var(--src-chatgpt)", proj: "미분류", date: "2026-10-12" },
  { id: 7, q: "Groq API로 텍스트 요약 품질 높이는 법", a: "시스템 프롬프트에 출력 형식을 JSON으로 고정하고, few-shot 예시를 넣으면 일관성이 크게 올라가요.", cat: "개발", src: "Gemini", sc: "var(--src-gemini)", proj: "FLOW 개발", date: "2026-10-10" },
  { id: 8, q: "번아웃 왔을 때 회복하는 방법", a: "완전한 휴식보다 작은 성취감을 쌓는 게 효과적이에요. 30분 단위 목표 설정, 산책, 수면 패턴 회복이 중요해요.", cat: "감정/고민", src: "Claude", sc: "var(--src-claude)", proj: "미분류", date: "2026-10-08" },
];

export const INITIAL_CATEGORIES = [
  { name: "커리어/진로", color: "var(--cat-career)", count: 48, icon: "briefcase" },
  { name: "개발", color: "var(--cat-dev)", count: 40, icon: "code" },
  { name: "학습/공부", color: "var(--cat-study)", count: 26, icon: "book" },
  { name: "감정/고민", color: "var(--cat-emotion)", count: 17, icon: "heart" },
];

export const CAT_PALETTE = [
  "var(--cat-career)", "var(--cat-dev)", "var(--cat-study)",
  "var(--cat-emotion)", "#e07b39", "#0ea5a0", "#888780",
];

// 카테고리 이름 → 색 (목록/행의 점 색)
export const CAT_COLOR = {
  "커리어/진로": "var(--cat-career)", "커리어": "var(--cat-career)",
  "개발": "var(--cat-dev)",
  "학습/공부": "var(--cat-study)", "학습": "var(--cat-study)",
  "감정/고민": "var(--cat-emotion)", "감정": "var(--cat-emotion)",
};

export const PROJECTS = ["전체", "취업 준비", "FLOW 개발", "미분류"];

export const HEATMAP = [0, 1, 2, 1, 3, 2, 4, 1, 0, 2, 3, 2, 1, 0, 2, 4, 3, 1, 2, 3, 1, 2, 0, 1, 3, 4, 2, 1, 3, 2, 4, 3, 1, 0, 2, 1, 3, 2, 4, 1, 2, 3, 2, 1, 0, 1, 2, 3];
export const HEAT_COLORS = ["", "#b7e4c7", "#5dcaa5", "#2d9e6b", "#1a4a35"];

// 홈 · 최근/다시 볼 인사이트 (상대 날짜 라벨 포함)
export const REVISIT = [
  { q: "백엔드 개발자 취업 준비 로드맵 알려줘", a: "CS 기초, 프레임워크 숙련도, 실제 서비스 경험이 담긴 프로젝트가 핵심이에요. 코딩 테스트 준비도 병행해야 해요.", cat: "커리어/진로", src: "ChatGPT", sc: "var(--src-chatgpt)", when: "3일 전 저장" },
  { q: "React에서 useCallback을 써야 하는 상황이 언제야?", a: "자식 컴포넌트에 함수를 props로 넘길 때, 매 렌더링마다 새 함수가 생성되어 불필요한 리렌더링이 발생하는 경우에 써요.", cat: "개발", src: "Claude", sc: "var(--src-claude)", when: "7일 전 저장" },
  { q: "번아웃이 왔을 때 회복하는 방법", a: "완전한 휴식보다 작은 성취감을 쌓는 게 효과적이에요. 30분 단위 목표 설정, 산책, 수면 패턴 회복이 중요해요.", cat: "감정/고민", src: "Claude", sc: "var(--src-claude)", when: "14일 전 저장" },
];

export const RECENT = [
  { q: "FastAPI에서 JWT 인증 구현하는 방법", a: "python-jose로 토큰을 발급하고 Depends로 검증. OAuth2PasswordBearer를 의존성으로 주입하면 깔끔해요.", cat: "개발", src: "ChatGPT", sc: "var(--src-chatgpt)", when: "10.17" },
  { q: "자소서 지원 동기 잘 쓰는 방법", a: "구체적인 경험 + 해당 회사를 선택한 이유를 연결. 추상적 표현 대신 숫자나 에피소드로 구체화.", cat: "커리어/진로", src: "Claude", sc: "var(--src-claude)", when: "10.15" },
];

export const CAT_DIST = [
  { label: "커리어", pct: 34, w: 68, color: "var(--cat-career)" },
  { label: "개발", pct: 28, w: 56, color: "var(--cat-dev)" },
  { label: "학습", pct: 18, w: 36, color: "var(--cat-study)" },
  { label: "감정", pct: 12, w: 24, color: "var(--cat-emotion)" },
];

export const Q_STYLE = [
  { label: "원리 탐구", pct: 61, w: 61 },
  { label: "방법 요청", pct: 27, w: 27 },
  { label: "비교 분석", pct: 12, w: 12 },
];

export const KEYWORDS = [
  { t: "취업", size: 15 }, { t: "포트폴리오", size: 14 }, { t: "React", size: 14 },
  { t: "면접" }, { t: "자소서" }, { t: "API" }, { t: "알고리즘" }, { t: "번아웃" },
];

export const TIMELINE = [
  { w: "1주차", x: "React 개발 공부", tail: "에 집중" },
  { w: "2주차", x: "취업 vs 대학원", tail: " 고민 시작" },
  { w: "3주차", x: "자소서", tail: " 집중 작성" },
  { w: "4주차", x: "면접 준비", tail: " 본격화" },
];

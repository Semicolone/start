# FLOW

> **AI 질문을 기억되는 인사이트로**
> 
> ChatGPT, Gemini 등 생성형 AI와의 대화를 저장하고, AI가 자동으로 요약·키워드를 추출하여 나만의 지식 노트로 만들어주는 개인 지식 관리 플랫폼

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 팀 소개

**팀명:** Semicolone;

| 이름 | 역할 |
|------|------|
| 윤현진 | Backend · 프로젝트 초기 세팅 · CI/CD |
| 신지원 | PM · Backend |
| 이채원 | Frontend · 백엔드 연동 |

---

## 서비스 소개

많은 사람들이 ChatGPT와 같은 생성형 AI를 통해 유용한 정보를 얻지만, 대화 내용은 대부분 일회성으로 소비되고 이후 다시 활용되기 어렵다.

FLOW는 AI 대화를 단순히 저장하는 것에서 나아가, 자동으로 요약·구조화하고 시간이 지나 다시 상기시켜 장기 기억으로 내재화하도록 돕는 서비스다.

---

## 주요 기능

- **AI 자동 분석** — Q/A를 붙여넣으면 질문 요약, 답변 요약, 핵심 키워드를 자동 생성
- **카테고리 관리** — 인사이트를 카테고리별로 분류하고 조회
- **3일 리마인드** — 저장한 지 3일이 지난 인사이트를 홈에 다시 노출하여 기억 내재화
- **마이페이지** — 계정 정보 및 총 인사이트 수 통계 확인
- **인사이트 검색·조회** — 저장된 인사이트를 언제든 다시 탐색

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React, Vite |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 15 |
| AI | Groq Cloud API (Llama 3.3) |
| 인프라 | Docker, docker-compose |
| CI/CD | GitHub Actions → Oracle Cloud |

---

## 시스템 아키텍처

```
사용자 Q/A 입력
  → POST /api/insights/analyze
  → Groq Cloud API (Llama 3.3)
  → 질문 요약 / 답변 요약 / 키워드 추출 (JSON)
  → PostgreSQL 저장
  → 프론트 화면에 렌더링
```

---

## 디렉토리 구조

```
start/
├── api/                  # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── routers/      # auth, insights, categories, home, my
│   │   ├── schemas/      # Pydantic 스키마
│   │   └── services/     # 비즈니스 로직
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # React + Vite 프론트엔드
├── docker-compose.yml
└── .env.example
```

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/Semicolone/start.git
cd start
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일에서 SECRET_KEY 등 실제 값으로 수정
```

### 3. Docker로 실행 (백엔드 + DB)

```bash
docker-compose up -d
```

- API 서버: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

---

## CI/CD

`dev` 브랜치에 push 시 GitHub Actions가 자동으로 실행된다.

1. **Test** — pytest 실행
2. **Deploy** — SSH를 통해 Oracle Cloud 서버에 자동 배포 (`docker-compose up --build`)

---

## 향후 확장 계획

- **성향 분석** — 누적된 인사이트 데이터를 기반으로 사용자의 관심사와 사고 패턴을 분석하여 시각화
- **월간 회고** — 한 달간의 질문 패턴과 주요 인사이트를 자동으로 요약하여 성장 흐름 확인
- **캘린더 기능** — 날짜별 인사이트 활동을 캘린더 형태로 시각화하여 학습 이력 추적
- **AI 카테고리 자동 추천** — AI가 인사이트 내용을 분석해 카테고리를 자동으로 분류
- **브라우저 익스텐션** — 외부 AI 도구 사용 중 원클릭으로 인사이트 저장

---

## 관련 문서

- [기여 가이드](CONTRIBUTING.md)
- [팀 그라운드 룰](Team_Ground_Rule.md)
- [GitHub Repository](https://github.com/Semicolone/start)

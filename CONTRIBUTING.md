# 기여 가이드

## 브랜치 네이밍

```
feat/#이슈번호-작업명
fix/#이슈번호-작업명
docs/#이슈번호-작업명
refactor/#이슈번호-작업명
```

예시: `feat/#3-user-login`, `fix/#7-calendar-crash`

## 커밋 메시지

```
타입: 한 줄 설명
```

| 타입 | 사용 상황 |
|------|-----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷 변경 (로직 변경 없음) |
| `refactor` | 리팩토링 |
| `chore` | 빌드/설정 변경 |

예시:
```
feat: 로그인 기능 추가
fix: 캘린더 날짜 오류 수정
docs: API 명세 업데이트
```

## 작업 흐름

1. 이슈 생성
2. 브랜치 생성 (`feat/#이슈번호-작업명`)
3. 작업 후 PR 생성 — PR 본문에 `Closes #이슈번호` 포함
4. 코드 리뷰 후 main 브랜치에 머지

## 디렉토리 구조

```
/
├── backend/    # FastAPI (Python)
├── mobile/     # React Native
└── .github/    # 이슈/PR 템플릿
```

from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.database import get_db
from app.models.user import User
from app.models.insight import Insight
from app.routers.categories import Category
from app.dependencies import get_current_user
from passlib.context import CryptContext

router = APIRouter(prefix="/api/my", tags=["my"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PERIOD_DAYS = {"1m": 30, "3m": 90}


def aggregate_keywords_by_category(insights: list, categories: dict) -> list:
    counters = {}
    for insight in insights:
        if not insight.keywords:
            continue
        category_name = categories.get(insight.category_id, "기타")
        counter = counters.setdefault(category_name, Counter())
        for keyword in insight.keywords:
            counter[keyword] += 1

    return [
        {
            "name": category_name,
            "keywords": [
                {"keyword": keyword, "count": count}
                for keyword, count in counter.most_common()
            ],
        }
        for category_name, counter in counters.items()
    ]

@router.get("/profile")
def get_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")
    return {"email": user.email, "username": user.username}

@router.put("/profile")
def update_profile(username: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")
    user.username = username
    db.commit()
    return {"email": user.email, "username": user.username}

@router.put("/push_token")
def update_push_token(push_token: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")
    user.push_token = push_token
    db.commit()
    return {"message": "푸시 토큰 등록 성공"}

@router.put("/reminder_settings")
def update_reminder_settings(reminder_enabled: bool, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")
    user.reminder_enabled = reminder_enabled
    db.commit()
    return {"reminder_enabled": user.reminder_enabled}

@router.delete("/account")
def delete_account(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")

    # Insight가 Category를 참조하므로, Category보다 먼저 지워야 FK 제약을 위반하지 않음
    db.query(Insight).filter(Insight.user_email == user.email).delete()
    db.query(Category).filter(Category.user_email == user.email).delete()
    db.delete(user)
    db.commit()
    return {"message": "회원 탈퇴 성공"}

@router.get("/analysis")
def get_analysis(current_user: dict = Depends(get_current_user)):
    return {"user_email": current_user["user_email"], "analysis": "준비 중입니다"}

@router.get("/keyword_report")
def get_keyword_report(period: str = "all", db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if period not in ("all", "1m", "3m"):
        raise HTTPException(status_code=400, detail="period는 all, 1m, 3m 중 하나여야 합니다")

    user_email = current_user["user_email"]

    query = db.query(Insight).filter(Insight.user_email == user_email)
    if period in PERIOD_DAYS:
        since = datetime.utcnow() - timedelta(days=PERIOD_DAYS[period])
        query = query.filter(Insight.created_at >= since)

    insights = query.all()

    categories = {
        c.id: c.name
        for c in db.query(Category).filter(Category.user_email == user_email).all()
    }

    return {
        "period": period,
        "categories": aggregate_keywords_by_category(insights, categories),
    }

@router.get("/keyword_report/{keyword}")
def get_keyword_detail(keyword: str, sort: str = "recent", db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if sort not in ("recent", "oldest"):
        raise HTTPException(status_code=400, detail="sort는 recent, oldest 중 하나여야 합니다")

    user_email = current_user["user_email"]

    insights = db.query(Insight).filter(
        Insight.user_email == user_email
    ).order_by(Insight.created_at.asc()).all()

    matched = [i for i in insights if i.keywords and keyword in i.keywords]

    if not matched:
        raise HTTPException(status_code=404, detail="해당 키워드로 저장된 인사이트가 없습니다")

    categories = {
        c.id: c.name
        for c in db.query(Category).filter(Category.user_email == user_email).all()
    }

    day_counts = {}
    for insight in matched:
        day = insight.created_at.date().isoformat()
        day_counts[day] = day_counts.get(day, 0) + 1

    cumulative_graph = []
    running_total = 0
    for day in sorted(day_counts.keys()):
        running_total += day_counts[day]
        cumulative_graph.append({"date": day, "cumulative_count": running_total})

    category_counter = Counter(categories.get(i.category_id, "기타") for i in matched)
    main_category = category_counter.most_common(1)[0][0]
    latest_insight = matched[-1]
    latest_summary = latest_insight.question_summary or latest_insight.question_original[:50]

    ai_note = (
        f"지금까지 '{keyword}' 관련 질문을 총 {len(matched)}번 남겼어요. "
        f"주로 {main_category} 카테고리에서 다뤄졌어요. "
        f"가장 최근에는 \"{latest_summary}\"에 대해 질문했어요."
    )

    sorted_insights = sorted(matched, key=lambda i: i.created_at, reverse=(sort == "recent"))

    insight_list = [
        {
            "id": i.id,
            "question_summary": i.question_summary or i.question_original[:50],
            "answer_summary": i.answer_summary or i.answer_original[:50],
            "category_name": categories.get(i.category_id, "기타"),
            "ai_source": i.ai_source,
            "created_at": i.created_at.isoformat(),
        }
        for i in sorted_insights
    ]

    return {
        "keyword": keyword,
        "cumulative_graph": cumulative_graph,
        "ai_note": ai_note,
        "insights": insight_list,
    }

MIN_INSIGHTS_FOR_REVIEW = 3


@router.get("/monthly_review/{year}/{month}")
def get_monthly_review(year: int, month: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from app.services.ai import generate_monthly_review

    user_email = current_user["user_email"]

    insights = db.query(Insight).filter(
        Insight.user_email == user_email,
        extract("year", Insight.created_at) == year,
        extract("month", Insight.created_at) == month
    ).all()

    total_questions = len(insights)
    active_days = len(set(i.created_at.date() for i in insights))
    day_counts = {}
    for i in insights:
        d = i.created_at.date()
        day_counts[d] = day_counts.get(d, 0) + 1
    max_questions = max(day_counts.values()) if day_counts else 0

    categories = {
        c.id: c.name
        for c in db.query(Category).filter(Category.user_email == user_email).all()
    }

    if total_questions < MIN_INSIGHTS_FOR_REVIEW:
        return {
            "year": year,
            "month": month,
            "total_questions": total_questions,
            "active_days": active_days,
            "max_questions": max_questions,
            "title": f"{year}년 {month}월 회고",
            "summary": f"이번 달은 아직 인사이트가 {total_questions}개예요. {MIN_INSIGHTS_FOR_REVIEW}개 이상 쌓이면 회고를 보여드릴게요.",
            "highlight": None,
            "timeline": [],
            "category_changes": [],
            "keyword_top5": [],
        }

    insights_data = [
        {
            "date": i.created_at.strftime("%m/%d"),
            "question_summary": i.question_summary or i.question_original[:50],
            "category": categories.get(i.category_id, "기타")
        }
        for i in insights
    ]

    ai_result = generate_monthly_review(year, month, insights_data)

    # 전월 대비 카테고리별 변화
    prev_year, prev_month = (year - 1, 12) if month == 1 else (year, month - 1)
    prev_insights = db.query(Insight).filter(
        Insight.user_email == user_email,
        extract("year", Insight.created_at) == prev_year,
        extract("month", Insight.created_at) == prev_month
    ).all()

    this_month_counts = Counter(categories.get(i.category_id, "기타") for i in insights)
    prev_month_counts = Counter(categories.get(i.category_id, "기타") for i in prev_insights)

    category_changes = []
    all_category_names = set(this_month_counts) | set(prev_month_counts)
    for category_name in all_category_names:
        count = this_month_counts.get(category_name, 0)
        prev_count = prev_month_counts.get(category_name, 0)
        if prev_count == 0:
            change = "신규"
        else:
            percent = round((count - prev_count) / prev_count * 100)
            change = f"{'+' if percent >= 0 else ''}{percent}%"
        category_changes.append({
            "name": category_name,
            "count": count,
            "previous_count": prev_count,
            "change": change,
        })

    # 이달의 키워드 Top5 (카테고리 구분 없이 전체 합산)
    category_keywords = aggregate_keywords_by_category(insights, categories)
    all_keywords = [kw for cat in category_keywords for kw in cat["keywords"]]
    keyword_top5 = sorted(all_keywords, key=lambda k: k["count"], reverse=True)[:5]

    return {
        "year": year,
        "month": month,
        "total_questions": total_questions,
        "active_days": active_days,
        "max_questions": max_questions,
        "title": ai_result.get("title"),
        "summary": ai_result.get("summary"),
        "highlight": ai_result.get("highlight"),
        "timeline": ai_result.get("timeline", []),
        "category_changes": category_changes,
        "keyword_top5": keyword_top5,
    }

@router.put("/password")
def change_password(current_password: str, new_password: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.email == current_user["user_email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")
    if not pwd_context.verify(current_password, user.password):
        raise HTTPException(status_code=401, detail="현재 비밀번호가 틀렸습니다")
    user.password = pwd_context.hash(new_password)
    db.commit()
    return {"message": "비밀번호 변경 성공"}

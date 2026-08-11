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

@router.get("/monthly_review/{year}/{month}")
def get_monthly_review(year: int, month: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from app.services.ai import generate_monthly_review

    insights = db.query(Insight).filter(
        Insight.user_email == current_user["user_email"],
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

    insights_data = [
        {
            "date": i.created_at.strftime("%m/%d"),
            "question_summary": i.question_summary or i.question_original[:50],
            "category": str(i.category_id) if i.category_id else "기타"
        }
        for i in insights
    ]

    ai_result = generate_monthly_review(year, month, insights_data)

    return {
        "year": year,
        "month": month,
        "total_questions": total_questions,
        "active_days": active_days,
        "max_questions": max_questions,
        "title": ai_result.get("title"),
        "summary": ai_result.get("summary"),
        "highlight": ai_result.get("highlight"),
        "timeline": ai_result.get("timeline", [])
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

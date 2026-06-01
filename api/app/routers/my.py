from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.database import get_db
from app.models.user import User
from app.models.insight import Insight
from app.dependencies import get_current_user
from passlib.context import CryptContext

router = APIRouter(prefix="/api/my", tags=["my"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    db.delete(user)
    db.commit()
    return {"message": "회원 탈퇴 성공"}

@router.get("/analysis")
def get_analysis(current_user: dict = Depends(get_current_user)):
    return {"user_email": current_user["user_email"], "analysis": "준비 중입니다"}

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

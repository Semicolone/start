from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.insight import Insight
from app.models.user import User
from app.schemas.home import HomeResponse
from app.schemas.insight import InsightListResponse

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("", response_model=HomeResponse)
def get_home(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_email = current_user["user_email"]
    user = db.query(User).filter(User.email == user_email).first()
    display_name = user.username if user and user.username else user_email

    total = db.query(Insight).filter(Insight.user_email == user_email).count()
    recent = db.query(Insight).filter(
        Insight.user_email == user_email
    ).order_by(Insight.created_at.desc()).limit(3).all()

    return HomeResponse(
        greeting=f"{display_name}님, 오늘도 인사이트를 쌓아보세요!",
        total_insights=total,
        recent_insights=recent,
    )


@router.get("/recent_insights", response_model=InsightListResponse)
def get_recent_insights(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user_email = current_user["user_email"]
    insights = db.query(Insight).filter(
        Insight.user_email == user_email
    ).order_by(Insight.created_at.desc()).limit(3).all()

    return InsightListResponse(insights=insights, total=len(insights))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/my", tags=["my"])

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
def get_monthly_review(year: int, month: int, current_user: dict = Depends(get_current_user)):
    return {"user_email": current_user["user_email"], "year": year, "month": month, "review": "준비 중입니다"}
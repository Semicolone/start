from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.routers.categories import Category
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"

DEFAULT_CATEGORIES = ["커리어/진로", "개발", "학습/공부", "감정/고민", "창작", "일상", "기타"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(user_email: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    payload = {"user_email": user_email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(email: str, password: str, name: str = None, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다")
    hashed_password = pwd_context.hash(password)
    user = User(email=email, password=hashed_password, username=name)
    db.add(user)
    db.flush()
    for category_name in DEFAULT_CATEGORIES:
        db.add(Category(name=category_name, user_email=email))
    db.commit()
    return {"message": "회원가입 성공"}

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다")
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout():
    return {"message": "로그아웃 성공"}
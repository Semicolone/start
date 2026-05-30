from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import Session
from app.database import Base, get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_email = Column(String, ForeignKey("users.email"), nullable=False)

@router.post("")
def create_category(name: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    category = Category(name=name, user_email=current_user["user_email"])
    db.add(category)
    db.commit()
    db.refresh(category)
    return {"id": category.id, "name": category.name}

@router.get("")
def get_categories(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    categories = db.query(Category).filter(Category.user_email == current_user["user_email"]).all()
    return categories

@router.put("/{category_id}")
def update_category(category_id: int, name: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id, Category.user_email == current_user["user_email"]).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다")
    category.name = name
    db.commit()
    return {"id": category.id, "name": category.name}

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id, Category.user_email == current_user["user_email"]).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다")
    db.delete(category)
    db.commit()
    return {"message": "삭제 성공"}

@router.get("/{category_id}/insights")
def get_category_insights(category_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    category = db.query(Category).filter(Category.id == category_id, Category.user_email == current_user["user_email"]).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다")
    return {"category_id": category_id, "insights": []}
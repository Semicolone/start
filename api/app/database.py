from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Base.metadata.create_all()은 새 테이블만 만들고, 이미 존재하는 테이블에
# 컬럼을 추가하진 못한다. 이미 있는 컬럼에 ALTER를 시도하면 에러가 나므로
# 무시하고 넘어가는 방식으로 여러 번 실행해도 안전하게 만들어둔다.
def run_startup_migrations():
    statements = [
        "ALTER TABLE users ADD COLUMN push_token VARCHAR",
        "ALTER TABLE insights ADD COLUMN reminded_at TIMESTAMP",
    ]
    with engine.connect() as conn:
        for statement in statements:
            try:
                conn.execute(text(statement))
                conn.commit()
            except Exception:
                conn.rollback()

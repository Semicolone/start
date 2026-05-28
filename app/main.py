from fastapi import FastAPI
from app.database import engine, Base
from app.routers import auth, categories, my

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(my.router)

@app.get("/")
def root():
    return {"message": "서버 정상 작동 중!"}
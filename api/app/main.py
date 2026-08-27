from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, run_startup_migrations
from app.routers import insights, home, auth, categories, my, internal

Base.metadata.create_all(bind=engine)
run_startup_migrations()

app = FastAPI(title="FLOW API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(insights.router)
app.include_router(home.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(my.router)
app.include_router(internal.router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to FLOW API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
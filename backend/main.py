from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import auth, projects, support, jobs

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TalentAlign AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(support.router,  prefix="/support",  tags=["support"])
app.include_router(jobs.router,     prefix="/jobs",     tags=["jobs"])


@app.get("/")
def root():
    return {"message": "TalentAlign AI API is running"}

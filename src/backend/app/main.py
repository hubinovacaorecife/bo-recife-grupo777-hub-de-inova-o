from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

import os

load_dotenv()

from .auth_routes import UPLOADS_DIR, auth_router
from .projects_routes import projects_router
from .curation_routes import curation_router

app = FastAPI(title="REC SCIENCE")

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(curation_router)

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)
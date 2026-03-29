from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging, os, shutil, uuid as _uuid

from app.core.config import settings
from app.database import engine, Base
from app.models import *
from app.routers import auth, groups, users, todo
from app.routers.catalog import all_catalog_routers
from app.routers.company import router_company, router_marketplace
from app.services.auth import get_current_user

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)
logger.info("✅ All database tables verified/created.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Phase 3 — eCommerce MDM + Item Master + Company Settings + Marketplace API",
    version="3.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = "uploads"
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register all routers
app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(users.router)
app.include_router(todo.router)
for r in all_catalog_routers:
    app.include_router(r)
app.include_router(router_company)
app.include_router(router_marketplace)


@app.post("/api/upload/image", tags=["Utilities"])
async def upload_image(file: UploadFile = File(...), _=Depends(get_current_user)):
    ext  = file.filename.split(".")[-1].lower()
    name = f"{_uuid.uuid4()}.{ext}"
    path = os.path.join(uploads_dir, name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/uploads/{name}", "filename": name}


@app.get("/api/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "phase": "3.1"}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy", "database": "postgresql", "version": "3.1.0"}

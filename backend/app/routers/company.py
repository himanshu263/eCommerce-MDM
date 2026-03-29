"""Routers for Company Settings and Marketplace integration."""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil, os, uuid

from app.database import get_db
from app.services.auth import get_current_user
from app.services import company as svc
from app.schemas.company import (
    CompanySettingsUpdate, CompanySettingsResponse,
    MarketplaceCredentialCreate, MarketplaceCredentialUpdate, MarketplaceCredentialResponse,
    MarketplaceFetchRequest, MarketplaceProductResult,
)

_auth = [Depends(get_current_user)]

# ════════════════════════════════════════════════════════════════════════════
# COMPANY SETTINGS
# ════════════════════════════════════════════════════════════════════════════

router_company = APIRouter(prefix="/api/company", tags=["Company Settings"], dependencies=_auth)


@router_company.get("/settings", response_model=CompanySettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Get company settings (always returns singleton row)."""
    return svc.get_company_settings(db)


@router_company.put("/settings", response_model=CompanySettingsResponse)
def update_settings(
    payload: CompanySettingsUpdate,
    db: Session = Depends(get_db),
    u=Depends(get_current_user),
):
    """Update company settings."""
    return svc.update_company_settings(db, payload, username=u.username)


@router_company.post("/settings/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    u=Depends(get_current_user),
):
    """Upload company logo — returns URL."""
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    ext  = file.filename.split(".")[-1].lower()
    name = f"logo_{uuid.uuid4()}.{ext}"
    path = os.path.join(uploads_dir, name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    url = f"/uploads/{name}"

    # auto-save to settings
    settings = svc.get_company_settings(db)
    settings.logo_url  = url
    settings.updated_by = u.username
    db.commit()
    return {"url": url}


# ════════════════════════════════════════════════════════════════════════════
# MARKETPLACE CREDENTIALS
# ════════════════════════════════════════════════════════════════════════════

router_marketplace = APIRouter(prefix="/api/marketplace", tags=["Marketplace Integration"], dependencies=_auth)


@router_marketplace.get("/credentials", response_model=List[MarketplaceCredentialResponse])
def list_credentials(db: Session = Depends(get_db)):
    return svc.get_all_credentials(db)


@router_marketplace.get("/credentials/{cred_id}", response_model=MarketplaceCredentialResponse)
def get_credential(cred_id: int, db: Session = Depends(get_db)):
    return svc.get_credential(db, cred_id)


@router_marketplace.post("/credentials", response_model=MarketplaceCredentialResponse, status_code=201)
def create_credential(
    payload: MarketplaceCredentialCreate,
    db: Session = Depends(get_db),
    u=Depends(get_current_user),
):
    return svc.create_credential(db, payload, username=u.username)


@router_marketplace.put("/credentials/{cred_id}", response_model=MarketplaceCredentialResponse)
def update_credential(
    cred_id: int,
    payload: MarketplaceCredentialUpdate,
    db: Session = Depends(get_db),
    u=Depends(get_current_user),
):
    return svc.update_credential(db, cred_id, payload, username=u.username)


@router_marketplace.delete("/credentials/{cred_id}")
def delete_credential(cred_id: int, db: Session = Depends(get_db)):
    return svc.delete_credential(db, cred_id)


@router_marketplace.post("/credentials/{cred_id}/test")
def test_connection(cred_id: int, db: Session = Depends(get_db)):
    """Ping the marketplace API to verify credentials."""
    return svc.test_connection(db, cred_id)


@router_marketplace.post("/fetch", response_model=List[MarketplaceProductResult])
async def fetch_products(
    payload: MarketplaceFetchRequest,
    db: Session = Depends(get_db),
):
    """
    Fetch product data from a marketplace using saved credentials.
    Supports: Amazon SP-API, Flipkart Seller API, Meesho, demo/sandbox mode.
    """
    return await svc.fetch_marketplace_products(db, payload)

"""Schemas for Company Settings and Marketplace Credentials."""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Any, Dict
from datetime import datetime


# ════════════════════════════════════════════════════════════════════════════
# COMPANY SETTINGS
# ════════════════════════════════════════════════════════════════════════════

class CompanySettingsUpdate(BaseModel):
    company_name:      Optional[str] = None
    company_code:      Optional[str] = None
    legal_name:        Optional[str] = None
    tagline:           Optional[str] = None
    logo_url:          Optional[str] = None
    favicon_url:       Optional[str] = None
    website:           Optional[str] = None
    support_email:     Optional[str] = None
    support_phone:     Optional[str] = None
    address_line1:     Optional[str] = None
    address_line2:     Optional[str] = None
    city:              Optional[str] = None
    state:             Optional[str] = None
    pincode:           Optional[str] = None
    country:           Optional[str] = None
    gst_number:        Optional[str] = None
    pan_number:        Optional[str] = None
    cin_number:        Optional[str] = None
    tan_number:        Optional[str] = None
    msme_number:       Optional[str] = None
    fssai_number:      Optional[str] = None
    currency:          Optional[str] = None
    currency_symbol:   Optional[str] = None
    fiscal_year_start: Optional[str] = None
    default_tax_rate:  Optional[str] = None
    primary_color:     Optional[str] = None
    secondary_color:   Optional[str] = None
    theme_mode:        Optional[str] = None
    timezone:          Optional[str] = None
    date_format:       Optional[str] = None
    time_format:       Optional[str] = None
    language:          Optional[str] = None
    smtp_host:         Optional[str] = None
    smtp_port:         Optional[int] = None
    smtp_user:         Optional[str] = None
    smtp_password:     Optional[str] = None
    smtp_from_name:    Optional[str] = None
    smtp_from_email:   Optional[str] = None


class CompanySettingsResponse(BaseModel):
    id: int
    company_name:      Optional[str] = None
    company_code:      Optional[str] = None
    legal_name:        Optional[str] = None
    tagline:           Optional[str] = None
    logo_url:          Optional[str] = None
    favicon_url:       Optional[str] = None
    website:           Optional[str] = None
    support_email:     Optional[str] = None
    support_phone:     Optional[str] = None
    address_line1:     Optional[str] = None
    address_line2:     Optional[str] = None
    city:              Optional[str] = None
    state:             Optional[str] = None
    pincode:           Optional[str] = None
    country:           Optional[str] = None
    gst_number:        Optional[str] = None
    pan_number:        Optional[str] = None
    cin_number:        Optional[str] = None
    tan_number:        Optional[str] = None
    msme_number:       Optional[str] = None
    fssai_number:      Optional[str] = None
    currency:          Optional[str] = None
    currency_symbol:   Optional[str] = None
    fiscal_year_start: Optional[str] = None
    default_tax_rate:  Optional[str] = None
    primary_color:     Optional[str] = None
    secondary_color:   Optional[str] = None
    theme_mode:        Optional[str] = None
    timezone:          Optional[str] = None
    date_format:       Optional[str] = None
    time_format:       Optional[str] = None
    language:          Optional[str] = None
    smtp_host:         Optional[str] = None
    smtp_port:         Optional[int] = None
    smtp_user:         Optional[str] = None
    smtp_from_name:    Optional[str] = None
    smtp_from_email:   Optional[str] = None
    updated_by:        Optional[str] = None
    updated_at:        Optional[datetime] = None
    created_at:        Optional[datetime] = None

    class Config:
        from_attributes = True


# ════════════════════════════════════════════════════════════════════════════
# MARKETPLACE CREDENTIALS
# ════════════════════════════════════════════════════════════════════════════

class MarketplaceCredentialCreate(BaseModel):
    marketplace:      str
    display_name:     str
    is_active:        bool = True
    seller_id:        Optional[str] = None
    marketplace_id:   Optional[str] = None
    client_id:        Optional[str] = None
    client_secret:    Optional[str] = None
    refresh_token:    Optional[str] = None
    access_key:       Optional[str] = None
    secret_key:       Optional[str] = None
    role_arn:         Optional[str] = None
    region:           Optional[str] = "eu-west-1"
    api_key:          Optional[str] = None
    api_secret:       Optional[str] = None
    access_token:     Optional[str] = None
    endpoint_url:     Optional[str] = None
    extra_config:     Optional[Dict[str, Any]] = None
    auto_sync:        bool = False
    sync_interval_hr: int = 24


class MarketplaceCredentialUpdate(BaseModel):
    display_name:     Optional[str] = None
    is_active:        Optional[bool] = None
    seller_id:        Optional[str] = None
    marketplace_id:   Optional[str] = None
    client_id:        Optional[str] = None
    client_secret:    Optional[str] = None
    refresh_token:    Optional[str] = None
    access_key:       Optional[str] = None
    secret_key:       Optional[str] = None
    role_arn:         Optional[str] = None
    region:           Optional[str] = None
    api_key:          Optional[str] = None
    api_secret:       Optional[str] = None
    access_token:     Optional[str] = None
    endpoint_url:     Optional[str] = None
    extra_config:     Optional[Dict[str, Any]] = None
    auto_sync:        Optional[bool] = None
    sync_interval_hr: Optional[int] = None


class MarketplaceCredentialResponse(BaseModel):
    id: int
    marketplace:      str
    display_name:     str
    is_active:        bool
    is_connected:     bool
    seller_id:        Optional[str] = None
    marketplace_id:   Optional[str] = None
    client_id:        Optional[str] = None
    # secret fields omitted from response for security
    region:           Optional[str] = None
    endpoint_url:     Optional[str] = None
    auto_sync:        bool
    sync_interval_hr: int
    last_synced_at:   Optional[datetime] = None
    last_sync_status: Optional[str] = None
    last_sync_msg:    Optional[str] = None
    created_at:       datetime
    updated_at:       Optional[datetime] = None

    class Config:
        from_attributes = True


class MarketplaceFetchRequest(BaseModel):
    """Body for triggering a marketplace product fetch."""
    marketplace_id:   int              # FK to marketplace_credentials.id
    search_query:     Optional[str] = None
    asin:             Optional[str] = None    # Amazon-specific
    barcode:          Optional[str] = None
    seller_sku:       Optional[str] = None
    max_results:      int = 20
    import_to_catalog: bool = False   # auto-create Item Master records


class MarketplaceProductResult(BaseModel):
    """Normalised product data returned from any marketplace."""
    source:           str             # amazon_in, flipkart, etc.
    external_id:      str             # ASIN / Flipkart SKU
    title:            str
    brand:            Optional[str] = None
    category:         Optional[str] = None
    description:      Optional[str] = None
    bullet_points:    Optional[list] = None
    mrp:              Optional[float] = None
    selling_price:    Optional[float] = None
    currency:         Optional[str] = "INR"
    images:           Optional[list] = None
    model_number:     Optional[str] = None
    manufacturer:     Optional[str] = None
    country_of_origin:Optional[str] = None
    weight_kg:        Optional[float] = None
    dimensions:       Optional[dict] = None
    is_fba:           Optional[bool] = None
    raw:              Optional[dict] = None   # full raw API response

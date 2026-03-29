"""Company Settings & Marketplace API Credentials models."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class CompanySettings(Base):
    """Singleton table — always has exactly one row (id=1)."""
    __tablename__ = "company_settings"

    id               = Column(Integer, primary_key=True, default=1)

    # ── Basic Info ────────────────────────────────────────────────────────
    company_name     = Column(String(200), nullable=True)
    company_code     = Column(String(50),  nullable=True)
    legal_name       = Column(String(300), nullable=True)
    tagline          = Column(String(300), nullable=True)
    logo_url         = Column(String(1000),nullable=True)
    favicon_url      = Column(String(1000),nullable=True)
    website          = Column(String(300), nullable=True)
    support_email    = Column(String(150), nullable=True)
    support_phone    = Column(String(30),  nullable=True)

    # ── Address ───────────────────────────────────────────────────────────
    address_line1    = Column(String(300), nullable=True)
    address_line2    = Column(String(300), nullable=True)
    city             = Column(String(80),  nullable=True)
    state            = Column(String(80),  nullable=True)
    pincode          = Column(String(10),  nullable=True)
    country          = Column(String(80),  nullable=True, default="India")

    # ── Tax / Compliance ──────────────────────────────────────────────────
    gst_number       = Column(String(20),  nullable=True)
    pan_number       = Column(String(15),  nullable=True)
    cin_number       = Column(String(25),  nullable=True)   # Company ID (MCA)
    tan_number       = Column(String(15),  nullable=True)
    msme_number      = Column(String(30),  nullable=True)
    fssai_number     = Column(String(20),  nullable=True)   # Food license

    # ── Finance ───────────────────────────────────────────────────────────
    currency         = Column(String(10),  nullable=True, default="INR")
    currency_symbol  = Column(String(5),   nullable=True, default="₹")
    fiscal_year_start= Column(String(10),  nullable=True, default="04-01")  # MM-DD
    default_tax_rate = Column(String(10),  nullable=True, default="18")

    # ── Branding ──────────────────────────────────────────────────────────
    primary_color    = Column(String(10),  nullable=True, default="#4F46E5")
    secondary_color  = Column(String(10),  nullable=True, default="#7C3AED")
    theme_mode       = Column(String(10),  nullable=True, default="light")

    # ── System ────────────────────────────────────────────────────────────
    timezone         = Column(String(60),  nullable=True, default="Asia/Kolkata")
    date_format      = Column(String(20),  nullable=True, default="DD/MM/YYYY")
    time_format      = Column(String(10),  nullable=True, default="12h")
    language         = Column(String(10),  nullable=True, default="en")

    # ── Notifications ─────────────────────────────────────────────────────
    smtp_host        = Column(String(200), nullable=True)
    smtp_port        = Column(Integer,     nullable=True, default=587)
    smtp_user        = Column(String(150), nullable=True)
    smtp_password    = Column(String(300), nullable=True)  # encrypted in prod
    smtp_from_name   = Column(String(100), nullable=True)
    smtp_from_email  = Column(String(150), nullable=True)

    # ── Audit ─────────────────────────────────────────────────────────────
    updated_by       = Column(String(50),  nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())


class MarketplaceCredential(Base):
    """Stores API credentials for each marketplace integration."""
    __tablename__ = "marketplace_credentials"

    id               = Column(Integer, primary_key=True, index=True)
    marketplace      = Column(String(50),  nullable=False, index=True)  # amazon_in, flipkart, meesho, etc.
    display_name     = Column(String(100), nullable=False)
    is_active        = Column(Boolean, default=True)
    is_connected     = Column(Boolean, default=False)

    # ── Amazon SP-API ─────────────────────────────────────────────────────
    seller_id        = Column(String(100), nullable=True)
    marketplace_id   = Column(String(50),  nullable=True)   # e.g. A21TJRUUN4KGV (Amazon IN)
    client_id        = Column(String(200), nullable=True)   # LWA client ID
    client_secret    = Column(String(500), nullable=True)   # LWA client secret (encrypt in prod)
    refresh_token    = Column(String(1000),nullable=True)
    access_key       = Column(String(200), nullable=True)   # AWS IAM
    secret_key       = Column(String(500), nullable=True)   # AWS IAM
    role_arn         = Column(String(300), nullable=True)   # AWS role
    region           = Column(String(30),  nullable=True, default="eu-west-1")

    # ── Generic / Flipkart / Meesho / Others ─────────────────────────────
    api_key          = Column(String(500), nullable=True)
    api_secret       = Column(String(500), nullable=True)
    access_token     = Column(String(1000),nullable=True)
    token_expiry     = Column(DateTime(timezone=True), nullable=True)
    endpoint_url     = Column(String(500), nullable=True)
    extra_config     = Column(JSONB, nullable=True)         # any extra k-v pairs

    # ── Sync Settings ─────────────────────────────────────────────────────
    auto_sync        = Column(Boolean, default=False)
    sync_interval_hr = Column(Integer, default=24)
    last_synced_at   = Column(DateTime(timezone=True), nullable=True)
    last_sync_status = Column(String(20), nullable=True)    # success / failed / running
    last_sync_msg    = Column(Text, nullable=True)

    # ── Audit ─────────────────────────────────────────────────────────────
    created_by       = Column(String(50), nullable=True)
    updated_by       = Column(String(50), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

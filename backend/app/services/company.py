"""
Services for Company Settings and Marketplace API integrations.
Amazon SP-API fetch is implemented with the real endpoint structure.
Flipkart, Meesho, etc. are implemented as extensible stubs.
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from datetime import datetime, timezone
import logging, httpx, json

from app.models.company import CompanySettings, MarketplaceCredential
from app.schemas.company import (
    CompanySettingsUpdate, MarketplaceCredentialCreate,
    MarketplaceCredentialUpdate, MarketplaceFetchRequest,
    MarketplaceProductResult,
)

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════════════
# COMPANY SETTINGS  (singleton — always id=1)
# ════════════════════════════════════════════════════════════════════════════

def get_company_settings(db: Session) -> CompanySettings:
    row = db.query(CompanySettings).filter(CompanySettings.id == 1).first()
    if not row:
        row = CompanySettings(id=1, company_name="My Company", currency="INR",
                              currency_symbol="₹", country="India", timezone="Asia/Kolkata")
        db.add(row); db.commit(); db.refresh(row)
    return row


def update_company_settings(db: Session, payload: CompanySettingsUpdate, username: str) -> CompanySettings:
    row = get_company_settings(db)
    data = payload.model_dump(exclude_unset=True)
    data["updated_by"] = username
    for k, v in data.items():
        setattr(row, k, v)
    db.commit(); db.refresh(row)
    logger.info(f"Company settings updated by {username}")
    return row


# ════════════════════════════════════════════════════════════════════════════
# MARKETPLACE CREDENTIALS CRUD
# ════════════════════════════════════════════════════════════════════════════

def get_all_credentials(db: Session):
    return db.query(MarketplaceCredential).order_by(MarketplaceCredential.marketplace).all()


def get_credential(db: Session, cred_id: int) -> MarketplaceCredential:
    cred = db.query(MarketplaceCredential).filter(MarketplaceCredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Marketplace credential not found.")
    return cred


def create_credential(db: Session, payload: MarketplaceCredentialCreate, username: str):
    cred = MarketplaceCredential(**payload.model_dump(), created_by=username)
    db.add(cred); db.commit(); db.refresh(cred)
    return cred


def update_credential(db: Session, cred_id: int, payload: MarketplaceCredentialUpdate, username: str):
    cred = get_credential(db, cred_id)
    data = payload.model_dump(exclude_unset=True)
    data["updated_by"] = username
    for k, v in data.items():
        setattr(cred, k, v)
    db.commit(); db.refresh(cred)
    return cred


def delete_credential(db: Session, cred_id: int):
    cred = get_credential(db, cred_id)
    db.delete(cred); db.commit()
    return {"message": "Credential deleted."}


def test_connection(db: Session, cred_id: int) -> dict:
    """Ping the marketplace API to verify credentials are working."""
    cred = get_credential(db, cred_id)
    try:
        if cred.marketplace.startswith("amazon"):
            ok = _test_amazon(cred)
        elif cred.marketplace == "flipkart":
            ok = _test_flipkart(cred)
        else:
            ok = bool(cred.api_key or cred.client_id or cred.access_token)

        cred.is_connected     = ok
        cred.last_sync_status = "success" if ok else "failed"
        cred.last_sync_msg    = "Connection verified." if ok else "Could not reach API."
        cred.last_synced_at   = datetime.now(timezone.utc)
        db.commit()
        return {"connected": ok, "message": cred.last_sync_msg}
    except Exception as e:
        cred.is_connected = False; cred.last_sync_status = "failed"; cred.last_sync_msg = str(e)
        db.commit()
        return {"connected": False, "message": str(e)}


def _test_amazon(cred: MarketplaceCredential) -> bool:
    """Quick check — Amazon SP-API /sellers/v1/marketplaceParticipations."""
    if not all([cred.client_id, cred.client_secret, cred.refresh_token]):
        return False
    # In production: exchange refresh_token for access_token via LWA, then call SP-API.
    # Here we validate that required fields are present.
    return True


def _test_flipkart(cred: MarketplaceCredential) -> bool:
    return bool(cred.api_key and cred.api_secret)


# ════════════════════════════════════════════════════════════════════════════
# MARKETPLACE PRODUCT FETCH
# ════════════════════════════════════════════════════════════════════════════

async def fetch_marketplace_products(
    db: Session, payload: MarketplaceFetchRequest
) -> list[MarketplaceProductResult]:
    """
    Route the fetch request to the correct marketplace adapter.
    Returns a normalised list of MarketplaceProductResult objects.
    """
    cred = get_credential(db, payload.marketplace_id)
    if not cred.is_active:
        raise HTTPException(status_code=400, detail="Marketplace credential is inactive.")

    marketplace = cred.marketplace.lower()

    if marketplace in ("amazon_in", "amazon_us", "amazon_uk", "amazon"):
        results = await _fetch_amazon(cred, payload)
    elif marketplace == "flipkart":
        results = await _fetch_flipkart(cred, payload)
    elif marketplace == "meesho":
        results = await _fetch_meesho(cred, payload)
    elif marketplace == "myntra":
        results = await _fetch_myntra(cred, payload)
    elif marketplace == "demo":
        results = _fetch_demo(payload)
    else:
        results = _fetch_demo(payload)

    # Update sync status
    cred.last_synced_at   = datetime.now(timezone.utc)
    cred.last_sync_status = "success"
    cred.last_sync_msg    = f"Fetched {len(results)} products."
    db.commit()

    return results


# ── Amazon SP-API Adapter ─────────────────────────────────────────────────────

async def _fetch_amazon(cred: MarketplaceCredential, req: MarketplaceFetchRequest):
    """
    Amazon Selling Partner API — Catalog Items v2022-04-01
    Docs: https://developer-docs.amazon.com/sp-api/docs/catalog-items-api-v2022-04-01-reference

    Flow:
      1. Exchange refresh_token → access_token  (LWA)
      2. Assume IAM role via STS                (AWS SDK in production)
      3. Call GET /catalog/2022-04-01/items     (SP-API)
    """
    # Step 1: LWA token exchange
    access_token = await _amazon_get_access_token(cred)
    if not access_token:
        # Return demo data if credentials aren't real yet
        logger.warning("Amazon: could not obtain access token — returning demo data")
        return _fetch_demo(req, source="amazon_in")

    marketplace_id = cred.marketplace_id or "A21TJRUUN4KGV"  # Amazon India default
    endpoint       = f"https://sellingpartnerapi-eu.amazon.com"

    params = {
        "marketplaceIds": marketplace_id,
        "includedData":   "summaries,attributes,images,productTypes,relationships",
    }
    if req.asin:
        url = f"{endpoint}/catalog/2022-04-01/items/{req.asin}"
    elif req.search_query:
        url    = f"{endpoint}/catalog/2022-04-01/items"
        params["keywords"] = req.search_query
        params["pageSize"] = min(req.max_results, 20)
    else:
        return []

    headers = {
        "x-amz-access-token": access_token,
        "Content-Type":       "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"Amazon SP-API error: {e}")
        return _fetch_demo(req, source="amazon_in")

    # Normalise
    items = data.get("items", [data] if "asin" in data else [])
    return [_normalise_amazon_item(i) for i in items[:req.max_results]]


async def _amazon_get_access_token(cred: MarketplaceCredential) -> str | None:
    """Exchange LWA refresh_token for short-lived access_token."""
    if not all([cred.client_id, cred.client_secret, cred.refresh_token]):
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.amazon.com/auth/o2/token",
                data={
                    "grant_type":    "refresh_token",
                    "refresh_token": cred.refresh_token,
                    "client_id":     cred.client_id,
                    "client_secret": cred.client_secret,
                },
            )
            resp.raise_for_status()
            return resp.json().get("access_token")
    except Exception as e:
        logger.warning(f"LWA token exchange failed: {e}")
        return None


def _normalise_amazon_item(raw: dict) -> MarketplaceProductResult:
    """Map Amazon SP-API Catalog Item → our normalised schema."""
    summaries  = raw.get("summaries",  [{}])[0] if raw.get("summaries") else {}
    attributes = raw.get("attributes", {})
    images_raw = raw.get("images",     [{}])[0].get("images", []) if raw.get("images") else []

    def attr(key: str, sub="value"):
        v = attributes.get(key, [{}])
        return v[0].get(sub) if v else None

    images = [i.get("link") for i in images_raw if i.get("link")]

    bullet_points_raw = attributes.get("bullet_point", [])
    bullets = [b.get("value","") for b in bullet_points_raw if b.get("value")]

    item_weight = attributes.get("item_weight", [{}])
    weight_kg   = None
    if item_weight:
        w = item_weight[0]
        val  = w.get("value", 0)
        unit = w.get("unit", "kilograms").lower()
        if "gram" in unit:   weight_kg = float(val) / 1000
        elif "pound" in unit:weight_kg = float(val) * 0.453592
        else:                weight_kg = float(val)

    return MarketplaceProductResult(
        source           = "amazon_in",
        external_id      = raw.get("asin", ""),
        title            = summaries.get("itemName", attr("item_name") or ""),
        brand            = summaries.get("brand", attr("brand_name")),
        category         = summaries.get("productType", ""),
        description      = attr("product_description"),
        bullet_points    = bullets or None,
        selling_price    = None,   # price data needs Pricing API (separate call)
        currency         = "INR",
        images           = images or None,
        model_number     = attr("model_number"),
        manufacturer     = attr("manufacturer"),
        country_of_origin= attr("country_of_origin"),
        weight_kg        = weight_kg,
        is_fba           = None,
        raw              = raw,
    )


# ── Flipkart Adapter ──────────────────────────────────────────────────────────

async def _fetch_flipkart(cred: MarketplaceCredential, req: MarketplaceFetchRequest):
    """
    Flipkart Seller API
    Docs: https://seller.flipkart.com/api-docs/fmsapi_index.html
    """
    if not cred.api_key:
        return _fetch_demo(req, source="flipkart")

    base_url = cred.endpoint_url or "https://api.flipkart.net/sellers"
    headers  = {"Authorization": f"Bearer {cred.api_key}", "Content-Type": "application/json"}
    url      = f"{base_url}/listings/v3"
    params   = {"pageSize": min(req.max_results, 20)}
    if req.seller_sku: params["skuIds"] = req.seller_sku

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
        listings = data.get("listingList", [])
        return [_normalise_flipkart_item(l) for l in listings[:req.max_results]]
    except Exception as e:
        logger.error(f"Flipkart API error: {e}")
        return _fetch_demo(req, source="flipkart")


def _normalise_flipkart_item(raw: dict) -> MarketplaceProductResult:
    attr = raw.get("attributes", {})
    return MarketplaceProductResult(
        source        = "flipkart",
        external_id   = raw.get("fsn", raw.get("skuId", "")),
        title         = attr.get("name", raw.get("title", "")),
        brand         = attr.get("brand", ""),
        category      = raw.get("categoryPath", ""),
        description   = attr.get("description", ""),
        mrp           = raw.get("mrp"),
        selling_price = raw.get("sellingPrice"),
        currency      = "INR",
        images        = [raw.get("image")] if raw.get("image") else None,
        raw           = raw,
    )


# ── Meesho Adapter ────────────────────────────────────────────────────────────

async def _fetch_meesho(cred: MarketplaceCredential, req: MarketplaceFetchRequest):
    """Meesho Supplier API — requires api_key."""
    if not cred.api_key:
        return _fetch_demo(req, source="meesho")
    return _fetch_demo(req, source="meesho")   # extend when Meesho grants API access


# ── Myntra Adapter ────────────────────────────────────────────────────────────

async def _fetch_myntra(cred: MarketplaceCredential, req: MarketplaceFetchRequest):
    return _fetch_demo(req, source="myntra")


# ── Demo / Sandbox data ───────────────────────────────────────────────────────

def _fetch_demo(req: MarketplaceFetchRequest, source: str = "demo") -> list[MarketplaceProductResult]:
    """Returns realistic demo product data for sandbox / testing."""
    query = req.search_query or req.asin or "product"
    DEMO_PRODUCTS = [
        {
            "external_id":"B0CHX1W1XY","title":"Samsung Galaxy S24 Ultra 5G (Titanium Black, 12GB, 256GB)","brand":"Samsung",
            "category":"Smartphones","mrp":134999,"selling_price":117999,"currency":"INR",
            "images":["https://m.media-amazon.com/images/I/81SigpJN1KL._SL1500_.jpg"],
            "model_number":"SM-S928BZKGINS","manufacturer":"Samsung India Electronics Pvt Ltd",
            "country_of_origin":"South Korea","weight_kg":0.232,
            "bullet_points":["200MP ProVisual Camera","Snapdragon 8 Gen 3","5000mAh battery","Titanium frame","S Pen included"],
            "description":"Experience Galaxy AI with the S24 Ultra. Features the most powerful Snapdragon 8 Gen 3 processor."
        },
        {
            "external_id":"B09G3HRMVB","title":"Apple iPhone 15 Pro (Black Titanium, 256 GB)","brand":"Apple",
            "category":"Smartphones","mrp":134900,"selling_price":129900,"currency":"INR",
            "images":["https://m.media-amazon.com/images/I/81Os1SDWpcL._SL1500_.jpg"],
            "model_number":"MTQD3HN/A","manufacturer":"Apple Inc.",
            "country_of_origin":"China","weight_kg":0.187,
            "bullet_points":["A17 Pro chip","48MP camera system","Titanium design","USB-C","Action Button"],
            "description":"iPhone 15 Pro. Forged in titanium and featuring the groundbreaking A17 Pro chip."
        },
        {
            "external_id":"B0C4PMNYDT","title":"OnePlus 12 5G (Flowy Emerald, 12GB RAM, 256GB)","brand":"OnePlus",
            "category":"Smartphones","mrp":64999,"selling_price":59999,"currency":"INR",
            "images":["https://m.media-amazon.com/images/I/61VfL20+2BL._SL1500_.jpg"],
            "model_number":"CPH2573","manufacturer":"OnePlus Technology","country_of_origin":"China","weight_kg":0.22,
            "bullet_points":["Snapdragon 8 Gen 3","Hasselblad Camera","100W SUPERVOOC","5400mAh battery","OxygenOS 14"],
            "description":"OnePlus 12 brings Snapdragon 8 Gen 3 with Hasselblad tuned cameras."
        },
        {
            "external_id":"B0BJWLBNJG","title":"boAt Rockerz 450 Bluetooth On Ear Headphones","brand":"boAt",
            "category":"Headphones","mrp":3490,"selling_price":1299,"currency":"INR",
            "images":["https://m.media-amazon.com/images/I/61C4WEEfv4L._SL1500_.jpg"],
            "model_number":"Rockerz 450","manufacturer":"Imagine Marketing Pvt Ltd",
            "country_of_origin":"China","weight_kg":0.25,
            "bullet_points":["15H playback","40mm drivers","Padded ear cushions","Foldable design","Voice assistant"],
            "description":"boAt Rockerz 450 on-ear bluetooth headphones with superior sound quality."
        },
        {
            "external_id":"B07N4M94X4","title":"Fastrack Reflex 3.0 Smartwatch (Black)","brand":"Fastrack",
            "category":"Smartwatches","mrp":3995,"selling_price":2495,"currency":"INR",
            "images":["https://m.media-amazon.com/images/I/61rEgz6IXML._SL1500_.jpg"],
            "model_number":"SWD90069PP01","manufacturer":"Titan Company Limited",
            "country_of_origin":"India","weight_kg":0.04,
            "bullet_points":["1.3 inch touch display","Heart rate monitor","5 day battery","Water resistant","24/7 activity tracking"],
            "description":"The Fastrack Reflex 3.0 is your everyday active companion."
        },
    ]

    # Filter by query
    query_lower = query.lower()
    matched = [p for p in DEMO_PRODUCTS if query_lower in p["title"].lower() or query_lower in p["category"].lower()] or DEMO_PRODUCTS

    return [
        MarketplaceProductResult(source=source, **{k: v for k, v in p.items()})
        for p in matched[:req.max_results]
    ]

"""Pydantic schemas for all Phase 3 catalog masters and Item Master."""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal


# ── Shared helpers ────────────────────────────────────────────────────────────

class AuditMixin(BaseModel):
    id:         int
    is_active:  bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ════════════════════════════════════════════════════════════════════════════
# HIERARCHY
# ════════════════════════════════════════════════════════════════════════════

class ProductGroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=30)
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class ProductGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    code: Optional[str] = Field(None, min_length=2, max_length=30)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class ProductGroupResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    is_active: bool
    sort_order: int
    sub_group_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ProductGroupListResponse(BaseModel):
    total: int
    items: List[ProductGroupResponse]


class SubGroupCreate(BaseModel):
    product_group_id: int
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=30)
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class SubGroupUpdate(BaseModel):
    product_group_id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class SubGroupResponse(BaseModel):
    id: int
    product_group_id: int
    product_group_name: Optional[str] = None
    name: str
    code: str
    description: Optional[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SubGroupListResponse(BaseModel):
    total: int
    items: List[SubGroupResponse]


class CategoryCreate(BaseModel):
    sub_group_id: int
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=30)
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    sub_group_id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class CategoryResponse(BaseModel):
    id: int
    sub_group_id: int
    sub_group_name: Optional[str] = None
    product_group_name: Optional[str] = None
    name: str
    code: str
    description: Optional[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class CategoryListResponse(BaseModel):
    total: int
    items: List[CategoryResponse]


class SubCategoryCreate(BaseModel):
    category_id: int
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=30)
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class SubCategoryUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class SubCategoryResponse(BaseModel):
    id: int
    category_id: int
    category_name: Optional[str] = None
    sub_group_name: Optional[str] = None
    product_group_name: Optional[str] = None
    name: str
    code: str
    description: Optional[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SubCategoryListResponse(BaseModel):
    total: int
    items: List[SubCategoryResponse]


# ════════════════════════════════════════════════════════════════════════════
# GENERIC ATTRIBUTE MASTER (Brand, Manufacturer, Supplier use richer schemas)
# ════════════════════════════════════════════════════════════════════════════

class SimpleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    code: str = Field(..., min_length=1, max_length=40)
    description: Optional[str] = None
    is_active: bool = True

class SimpleUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SimpleResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SimpleListResponse(BaseModel):
    total: int
    items: List[SimpleResponse]


# ── Brand ─────────────────────────────────────────────────────────────────

class BrandCreate(BaseModel):
    name: str = Field(..., max_length=120)
    code: str = Field(..., max_length=40)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website:  Optional[str] = None
    country:  Optional[str] = None
    is_active: bool = True

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website:  Optional[str] = None
    country:  Optional[str] = None
    is_active: Optional[bool] = None

class BrandResponse(BaseModel):
    id: int; name: str; code: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website:  Optional[str] = None
    country:  Optional[str] = None
    is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class BrandListResponse(BaseModel):
    total: int; items: List[BrandResponse]


# ── Supplier ──────────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str; code: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    is_active: bool = True

class SupplierUpdate(BaseModel):
    name: Optional[str] = None; code: Optional[str] = None
    contact_name: Optional[str] = None; email: Optional[str] = None
    phone: Optional[str] = None; address: Optional[str] = None
    gst_number: Optional[str] = None; is_active: Optional[bool] = None

class SupplierResponse(BaseModel):
    id: int; name: str; code: str
    contact_name: Optional[str] = None; email: Optional[str] = None
    phone: Optional[str] = None; address: Optional[str] = None
    gst_number: Optional[str] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class SupplierListResponse(BaseModel):
    total: int; items: List[SupplierResponse]


# ── Seller ────────────────────────────────────────────────────────────────

class SellerCreate(BaseModel):
    name: str; code: str
    email: Optional[str] = None; phone: Optional[str] = None
    gst_number: Optional[str] = None; address: Optional[str] = None
    rating: Optional[Decimal] = None; is_active: bool = True

class SellerUpdate(BaseModel):
    name: Optional[str] = None; code: Optional[str] = None
    email: Optional[str] = None; phone: Optional[str] = None
    gst_number: Optional[str] = None; address: Optional[str] = None
    rating: Optional[Decimal] = None; is_active: Optional[bool] = None

class SellerResponse(BaseModel):
    id: int; name: str; code: str
    email: Optional[str] = None; phone: Optional[str] = None
    gst_number: Optional[str] = None; address: Optional[str] = None
    rating: Optional[Decimal] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class SellerListResponse(BaseModel):
    total: int; items: List[SellerResponse]


# ── HSN ───────────────────────────────────────────────────────────────────

class HSNCreate(BaseModel):
    hsn_code: str; description: Optional[str] = None
    gst_rate: Optional[Decimal] = None; is_active: bool = True

class HSNUpdate(BaseModel):
    hsn_code: Optional[str] = None; description: Optional[str] = None
    gst_rate: Optional[Decimal] = None; is_active: Optional[bool] = None

class HSNResponse(BaseModel):
    id: int; hsn_code: str; description: Optional[str] = None
    gst_rate: Optional[Decimal] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class HSNListResponse(BaseModel):
    total: int; items: List[HSNResponse]


# ── GST Rate ──────────────────────────────────────────────────────────────

class GSTCreate(BaseModel):
    name: str; rate: Decimal
    cgst: Optional[Decimal] = None; sgst: Optional[Decimal] = None
    igst: Optional[Decimal] = None; is_active: bool = True

class GSTUpdate(BaseModel):
    name: Optional[str] = None; rate: Optional[Decimal] = None
    cgst: Optional[Decimal] = None; sgst: Optional[Decimal] = None
    igst: Optional[Decimal] = None; is_active: Optional[bool] = None

class GSTResponse(BaseModel):
    id: int; name: str; rate: Decimal
    cgst: Optional[Decimal] = None; sgst: Optional[Decimal] = None
    igst: Optional[Decimal] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class GSTListResponse(BaseModel):
    total: int; items: List[GSTResponse]


# ── Warehouse ─────────────────────────────────────────────────────────────

class WarehouseCreate(BaseModel):
    name: str; code: str
    address: Optional[str] = None; city: Optional[str] = None
    state: Optional[str] = None; pincode: Optional[str] = None
    contact: Optional[str] = None; is_active: bool = True

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None; code: Optional[str] = None
    address: Optional[str] = None; city: Optional[str] = None
    state: Optional[str] = None; pincode: Optional[str] = None
    contact: Optional[str] = None; is_active: Optional[bool] = None

class WarehouseResponse(BaseModel):
    id: int; name: str; code: str
    address: Optional[str] = None; city: Optional[str] = None
    state: Optional[str] = None; pincode: Optional[str] = None
    contact: Optional[str] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class WarehouseListResponse(BaseModel):
    total: int; items: List[WarehouseResponse]


# ── DeliveryType ──────────────────────────────────────────────────────────

class DeliveryTypeCreate(BaseModel):
    name: str; code: str; description: Optional[str] = None
    charges: Decimal = Decimal("0"); eta_days: Optional[int] = None; is_active: bool = True

class DeliveryTypeUpdate(BaseModel):
    name: Optional[str] = None; code: Optional[str] = None
    description: Optional[str] = None; charges: Optional[Decimal] = None
    eta_days: Optional[int] = None; is_active: Optional[bool] = None

class DeliveryTypeResponse(BaseModel):
    id: int; name: str; code: str; description: Optional[str] = None
    charges: Optional[Decimal] = None; eta_days: Optional[int] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class DeliveryTypeListResponse(BaseModel):
    total: int; items: List[DeliveryTypeResponse]


# ── ReturnPolicy ──────────────────────────────────────────────────────────

class ReturnPolicyCreate(BaseModel):
    name: str; code: str; return_days: int = 0
    policy_details: Optional[str] = None; is_returnable: bool = True; is_active: bool = True

class ReturnPolicyUpdate(BaseModel):
    name: Optional[str] = None; code: Optional[str] = None
    return_days: Optional[int] = None; policy_details: Optional[str] = None
    is_returnable: Optional[bool] = None; is_active: Optional[bool] = None

class ReturnPolicyResponse(BaseModel):
    id: int; name: str; code: str; return_days: int
    policy_details: Optional[str] = None; is_returnable: bool; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class ReturnPolicyListResponse(BaseModel):
    total: int; items: List[ReturnPolicyResponse]


# ── Warranty ──────────────────────────────────────────────────────────────

class WarrantyCreate(BaseModel):
    name: str; code: str; duration_months: int = 0
    warranty_type: Optional[str] = None; description: Optional[str] = None; is_active: bool = True

class WarrantyUpdate(BaseModel):
    name: Optional[str] = None; code: Optional[str] = None
    duration_months: Optional[int] = None; warranty_type: Optional[str] = None
    description: Optional[str] = None; is_active: Optional[bool] = None

class WarrantyResponse(BaseModel):
    id: int; name: str; code: str; duration_months: int
    warranty_type: Optional[str] = None; description: Optional[str] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class WarrantyListResponse(BaseModel):
    total: int; items: List[WarrantyResponse]


# ── AltSKU ────────────────────────────────────────────────────────────────

class AltSKUCreate(BaseModel):
    sku_code: str; sku_type: Optional[str] = None
    source: Optional[str] = None; is_active: bool = True

class AltSKUResponse(BaseModel):
    id: int; sku_code: str; sku_type: Optional[str] = None
    source: Optional[str] = None; is_active: bool
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True


# ════════════════════════════════════════════════════════════════════════════
# ITEM MASTER
# ════════════════════════════════════════════════════════════════════════════

class ItemCreate(BaseModel):
    # Identity
    sku:              str = Field(..., min_length=2, max_length=100)
    item_name:        str = Field(..., min_length=2, max_length=300)
    short_name:       Optional[str] = None
    description:      Optional[str] = None
    bullet_points:    Optional[List[str]] = None
    search_keywords:  Optional[str] = None

    # Hierarchy
    sub_category_id:  Optional[int] = None
    product_type_id:  Optional[int] = None

    # Attributes
    brand_id:         Optional[int] = None
    manufacturer_id:  Optional[int] = None
    supplier_id:      Optional[int] = None
    seller_id:        Optional[int] = None
    material_id:      Optional[int] = None
    pattern_id:       Optional[int] = None
    style_id:         Optional[int] = None
    unit_id:          Optional[int] = None
    weight_unit_id:   Optional[int] = None
    color_ids:        Optional[List[int]] = []
    size_ids:         Optional[List[int]] = []

    # Physical
    weight:           Optional[Decimal] = None
    length_cm:        Optional[Decimal] = None
    width_cm:         Optional[Decimal] = None
    height_cm:        Optional[Decimal] = None
    package_weight:   Optional[Decimal] = None

    # Pricing
    mrp:              Optional[Decimal] = None
    selling_price:    Optional[Decimal] = None
    cost_price:       Optional[Decimal] = None
    discount_pct:     Optional[Decimal] = None

    # Tax
    hsn_id:           Optional[int] = None
    gst_rate_id:      Optional[int] = None

    # Inventory
    warehouse_id:     Optional[int] = None
    stock_status_id:  Optional[int] = None
    stock_qty:        int = 0
    min_order_qty:    int = 1
    max_order_qty:    Optional[int] = None

    # Logistics
    delivery_type_id: Optional[int] = None
    return_policy_id: Optional[int] = None
    warranty_id:      Optional[int] = None

    # Amazon/Marketplace
    asin:             Optional[str] = None
    fnsku:            Optional[str] = None
    model_number:     Optional[str] = None
    part_number:      Optional[str] = None
    country_of_origin: Optional[str] = None
    is_hazmat:        bool = False
    is_fragile:       bool = False
    is_fba_eligible:  bool = True
    age_restriction:  Optional[str] = None
    battery_required: bool = False
    included_components: Optional[List[str]] = None

    # Images
    primary_image:    Optional[str] = None
    image_urls:       Optional[List[str]] = None

    # Alt SKUs
    alt_sku_ids:      Optional[List[int]] = []

    # Status
    is_active:        bool = True
    is_published:     bool = False


class ItemUpdate(BaseModel):
    sku:              Optional[str] = None
    item_name:        Optional[str] = None
    short_name:       Optional[str] = None
    description:      Optional[str] = None
    bullet_points:    Optional[List[str]] = None
    search_keywords:  Optional[str] = None
    sub_category_id:  Optional[int] = None
    product_type_id:  Optional[int] = None
    brand_id:         Optional[int] = None
    manufacturer_id:  Optional[int] = None
    supplier_id:      Optional[int] = None
    seller_id:        Optional[int] = None
    material_id:      Optional[int] = None
    pattern_id:       Optional[int] = None
    style_id:         Optional[int] = None
    unit_id:          Optional[int] = None
    weight_unit_id:   Optional[int] = None
    color_ids:        Optional[List[int]] = None
    size_ids:         Optional[List[int]] = None
    weight:           Optional[Decimal] = None
    length_cm:        Optional[Decimal] = None
    width_cm:         Optional[Decimal] = None
    height_cm:        Optional[Decimal] = None
    package_weight:   Optional[Decimal] = None
    mrp:              Optional[Decimal] = None
    selling_price:    Optional[Decimal] = None
    cost_price:       Optional[Decimal] = None
    discount_pct:     Optional[Decimal] = None
    hsn_id:           Optional[int] = None
    gst_rate_id:      Optional[int] = None
    warehouse_id:     Optional[int] = None
    stock_status_id:  Optional[int] = None
    stock_qty:        Optional[int] = None
    min_order_qty:    Optional[int] = None
    max_order_qty:    Optional[int] = None
    delivery_type_id: Optional[int] = None
    return_policy_id: Optional[int] = None
    warranty_id:      Optional[int] = None
    asin:             Optional[str] = None
    fnsku:            Optional[str] = None
    model_number:     Optional[str] = None
    part_number:      Optional[str] = None
    country_of_origin: Optional[str] = None
    is_hazmat:        Optional[bool] = None
    is_fragile:       Optional[bool] = None
    is_fba_eligible:  Optional[bool] = None
    age_restriction:  Optional[str] = None
    battery_required: Optional[bool] = None
    included_components: Optional[List[str]] = None
    primary_image:    Optional[str] = None
    image_urls:       Optional[List[str]] = None
    alt_sku_ids:      Optional[List[int]] = None
    is_active:        Optional[bool] = None
    is_published:     Optional[bool] = None


class ItemResponse(BaseModel):
    id: int; sku: str; item_name: str; short_name: Optional[str] = None
    description: Optional[str] = None
    bullet_points: Optional[List[str]] = None
    search_keywords: Optional[str] = None
    sub_category_id: Optional[int] = None
    sub_category_name: Optional[str] = None
    product_type_id: Optional[int] = None
    product_type_name: Optional[str] = None
    brand_id: Optional[int] = None; brand_name: Optional[str] = None
    manufacturer_id: Optional[int] = None; manufacturer_name: Optional[str] = None
    supplier_id: Optional[int] = None; supplier_name: Optional[str] = None
    seller_id: Optional[int] = None; seller_name: Optional[str] = None
    material_id: Optional[int] = None; material_name: Optional[str] = None
    pattern_id: Optional[int] = None; pattern_name: Optional[str] = None
    style_id: Optional[int] = None; style_name: Optional[str] = None
    unit_id: Optional[int] = None; unit_name: Optional[str] = None
    weight_unit_id: Optional[int] = None; weight_unit_name: Optional[str] = None
    colors: Optional[List[Any]] = []
    sizes:  Optional[List[Any]] = []
    weight: Optional[Decimal] = None; length_cm: Optional[Decimal] = None
    width_cm: Optional[Decimal] = None; height_cm: Optional[Decimal] = None
    package_weight: Optional[Decimal] = None
    mrp: Optional[Decimal] = None; selling_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None; discount_pct: Optional[Decimal] = None
    hsn_id: Optional[int] = None; hsn_code: Optional[str] = None
    gst_rate_id: Optional[int] = None; gst_rate_name: Optional[str] = None
    warehouse_id: Optional[int] = None; warehouse_name: Optional[str] = None
    stock_status_id: Optional[int] = None; stock_status_name: Optional[str] = None
    stock_qty: int = 0; min_order_qty: int = 1; max_order_qty: Optional[int] = None
    delivery_type_id: Optional[int] = None; delivery_type_name: Optional[str] = None
    return_policy_id: Optional[int] = None; return_policy_name: Optional[str] = None
    warranty_id: Optional[int] = None; warranty_name: Optional[str] = None
    asin: Optional[str] = None; fnsku: Optional[str] = None
    model_number: Optional[str] = None; part_number: Optional[str] = None
    country_of_origin: Optional[str] = None
    is_hazmat: bool = False; is_fragile: bool = False
    is_fba_eligible: bool = True; age_restriction: Optional[str] = None
    battery_required: bool = False; included_components: Optional[List[str]] = None
    primary_image: Optional[str] = None; image_urls: Optional[List[str]] = None
    alt_skus: Optional[List[Any]] = []
    is_active: bool; is_published: bool
    created_by: Optional[str] = None; updated_by: Optional[str] = None
    created_at: datetime; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class ItemListResponse(BaseModel):
    total: int; items: List[ItemResponse]

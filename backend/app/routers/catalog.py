"""
All catalog routers in one file — each master gets its own APIRouter,
then all are exported via `all_routers` list and registered in main.py.
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import csv, io

from app.database import get_db
from app.services.auth import get_current_user
from app.services import catalog as svc
from app.schemas.catalog import *

_auth = [Depends(get_current_user)]


# ── helper to build a standard router ────────────────────────────────────────
def _make_router(prefix, tag, crud_obj, CreateSchema, UpdateSchema, ResponseSchema, ListSchema):
    r = APIRouter(prefix=prefix, tags=[tag], dependencies=_auth)

    @r.get("/", response_model=ListSchema)
    def list_all(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
                 active_only: bool = False, db: Session = Depends(get_db)):
        total, rows = crud_obj.get_all(db, skip, limit, active_only)
        return {"total": total, "items": rows}

    @r.get("/{row_id}", response_model=ResponseSchema)
    def get_one(row_id: int, db: Session = Depends(get_db)):
        return crud_obj.get_by_id(db, row_id)

    @r.post("/", response_model=ResponseSchema, status_code=201)
    def create(payload: CreateSchema, db: Session = Depends(get_db),
               current_user=Depends(get_current_user)):
        return crud_obj.create(db, payload, username=current_user.username)

    @r.put("/{row_id}", response_model=ResponseSchema)
    def update(row_id: int, payload: UpdateSchema, db: Session = Depends(get_db),
               current_user=Depends(get_current_user)):
        return crud_obj.update(db, row_id, payload, username=current_user.username)

    @r.delete("/{row_id}")
    def delete(row_id: int, db: Session = Depends(get_db)):
        return crud_obj.delete(db, row_id)

    return r


# ════════════════════════════════════════════════════════════════════════════
# HIERARCHY ROUTERS
# ════════════════════════════════════════════════════════════════════════════

router_product_group = _make_router(
    "/api/mdm/product-groups", "Product Groups",
    svc.product_group_crud, ProductGroupCreate, ProductGroupUpdate,
    ProductGroupResponse, ProductGroupListResponse
)

# SubGroup needs parent filter
router_sub_group = APIRouter(prefix="/api/mdm/sub-groups", tags=["Sub Groups"], dependencies=_auth)

@router_sub_group.get("/", response_model=SubGroupListResponse)
def list_sub_groups(skip: int = 0, limit: int = 100,
                    product_group_id: Optional[int] = None,
                    db: Session = Depends(get_db)):
    total, rows = svc.get_all_sub_groups(db, product_group_id, skip, limit)
    return {"total": total, "items": rows}

@router_sub_group.get("/{row_id}", response_model=SubGroupResponse)
def get_sub_group(row_id: int, db: Session = Depends(get_db)):
    return svc.sub_group_crud.get_by_id(db, row_id)

@router_sub_group.post("/", response_model=SubGroupResponse, status_code=201)
def create_sub_group(payload: SubGroupCreate, db: Session = Depends(get_db),
                     u=Depends(get_current_user)):
    return svc.sub_group_crud.create(db, payload, username=u.username)

@router_sub_group.put("/{row_id}", response_model=SubGroupResponse)
def update_sub_group(row_id: int, payload: SubGroupUpdate, db: Session = Depends(get_db),
                     u=Depends(get_current_user)):
    return svc.sub_group_crud.update(db, row_id, payload, username=u.username)

@router_sub_group.delete("/{row_id}")
def delete_sub_group(row_id: int, db: Session = Depends(get_db)):
    return svc.sub_group_crud.delete(db, row_id)


# Category
router_category = APIRouter(prefix="/api/mdm/categories", tags=["Categories"], dependencies=_auth)

@router_category.get("/", response_model=CategoryListResponse)
def list_categories(skip: int = 0, limit: int = 100, sub_group_id: Optional[int] = None,
                    db: Session = Depends(get_db)):
    total, rows = svc.get_all_categories(db, sub_group_id, skip, limit)
    return {"total": total, "items": rows}

@router_category.get("/{row_id}", response_model=CategoryResponse)
def get_category(row_id: int, db: Session = Depends(get_db)):
    return svc.category_crud.get_by_id(db, row_id)

@router_category.post("/", response_model=CategoryResponse, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return svc.category_crud.create(db, payload, username=u.username)

@router_category.put("/{row_id}", response_model=CategoryResponse)
def update_category(row_id: int, payload: CategoryUpdate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return svc.category_crud.update(db, row_id, payload, username=u.username)

@router_category.delete("/{row_id}")
def delete_category(row_id: int, db: Session = Depends(get_db)):
    return svc.category_crud.delete(db, row_id)


# SubCategory
router_sub_category = APIRouter(prefix="/api/mdm/sub-categories", tags=["Sub Categories"], dependencies=_auth)

@router_sub_category.get("/", response_model=SubCategoryListResponse)
def list_sub_categories(skip: int = 0, limit: int = 100, category_id: Optional[int] = None,
                        db: Session = Depends(get_db)):
    total, rows = svc.get_all_sub_categories(db, category_id, skip, limit)
    return {"total": total, "items": rows}

@router_sub_category.get("/{row_id}", response_model=SubCategoryResponse)
def get_sub_category(row_id: int, db: Session = Depends(get_db)):
    return svc.sub_category_crud.get_by_id(db, row_id)

@router_sub_category.post("/", response_model=SubCategoryResponse, status_code=201)
def create_sub_category(payload: SubCategoryCreate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return svc.sub_category_crud.create(db, payload, username=u.username)

@router_sub_category.put("/{row_id}", response_model=SubCategoryResponse)
def update_sub_category(row_id: int, payload: SubCategoryUpdate, db: Session = Depends(get_db), u=Depends(get_current_user)):
    return svc.sub_category_crud.update(db, row_id, payload, username=u.username)

@router_sub_category.delete("/{row_id}")
def delete_sub_category(row_id: int, db: Session = Depends(get_db)):
    return svc.sub_category_crud.delete(db, row_id)


# ════════════════════════════════════════════════════════════════════════════
# ATTRIBUTE MASTER ROUTERS  (simple generic)
# ════════════════════════════════════════════════════════════════════════════

router_brand        = _make_router("/api/mdm/brands",        "Brands",        svc.brand_crud,        BrandCreate,        BrandUpdate,        BrandResponse,        BrandListResponse)
router_manufacturer = _make_router("/api/mdm/manufacturers", "Manufacturers", svc.manufacturer_crud, SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_supplier     = _make_router("/api/mdm/suppliers",     "Suppliers",     svc.supplier_crud,     SupplierCreate,     SupplierUpdate,     SupplierResponse,     SupplierListResponse)
router_size         = _make_router("/api/mdm/sizes",         "Sizes",         svc.size_crud,         SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_color        = _make_router("/api/mdm/colors",        "Colors",        svc.color_crud,        SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_weight_unit  = _make_router("/api/mdm/weight-units",  "Weight Units",  svc.weight_unit_crud,  SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_unit         = _make_router("/api/mdm/units",         "Units",         svc.unit_crud,         SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_material     = _make_router("/api/mdm/materials",     "Materials",     svc.material_crud,     SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_pattern      = _make_router("/api/mdm/patterns",      "Patterns",      svc.pattern_crud,      SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_style        = _make_router("/api/mdm/styles",        "Styles",        svc.style_crud,        SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_product_type = _make_router("/api/mdm/product-types", "Product Types", svc.product_type_crud, SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)

# ── Advanced masters ──────────────────────────────────────────────────────────
router_hsn          = _make_router("/api/mdm/hsn",            "HSN Codes",      svc.hsn_crud,           HSNCreate,          HSNUpdate,          HSNResponse,          HSNListResponse)
router_gst          = _make_router("/api/mdm/gst-rates",      "GST Rates",      svc.gst_crud,           GSTCreate,          GSTUpdate,          GSTResponse,          GSTListResponse)
router_warehouse    = _make_router("/api/mdm/warehouses",     "Warehouses",     svc.warehouse_crud,     WarehouseCreate,    WarehouseUpdate,    WarehouseResponse,    WarehouseListResponse)
router_stock_status = _make_router("/api/mdm/stock-statuses", "Stock Statuses", svc.stock_status_crud,  SimpleCreate,       SimpleUpdate,       SimpleResponse,       SimpleListResponse)
router_delivery     = _make_router("/api/mdm/delivery-types", "Delivery Types", svc.delivery_type_crud, DeliveryTypeCreate, DeliveryTypeUpdate, DeliveryTypeResponse, DeliveryTypeListResponse)
router_return       = _make_router("/api/mdm/return-policies","Return Policies",svc.return_policy_crud, ReturnPolicyCreate, ReturnPolicyUpdate, ReturnPolicyResponse, ReturnPolicyListResponse)
router_warranty     = _make_router("/api/mdm/warranties",     "Warranties",     svc.warranty_crud,      WarrantyCreate,     WarrantyUpdate,     WarrantyResponse,     WarrantyListResponse)
router_seller       = _make_router("/api/mdm/sellers",        "Sellers",        svc.seller_crud,        SellerCreate,       SellerUpdate,       SellerResponse,       SellerListResponse)
router_alt_sku      = _make_router("/api/mdm/alt-skus",       "Alt SKUs",       svc.alt_sku_crud,       AltSKUCreate,       AltSKUCreate,       AltSKUResponse,       SimpleListResponse)


# ════════════════════════════════════════════════════════════════════════════
# ITEM MASTER ROUTER
# ════════════════════════════════════════════════════════════════════════════

router_item = APIRouter(prefix="/api/items", tags=["Item Master"], dependencies=_auth)

@router_item.get("/", response_model=ItemListResponse)
def list_items(skip: int = 0, limit: int = 50,
               search: Optional[str] = None,
               sub_category_id: Optional[int] = None,
               brand_id: Optional[int] = None,
               is_published: Optional[bool] = None,
               db: Session = Depends(get_db)):
    total, rows = svc.get_all_items(db, skip, limit, search, sub_category_id, brand_id, is_published)
    return {"total": total, "items": rows}

@router_item.get("/generate-sku")
def generate_sku(sub_category_code: str = "GEN", brand_code: str = "XX",
                 db: Session = Depends(get_db)):
    return {"sku": svc.generate_sku(db, sub_category_code, brand_code)}

@router_item.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    return svc.get_item_by_id(db, item_id)

@router_item.post("/", response_model=ItemResponse, status_code=201)
def create_item(payload: ItemCreate, db: Session = Depends(get_db),
                u=Depends(get_current_user)):
    return svc.create_item(db, payload, username=u.username)

@router_item.put("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db),
                u=Depends(get_current_user)):
    return svc.update_item(db, item_id, payload, username=u.username)

@router_item.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    return svc.delete_item(db, item_id)

@router_item.post("/bulk-upload")
async def bulk_upload_items(file: UploadFile = File(...), db: Session = Depends(get_db),
                             u=Depends(get_current_user)):
    """Accept CSV, return preview of rows parsed (actual import via separate confirm)."""
    content = await file.read()
    reader  = csv.DictReader(io.StringIO(content.decode("utf-8")))
    rows    = list(reader)
    return {"message": f"{len(rows)} rows parsed.", "preview": rows[:5], "total_rows": len(rows)}


# ── Export all routers ────────────────────────────────────────────────────────
all_catalog_routers = [
    router_product_group, router_sub_group, router_category, router_sub_category,
    router_brand, router_manufacturer, router_supplier,
    router_size, router_color, router_weight_unit, router_unit,
    router_material, router_pattern, router_style, router_product_type,
    router_hsn, router_gst, router_warehouse, router_stock_status,
    router_delivery, router_return, router_warranty, router_seller, router_alt_sku,
    router_item,
]

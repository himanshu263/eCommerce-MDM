"""
Generic CRUD service + specialized Item Master service.
Pattern: get_all / get_by_id / create / update / delete
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import Any
import logging, uuid, datetime

logger = logging.getLogger(__name__)


# ── Generic CRUD factory ─────────────────────────────────────────────────────

def make_crud(Model, label: str):
    """Returns a module-like object with get_all/get_by_id/create/update/delete."""

    def get_all(db: Session, skip=0, limit=100, active_only=False):
        q = db.query(Model)
        if active_only:
            q = q.filter(Model.is_active == True)
        total = q.count()
        rows  = q.order_by(Model.id).offset(skip).limit(limit).all()
        return total, rows

    def get_by_id(db: Session, row_id: int):
        row = db.query(Model).filter(Model.id == row_id).first()
        if not row:
            raise HTTPException(status_code=404, detail=f"{label} {row_id} not found.")
        return row

    def create(db: Session, payload, username="system"):
        data = payload.model_dump()
        # strip list/relation fields if present
        for k in ["color_ids","size_ids","alt_sku_ids"]:
            data.pop(k, None)
        if hasattr(Model, "code") and "code" in data and data["code"]:
            data["code"] = data["code"].upper().strip()
        if hasattr(Model, "created_by"):
            data["created_by"] = username
        obj = Model(**data)
        try:
            db.add(obj); db.commit(); db.refresh(obj)
            return obj
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"{label} code/name already exists: {str(e.orig)[:120]}")

    def update(db: Session, row_id: int, payload, username="system"):
        obj = get_by_id(db, row_id)
        data = payload.model_dump(exclude_unset=True)
        for k in ["color_ids","size_ids","alt_sku_ids"]:
            data.pop(k, None)
        if "code" in data and data["code"]:
            data["code"] = data["code"].upper().strip()
        if hasattr(obj, "updated_by"):
            data["updated_by"] = username
        for k, v in data.items():
            setattr(obj, k, v)
        try:
            db.commit(); db.refresh(obj); return obj
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Update conflict: {str(e.orig)[:120]}")

    def delete(db: Session, row_id: int):
        obj = get_by_id(db, row_id)
        db.delete(obj); db.commit()
        return {"message": f"{label} deleted."}

    class CRUD:
        pass
    c = CRUD()
    c.get_all = get_all; c.get_by_id = get_by_id
    c.create = create; c.update = update; c.delete = delete
    return c


# ── Hierarchy services ───────────────────────────────────────────────────────

from app.models.catalog import (
    ProductGroup, SubGroup, Category, SubCategory,
    Brand, Manufacturer, Supplier, Size, Color,
    WeightUnit, UnitMaster, Material, Pattern, StyleMaster, ProductType,
    HSNCode, GSTRate, Warehouse, StockStatus, DeliveryType,
    ReturnPolicy, Warranty, Seller, AltSKU, Item
)

product_group_crud = make_crud(ProductGroup, "ProductGroup")
sub_group_crud     = make_crud(SubGroup,     "SubGroup")
category_crud      = make_crud(Category,     "Category")
sub_category_crud  = make_crud(SubCategory,  "SubCategory")
brand_crud         = make_crud(Brand,        "Brand")
manufacturer_crud  = make_crud(Manufacturer, "Manufacturer")
supplier_crud      = make_crud(Supplier,     "Supplier")
size_crud          = make_crud(Size,         "Size")
color_crud         = make_crud(Color,        "Color")
weight_unit_crud   = make_crud(WeightUnit,   "WeightUnit")
unit_crud          = make_crud(UnitMaster,   "Unit")
material_crud      = make_crud(Material,     "Material")
pattern_crud       = make_crud(Pattern,      "Pattern")
style_crud         = make_crud(StyleMaster,  "Style")
product_type_crud  = make_crud(ProductType,  "ProductType")
hsn_crud           = make_crud(HSNCode,      "HSNCode")
gst_crud           = make_crud(GSTRate,      "GSTRate")
warehouse_crud     = make_crud(Warehouse,    "Warehouse")
stock_status_crud  = make_crud(StockStatus,  "StockStatus")
delivery_type_crud = make_crud(DeliveryType, "DeliveryType")
return_policy_crud = make_crud(ReturnPolicy, "ReturnPolicy")
warranty_crud      = make_crud(Warranty,     "Warranty")
seller_crud        = make_crud(Seller,       "Seller")
alt_sku_crud       = make_crud(AltSKU,       "AltSKU")


# ── Hierarchy responses with joined parent names ──────────────────────────────

def get_all_sub_groups(db: Session, product_group_id=None, skip=0, limit=100):
    q = db.query(SubGroup).join(ProductGroup)
    if product_group_id:
        q = q.filter(SubGroup.product_group_id == product_group_id)
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    result = []
    for r in rows:
        d = {c.name: getattr(r, c.name) for c in r.__table__.columns}
        d["product_group_name"] = r.product_group.name if r.product_group else None
        result.append(d)
    return total, result

def get_all_categories(db: Session, sub_group_id=None, skip=0, limit=100):
    q = db.query(Category).join(SubGroup).join(ProductGroup)
    if sub_group_id:
        q = q.filter(Category.sub_group_id == sub_group_id)
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    result = []
    for r in rows:
        d = {c.name: getattr(r, c.name) for c in r.__table__.columns}
        d["sub_group_name"]      = r.sub_group.name if r.sub_group else None
        d["product_group_name"]  = r.sub_group.product_group.name if r.sub_group and r.sub_group.product_group else None
        result.append(d)
    return total, result

def get_all_sub_categories(db: Session, category_id=None, skip=0, limit=100):
    q = db.query(SubCategory).join(Category).join(SubGroup).join(ProductGroup)
    if category_id:
        q = q.filter(SubCategory.category_id == category_id)
    total = q.count()
    rows  = q.offset(skip).limit(limit).all()
    result = []
    for r in rows:
        d = {c.name: getattr(r, c.name) for c in r.__table__.columns}
        d["category_name"]       = r.category.name if r.category else None
        d["sub_group_name"]      = r.category.sub_group.name if r.category and r.category.sub_group else None
        d["product_group_name"]  = r.category.sub_group.product_group.name if r.category and r.category.sub_group and r.category.sub_group.product_group else None
        result.append(d)
    return total, result


# ── Auto SKU generator ────────────────────────────────────────────────────────

def generate_sku(db: Session, sub_category_code="GEN", brand_code="XX") -> str:
    prefix = f"{sub_category_code[:3].upper()}-{brand_code[:2].upper()}"
    while True:
        candidate = f"{prefix}-{str(uuid.uuid4())[:6].upper()}"
        if not db.query(Item).filter(Item.sku == candidate).first():
            return candidate


# ── Item Master service ───────────────────────────────────────────────────────

def _item_to_dict(item: Item) -> dict:
    d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    d["sub_category_name"]   = item.sub_category.name if item.sub_category else None
    d["product_type_name"]   = item.product_type.name  if item.product_type  else None
    d["brand_name"]          = item.brand.name          if item.brand          else None
    d["manufacturer_name"]   = item.manufacturer.name  if item.manufacturer   else None
    d["supplier_name"]       = item.supplier.name       if item.supplier       else None
    d["seller_name"]         = item.seller.name         if item.seller         else None
    d["material_name"]       = item.material.name       if item.material       else None
    d["pattern_name"]        = item.pattern.name        if item.pattern        else None
    d["style_name"]          = item.style.name          if item.style          else None
    d["unit_name"]           = item.unit.name           if item.unit           else None
    d["weight_unit_name"]    = item.weight_unit.name    if item.weight_unit    else None
    d["hsn_code"]            = item.hsn.hsn_code        if item.hsn            else None
    d["gst_rate_name"]       = item.gst_rate.name       if item.gst_rate       else None
    d["warehouse_name"]      = item.warehouse.name      if item.warehouse      else None
    d["stock_status_name"]   = item.stock_status.name   if item.stock_status   else None
    d["delivery_type_name"]  = item.delivery_type.name  if item.delivery_type  else None
    d["return_policy_name"]  = item.return_policy.name  if item.return_policy  else None
    d["warranty_name"]       = item.warranty.name        if item.warranty       else None
    d["colors"]   = [{"id": c.id, "name": c.name, "hex_code": c.hex_code} for c in item.colors]
    d["sizes"]    = [{"id": s.id, "name": s.name, "code": s.code} for s in item.sizes]
    d["alt_skus"] = [{"id": a.id, "sku_code": a.sku_code, "source": a.source} for a in item.alt_skus]
    return d


def get_all_items(db: Session, skip=0, limit=50, search=None, sub_category_id=None, brand_id=None, is_published=None):
    q = db.query(Item).options(
        joinedload(Item.sub_category), joinedload(Item.brand),
        joinedload(Item.supplier),     joinedload(Item.seller),
        joinedload(Item.stock_status), joinedload(Item.product_type),
        joinedload(Item.manufacturer), joinedload(Item.colors),
        joinedload(Item.sizes),        joinedload(Item.alt_skus),
        joinedload(Item.hsn),          joinedload(Item.gst_rate),
        joinedload(Item.warehouse),    joinedload(Item.delivery_type),
        joinedload(Item.return_policy),joinedload(Item.warranty),
        joinedload(Item.material),     joinedload(Item.pattern),
        joinedload(Item.style),        joinedload(Item.unit),
        joinedload(Item.weight_unit),
    )
    if search:
        q = q.filter(Item.item_name.ilike(f"%{search}%") | Item.sku.ilike(f"%{search}%"))
    if sub_category_id:
        q = q.filter(Item.sub_category_id == sub_category_id)
    if brand_id:
        q = q.filter(Item.brand_id == brand_id)
    if is_published is not None:
        q = q.filter(Item.is_published == is_published)
    total = q.count()
    rows  = q.order_by(Item.id.desc()).offset(skip).limit(limit).all()
    return total, [_item_to_dict(r) for r in rows]


def get_item_by_id(db: Session, item_id: int) -> dict:
    item = db.query(Item).options(
        joinedload(Item.sub_category), joinedload(Item.brand),
        joinedload(Item.supplier),     joinedload(Item.seller),
        joinedload(Item.stock_status), joinedload(Item.product_type),
        joinedload(Item.manufacturer), joinedload(Item.colors),
        joinedload(Item.sizes),        joinedload(Item.alt_skus),
        joinedload(Item.hsn),          joinedload(Item.gst_rate),
        joinedload(Item.warehouse),    joinedload(Item.delivery_type),
        joinedload(Item.return_policy),joinedload(Item.warranty),
        joinedload(Item.material),     joinedload(Item.pattern),
        joinedload(Item.style),        joinedload(Item.unit),
        joinedload(Item.weight_unit),
    ).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")
    return _item_to_dict(item)


def _resolve_m2m(db, ids, Model):
    if not ids:
        return []
    rows = db.query(Model).filter(Model.id.in_(ids)).all()
    return rows


def create_item(db: Session, payload, username="system") -> dict:
    data = payload.model_dump()
    color_ids   = data.pop("color_ids", []) or []
    size_ids    = data.pop("size_ids",  []) or []
    alt_sku_ids = data.pop("alt_sku_ids", []) or []

    # duplicate SKU check
    if db.query(Item).filter(Item.sku == data["sku"]).first():
        raise HTTPException(status_code=400, detail=f"SKU '{data['sku']}' already exists.")

    data["created_by"] = username
    item = Item(**data)
    item.colors   = _resolve_m2m(db, color_ids,   Color)
    item.sizes    = _resolve_m2m(db, size_ids,    Size)
    item.alt_skus = _resolve_m2m(db, alt_sku_ids, AltSKU)
    db.add(item); db.commit(); db.refresh(item)
    return get_item_by_id(db, item.id)


def update_item(db: Session, item_id: int, payload, username="system") -> dict:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    data = payload.model_dump(exclude_unset=True)
    color_ids   = data.pop("color_ids",   None)
    size_ids    = data.pop("size_ids",    None)
    alt_sku_ids = data.pop("alt_sku_ids", None)
    data["updated_by"] = username
    for k, v in data.items():
        setattr(item, k, v)
    if color_ids   is not None: item.colors   = _resolve_m2m(db, color_ids,   Color)
    if size_ids    is not None: item.sizes    = _resolve_m2m(db, size_ids,    Size)
    if alt_sku_ids is not None: item.alt_skus = _resolve_m2m(db, alt_sku_ids, AltSKU)
    try:
        db.commit(); db.refresh(item)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e.orig)[:120])
    return get_item_by_id(db, item.id)


def delete_item(db: Session, item_id: int):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item: raise HTTPException(status_code=404, detail="Item not found.")
    db.delete(item); db.commit()
    return {"message": "Item deleted."}

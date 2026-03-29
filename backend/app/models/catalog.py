"""
Phase 3 — eCommerce MDM Models
Hierarchy: ProductGroup → SubGroup → Category → SubCategory
Attribute Masters: Brand, Manufacturer, Supplier, Size, Color, Weight,
                   Unit, Material, Pattern, Style, ProductType
Advanced Masters:  SKU, HSN, GST, Pricing, Warehouse, StockStatus,
                   DeliveryType, ReturnPolicy, Warranty, Seller
Item Master:       Item (full Amazon-style product card)
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Numeric,
    ForeignKey, Table, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


# ── Many-to-many: Item ↔ Color / Size / Image ───────────────────────────────
item_colors = Table("item_colors", Base.metadata,
    Column("item_id",  Integer, ForeignKey("items.id",  ondelete="CASCADE"), primary_key=True),
    Column("color_id", Integer, ForeignKey("colors.id", ondelete="CASCADE"), primary_key=True),
)
item_sizes = Table("item_sizes", Base.metadata,
    Column("item_id", Integer, ForeignKey("items.id",  ondelete="CASCADE"), primary_key=True),
    Column("size_id", Integer, ForeignKey("sizes.id",  ondelete="CASCADE"), primary_key=True),
)
item_alt_skus = Table("item_alt_skus", Base.metadata,
    Column("item_id",  Integer, ForeignKey("items.id",      ondelete="CASCADE"), primary_key=True),
    Column("altsku_id",Integer, ForeignKey("alt_skus.id",   ondelete="CASCADE"), primary_key=True),
)


# ════════════════════════════════════════════════════════════════════════════
# 1. HIERARCHY MASTERS
# ════════════════════════════════════════════════════════════════════════════

class ProductGroup(Base):
    __tablename__ = "product_groups"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(120), nullable=False)
    code        = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True)
    sort_order  = Column(Integer, default=0)
    created_by  = Column(String(50), nullable=True)
    updated_by  = Column(String(50), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    sub_groups  = relationship("SubGroup", back_populates="product_group", cascade="all, delete-orphan")


class SubGroup(Base):
    __tablename__ = "sub_groups"
    id               = Column(Integer, primary_key=True, index=True)
    product_group_id = Column(Integer, ForeignKey("product_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    name             = Column(String(120), nullable=False)
    code             = Column(String(30), unique=True, nullable=False, index=True)
    description      = Column(Text, nullable=True)
    is_active        = Column(Boolean, default=True)
    sort_order       = Column(Integer, default=0)
    created_by       = Column(String(50), nullable=True)
    updated_by       = Column(String(50), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    product_group = relationship("ProductGroup", back_populates="sub_groups")
    categories    = relationship("Category", back_populates="sub_group", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    id           = Column(Integer, primary_key=True, index=True)
    sub_group_id = Column(Integer, ForeignKey("sub_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    name         = Column(String(120), nullable=False)
    code         = Column(String(30), unique=True, nullable=False, index=True)
    description  = Column(Text, nullable=True)
    is_active    = Column(Boolean, default=True)
    sort_order   = Column(Integer, default=0)
    created_by   = Column(String(50), nullable=True)
    updated_by   = Column(String(50), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    sub_group     = relationship("SubGroup", back_populates="categories")
    sub_categories = relationship("SubCategory", back_populates="category", cascade="all, delete-orphan")


class SubCategory(Base):
    __tablename__ = "sub_categories"
    id          = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(120), nullable=False)
    code        = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True)
    sort_order  = Column(Integer, default=0)
    created_by  = Column(String(50), nullable=True)
    updated_by  = Column(String(50), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("Category", back_populates="sub_categories")
    items    = relationship("Item", back_populates="sub_category")


# ════════════════════════════════════════════════════════════════════════════
# 2. ATTRIBUTE MASTERS  (all follow same slim pattern)
# ════════════════════════════════════════════════════════════════════════════

def _attr_cols():
    """Shared columns for every attribute master."""
    return [
        Column("id",         Integer, primary_key=True, index=True),
        Column("name",       String(120), nullable=False),
        Column("code",       String(40),  unique=True, nullable=False, index=True),
        Column("description",Text, nullable=True),
        Column("is_active",  Boolean, default=True),
        Column("created_by", String(50), nullable=True),
        Column("updated_by", String(50), nullable=True),
        Column("created_at", DateTime(timezone=True), server_default=func.now()),
        Column("updated_at", DateTime(timezone=True), onupdate=func.now()),
    ]


class Brand(Base):
    __tablename__ = "brands"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(120), nullable=False)
    code        = Column(String(40), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url    = Column(String(500), nullable=True)
    website     = Column(String(300), nullable=True)
    country     = Column(String(80), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_by  = Column(String(50), nullable=True)
    updated_by  = Column(String(50), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="brand")


class Manufacturer(Base):
    __tablename__ = "manufacturers"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(150), nullable=False)
    code        = Column(String(40), unique=True, nullable=False, index=True)
    address     = Column(Text, nullable=True)
    country     = Column(String(80), nullable=True)
    contact     = Column(String(120), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_by  = Column(String(50), nullable=True)
    updated_by  = Column(String(50), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="manufacturer")


class Supplier(Base):
    __tablename__ = "suppliers"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(150), nullable=False)
    code         = Column(String(40), unique=True, nullable=False, index=True)
    contact_name = Column(String(100), nullable=True)
    email        = Column(String(150), nullable=True)
    phone        = Column(String(30), nullable=True)
    address      = Column(Text, nullable=True)
    gst_number   = Column(String(20), nullable=True)
    is_active    = Column(Boolean, default=True)
    created_by   = Column(String(50), nullable=True)
    updated_by   = Column(String(50), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="supplier")


class Size(Base):
    __tablename__ = "sizes"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(60), nullable=False)
    code       = Column(String(20), unique=True, nullable=False, index=True)
    size_type  = Column(String(40), nullable=True)   # e.g. Apparel, Footwear, Electronics
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Color(Base):
    __tablename__ = "colors"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(60), nullable=False)
    code       = Column(String(20), unique=True, nullable=False, index=True)
    hex_code   = Column(String(10), nullable=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class WeightUnit(Base):
    __tablename__ = "weight_units"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(60), nullable=False)
    code       = Column(String(20), unique=True, nullable=False, index=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UnitMaster(Base):
    __tablename__ = "units"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(60), nullable=False)
    code       = Column(String(20), unique=True, nullable=False, index=True)
    unit_type  = Column(String(40), nullable=True)  # Volume, Length, Count, etc.
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Material(Base):
    __tablename__ = "materials"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    code       = Column(String(30), unique=True, nullable=False, index=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Pattern(Base):
    __tablename__ = "patterns"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    code       = Column(String(30), unique=True, nullable=False, index=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class StyleMaster(Base):
    __tablename__ = "styles"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    code       = Column(String(30), unique=True, nullable=False, index=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ProductType(Base):
    __tablename__ = "product_types"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    code       = Column(String(30), unique=True, nullable=False, index=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="product_type")


# ════════════════════════════════════════════════════════════════════════════
# 3. ADVANCED ECOMMERCE MASTERS
# ════════════════════════════════════════════════════════════════════════════

class HSNCode(Base):
    __tablename__ = "hsn_codes"
    id          = Column(Integer, primary_key=True, index=True)
    hsn_code    = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    gst_rate    = Column(Numeric(5, 2), nullable=True)  # default GST %
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="hsn")


class GSTRate(Base):
    __tablename__ = "gst_rates"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(60), nullable=False)   # e.g. "GST 18%"
    rate       = Column(Numeric(5, 2), nullable=False)
    cgst       = Column(Numeric(5, 2), nullable=True)
    sgst       = Column(Numeric(5, 2), nullable=True)
    igst       = Column(Numeric(5, 2), nullable=True)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="gst_rate")


class Warehouse(Base):
    __tablename__ = "warehouses"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(150), nullable=False)
    code         = Column(String(30), unique=True, nullable=False, index=True)
    address      = Column(Text, nullable=True)
    city         = Column(String(80), nullable=True)
    state        = Column(String(80), nullable=True)
    pincode      = Column(String(10), nullable=True)
    contact      = Column(String(100), nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="warehouse")


class StockStatus(Base):
    __tablename__ = "stock_statuses"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(60), nullable=False)  # In Stock, Out of Stock, Pre-order, Discontinued
    code       = Column(String(20), unique=True, nullable=False)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="stock_status")


class DeliveryType(Base):
    __tablename__ = "delivery_types"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(80), nullable=False)  # Standard, Express, Same Day, Free
    code        = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    charges     = Column(Numeric(10, 2), default=0)
    eta_days    = Column(Integer, nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="delivery_type")


class ReturnPolicy(Base):
    __tablename__ = "return_policies"
    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String(100), nullable=False)
    code             = Column(String(20), unique=True, nullable=False)
    return_days      = Column(Integer, default=0)
    policy_details   = Column(Text, nullable=True)
    is_returnable    = Column(Boolean, default=True)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="return_policy")


class Warranty(Base):
    __tablename__ = "warranties"
    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String(100), nullable=False)
    code             = Column(String(20), unique=True, nullable=False)
    duration_months  = Column(Integer, default=0)
    warranty_type    = Column(String(80), nullable=True)  # Manufacturer, Seller, Extended
    description      = Column(Text, nullable=True)
    is_active        = Column(Boolean, default=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="warranty")


class Seller(Base):
    __tablename__ = "sellers"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(150), nullable=False)
    code         = Column(String(40), unique=True, nullable=False, index=True)
    email        = Column(String(150), nullable=True)
    phone        = Column(String(30), nullable=True)
    gst_number   = Column(String(20), nullable=True)
    address      = Column(Text, nullable=True)
    rating       = Column(Numeric(3, 1), nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())
    items = relationship("Item", back_populates="seller")


# ════════════════════════════════════════════════════════════════════════════
# 4. ALTERNATE SKU MASTER
# ════════════════════════════════════════════════════════════════════════════

class AltSKU(Base):
    __tablename__ = "alt_skus"
    id         = Column(Integer, primary_key=True, index=True)
    sku_code   = Column(String(100), unique=True, nullable=False, index=True)
    sku_type   = Column(String(40), nullable=True)   # Marketplace, Internal, Barcode
    source     = Column(String(80), nullable=True)   # Amazon, Flipkart, etc.
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ════════════════════════════════════════════════════════════════════════════
# 5. ITEM MASTER  (Full Amazon-style product card)
# ════════════════════════════════════════════════════════════════════════════

class Item(Base):
    __tablename__ = "items"

    id               = Column(Integer, primary_key=True, index=True)

    # ── Identity ──────────────────────────────────────────────────────────
    sku              = Column(String(100), unique=True, nullable=False, index=True)
    item_name        = Column(String(300), nullable=False)
    short_name       = Column(String(150), nullable=True)
    description      = Column(Text, nullable=True)
    bullet_points    = Column(JSONB, nullable=True)  # list of up to 5 bullets
    search_keywords  = Column(Text, nullable=True)   # comma-separated keywords

    # ── Hierarchy ─────────────────────────────────────────────────────────
    sub_category_id  = Column(Integer, ForeignKey("sub_categories.id"), nullable=True)
    product_type_id  = Column(Integer, ForeignKey("product_types.id"),  nullable=True)

    # ── Attributes ────────────────────────────────────────────────────────
    brand_id         = Column(Integer, ForeignKey("brands.id"),         nullable=True)
    manufacturer_id  = Column(Integer, ForeignKey("manufacturers.id"),  nullable=True)
    supplier_id      = Column(Integer, ForeignKey("suppliers.id"),       nullable=True)
    seller_id        = Column(Integer, ForeignKey("sellers.id"),         nullable=True)
    material_id      = Column(Integer, ForeignKey("materials.id"),       nullable=True)
    pattern_id       = Column(Integer, ForeignKey("patterns.id"),        nullable=True)
    style_id         = Column(Integer, ForeignKey("styles.id"),          nullable=True)
    unit_id          = Column(Integer, ForeignKey("units.id"),           nullable=True)
    weight_unit_id   = Column(Integer, ForeignKey("weight_units.id"),    nullable=True)

    # ── Physical / Dimensions ─────────────────────────────────────────────
    weight           = Column(Numeric(10, 3), nullable=True)
    length_cm        = Column(Numeric(10, 2), nullable=True)
    width_cm         = Column(Numeric(10, 2), nullable=True)
    height_cm        = Column(Numeric(10, 2), nullable=True)
    package_weight   = Column(Numeric(10, 3), nullable=True)

    # ── Pricing ───────────────────────────────────────────────────────────
    mrp              = Column(Numeric(12, 2), nullable=True)
    selling_price    = Column(Numeric(12, 2), nullable=True)
    cost_price       = Column(Numeric(12, 2), nullable=True)
    discount_pct     = Column(Numeric(5, 2),  nullable=True)

    # ── Tax ───────────────────────────────────────────────────────────────
    hsn_id           = Column(Integer, ForeignKey("hsn_codes.id"),       nullable=True)
    gst_rate_id      = Column(Integer, ForeignKey("gst_rates.id"),        nullable=True)

    # ── Inventory ─────────────────────────────────────────────────────────
    warehouse_id     = Column(Integer, ForeignKey("warehouses.id"),       nullable=True)
    stock_status_id  = Column(Integer, ForeignKey("stock_statuses.id"),   nullable=True)
    stock_qty        = Column(Integer, default=0)
    min_order_qty    = Column(Integer, default=1)
    max_order_qty    = Column(Integer, nullable=True)

    # ── Logistics ─────────────────────────────────────────────────────────
    delivery_type_id = Column(Integer, ForeignKey("delivery_types.id"),  nullable=True)
    return_policy_id = Column(Integer, ForeignKey("return_policies.id"), nullable=True)
    warranty_id      = Column(Integer, ForeignKey("warranties.id"),      nullable=True)

    # ── Amazon/Marketplace Fields ─────────────────────────────────────────
    asin             = Column(String(20),  nullable=True, index=True)   # Amazon ASIN
    fnsku            = Column(String(20),  nullable=True)               # Fulfillment Network SKU
    model_number     = Column(String(100), nullable=True)
    part_number      = Column(String(100), nullable=True)
    country_of_origin= Column(String(80),  nullable=True)
    is_hazmat        = Column(Boolean, default=False)
    is_fragile       = Column(Boolean, default=False)
    is_fba_eligible  = Column(Boolean, default=True)                    # Fulfilled by Amazon flag
    age_restriction  = Column(String(30), nullable=True)
    battery_required = Column(Boolean, default=False)
    included_components = Column(JSONB, nullable=True)                  # list of what's in the box

    # ── Images ────────────────────────────────────────────────────────────
    primary_image    = Column(String(1000), nullable=True)
    image_urls       = Column(JSONB, nullable=True)                      # list of up to 9 image URLs

    # ── Status / Audit ────────────────────────────────────────────────────
    is_active        = Column(Boolean, default=True)
    is_published     = Column(Boolean, default=False)
    created_by       = Column(String(50), nullable=True)
    updated_by       = Column(String(50), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ─────────────────────────────────────────────────────
    sub_category  = relationship("SubCategory",  back_populates="items")
    product_type  = relationship("ProductType",  back_populates="items")
    brand         = relationship("Brand",         back_populates="items")
    manufacturer  = relationship("Manufacturer",  back_populates="items")
    supplier      = relationship("Supplier",      back_populates="items")
    seller        = relationship("Seller",        back_populates="items")
    hsn           = relationship("HSNCode",       back_populates="items")
    gst_rate      = relationship("GSTRate",       back_populates="items")
    warehouse     = relationship("Warehouse",     back_populates="items")
    stock_status  = relationship("StockStatus",   back_populates="items")
    delivery_type = relationship("DeliveryType",  back_populates="items")
    return_policy = relationship("ReturnPolicy",  back_populates="items")
    warranty      = relationship("Warranty",      back_populates="items")
    material      = relationship("Material")
    pattern       = relationship("Pattern")
    style         = relationship("StyleMaster")
    unit          = relationship("UnitMaster")
    weight_unit   = relationship("WeightUnit")

    colors    = relationship("Color",   secondary=item_colors)
    sizes     = relationship("Size",    secondary=item_sizes)
    alt_skus  = relationship("AltSKU",  secondary=item_alt_skus)

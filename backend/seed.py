"""
Seed Script — Phase 3
Creates default admin group/user + sample MDM master data.
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import *
from app.core.security import hash_password
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # ── Admin group + user ────────────────────────────────────────────
        admin_group = db.query(Group).filter(Group.group_code == "ADMIN").first()
        if not admin_group:
            admin_group = Group(group_name="Administrators", group_code="ADMIN", is_active=True,
                permissions={"can_view":True,"can_create":True,"can_edit":True,"can_delete":True,"can_export":True})
            db.add(admin_group); db.commit(); db.refresh(admin_group)
            logger.info("✅ Admin group created")

        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", email="admin@myapp.com",
                hashed_password=hash_password("Admin@123"), full_name="System Administrator",
                group_id=admin_group.id, is_active=True))
            db.commit(); logger.info("✅ Admin user created — admin / Admin@123")

        # ── Product Hierarchy ─────────────────────────────────────────────
        def get_or_create(Model, filter_kwargs, create_kwargs):
            obj = db.query(Model).filter_by(**filter_kwargs).first()
            if not obj:
                obj = Model(**{**filter_kwargs, **create_kwargs}); db.add(obj); db.commit(); db.refresh(obj)
            return obj

        elec = get_or_create(ProductGroup, {"code":"ELEC"}, {"name":"Electronics","is_active":True})
        fash = get_or_create(ProductGroup, {"code":"FASH"}, {"name":"Fashion","is_active":True})
        groc = get_or_create(ProductGroup, {"code":"GROC"}, {"name":"Grocery","is_active":True})
        logger.info("✅ Product groups seeded")

        mobiles = get_or_create(SubGroup, {"code":"MOBI"}, {"name":"Mobiles","product_group_id":elec.id,"is_active":True})
        laptops = get_or_create(SubGroup, {"code":"LAPT"}, {"name":"Laptops & Computers","product_group_id":elec.id,"is_active":True})
        men     = get_or_create(SubGroup, {"code":"MENW"}, {"name":"Men's Wear","product_group_id":fash.id,"is_active":True})
        logger.info("✅ Sub groups seeded")

        smartphones = get_or_create(Category, {"code":"SMPH"}, {"name":"Smartphones","sub_group_id":mobiles.id,"is_active":True})
        tablets     = get_or_create(Category, {"code":"TABL"}, {"name":"Tablets","sub_group_id":mobiles.id,"is_active":True})
        shirts      = get_or_create(Category, {"code":"SHRT"}, {"name":"Shirts","sub_group_id":men.id,"is_active":True})
        logger.info("✅ Categories seeded")

        android = get_or_create(SubCategory, {"code":"ANDR"}, {"name":"Android Phones","category_id":smartphones.id,"is_active":True})
        apple   = get_or_create(SubCategory, {"code":"IOSP"}, {"name":"iPhones","category_id":smartphones.id,"is_active":True})
        casual  = get_or_create(SubCategory, {"code":"CSSH"}, {"name":"Casual Shirts","category_id":shirts.id,"is_active":True})
        logger.info("✅ Sub categories seeded")

        # ── Attribute Masters ─────────────────────────────────────────────
        samsung = get_or_create(Brand, {"code":"SAMS"}, {"name":"Samsung","country":"South Korea","website":"https://samsung.com","is_active":True})
        apple_b = get_or_create(Brand, {"code":"APPL"}, {"name":"Apple","country":"USA","website":"https://apple.com","is_active":True})
        get_or_create(Brand, {"code":"ONEPL"}, {"name":"OnePlus","country":"China","is_active":True})
        logger.info("✅ Brands seeded")

        for c in [("BLACK","Black","#000000"),("WHITE","White","#FFFFFF"),("RED","Red","#FF0000"),("BLUE","Blue","#0000FF"),("GREEN","Green","#008000")]:
            get_or_create(Color, {"code":c[0]}, {"name":c[1],"hex_code":c[2],"is_active":True})

        for s in [("XS","XS","Apparel"),("S","S","Apparel"),("M","M","Apparel"),("L","L","Apparel"),("XL","XL","Apparel"),("128GB","128 GB","Storage"),("256GB","256 GB","Storage")]:
            get_or_create(Size, {"code":s[0]}, {"name":s[1],"size_type":s[2],"is_active":True})

        logger.info("✅ Colors & Sizes seeded")

        for u in [("KG","Kilogram","Weight"),("G","Gram","Weight"),("L","Litre","Volume"),("ML","Millilitre","Volume"),("PCS","Pieces","Count")]:
            get_or_create(UnitMaster, {"code":u[0]}, {"name":u[1],"unit_type":u[2],"is_active":True})

        get_or_create(WeightUnit, {"code":"KG"}, {"name":"Kilogram","is_active":True})
        get_or_create(WeightUnit, {"code":"G"},  {"name":"Gram","is_active":True})

        # ── Commerce Masters ──────────────────────────────────────────────
        gst18 = get_or_create(GSTRate, {"name":"GST 18%"}, {"rate":18,"cgst":9,"sgst":9,"igst":18,"is_active":True})
        gst5  = get_or_create(GSTRate, {"name":"GST 5%"},  {"rate":5, "cgst":2.5,"sgst":2.5,"igst":5,"is_active":True})

        get_or_create(HSNCode, {"hsn_code":"8517"}, {"description":"Smartphones & Mobile Phones","gst_rate":18,"is_active":True})
        get_or_create(HSNCode, {"hsn_code":"6205"}, {"description":"Men's Shirts","gst_rate":5,"is_active":True})

        get_or_create(Warehouse, {"code":"DEL01"}, {"name":"Delhi Main Warehouse","city":"Delhi","state":"Delhi","pincode":"110001","is_active":True})
        get_or_create(Warehouse, {"code":"MUM01"}, {"name":"Mumbai Hub","city":"Mumbai","state":"Maharashtra","pincode":"400001","is_active":True})

        for ss in [("IN_STOCK","In Stock"),("OUT_STOCK","Out of Stock"),("PRE_ORDER","Pre-Order"),("DISCONT","Discontinued")]:
            get_or_create(StockStatus, {"code":ss[0]}, {"name":ss[1],"is_active":True})

        get_or_create(DeliveryType, {"code":"STD"}, {"name":"Standard Delivery","charges":0,"eta_days":5,"is_active":True})
        get_or_create(DeliveryType, {"code":"EXP"}, {"name":"Express Delivery","charges":99,"eta_days":2,"is_active":True})
        get_or_create(DeliveryType, {"code":"SAME"}, {"name":"Same Day Delivery","charges":149,"eta_days":0,"is_active":True})

        get_or_create(ReturnPolicy, {"code":"RET7"},  {"name":"7 Day Returns","return_days":7, "is_returnable":True,"is_active":True})
        get_or_create(ReturnPolicy, {"code":"RET30"}, {"name":"30 Day Returns","return_days":30,"is_returnable":True,"is_active":True})
        get_or_create(ReturnPolicy, {"code":"NRET"},  {"name":"No Returns","return_days":0,"is_returnable":False,"is_active":True})

        get_or_create(Warranty, {"code":"W1Y"}, {"name":"1 Year Warranty","duration_months":12,"warranty_type":"Manufacturer","is_active":True})
        get_or_create(Warranty, {"code":"W2Y"}, {"name":"2 Year Warranty","duration_months":24,"warranty_type":"Manufacturer","is_active":True})
        get_or_create(Warranty, {"code":"W6M"}, {"name":"6 Month Warranty","duration_months":6,"warranty_type":"Seller","is_active":True})

        get_or_create(Supplier, {"code":"SUP001"}, {"name":"Tech Imports Pvt Ltd","email":"tech@imports.com","gst_number":"27AABCU9603R1ZM","is_active":True})
        get_or_create(Seller,   {"code":"SEL001"}, {"name":"CloudBuy Marketplace","email":"seller@cloudbuy.com","rating":4.5,"is_active":True})

        for m in [("COTT","Cotton"),("POLY","Polyester"),("SILK","Silk"),("WOOL","Wool")]:
            get_or_create(Material, {"code":m[0]}, {"name":m[1],"is_active":True})

        get_or_create(ProductType, {"code":"PHYS"}, {"name":"Physical Product","is_active":True})
        get_or_create(ProductType, {"code":"DIGI"}, {"name":"Digital Product","is_active":True})
        get_or_create(ProductType, {"code":"BUND"}, {"name":"Bundle","is_active":True})

        db.commit()
        logger.info("✅ All MDM master data seeded successfully!")
        logger.info("\n🎉 Phase 3 Ready! Login: admin / Admin@123")

    except Exception as e:
        db.rollback(); logger.error(f"❌ Seed failed: {e}"); raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()

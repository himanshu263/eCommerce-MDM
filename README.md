# MyApp — Phase 3: eCommerce MDM + Item Master

> FastAPI + PostgreSQL backend | React + Tailwind CSS frontend

---

## 📁 Project Structure

```
project/
├── backend/
│   └── app/
│       ├── models/    → group.py, user.py, catalog.py (25+ models)
│       ├── schemas/   → user.py, group.py, catalog.py
│       ├── routers/   → auth.py, groups.py, users.py, catalog.py
│       ├── services/  → auth.py, group.py, user.py, catalog.py
│       ├── core/      → config.py, security.py
│       ├── database.py
│       └── main.py
│
└── frontend/src/
    ├── pages/
    │   ├── mdm/       → HierarchyMaster.jsx, SimpleMaster.jsx
    │   └── catalog/   → ItemMaster.jsx
    ├── components/    → Layout.jsx, MasterTable.jsx, ProtectedRoute.jsx
    ├── services/      → api.js (all 25+ API endpoints)
    └── App.jsx        → all routes wired
```

---

## ⚙️ Setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set your DATABASE_URL
python seed.py         # seeds all MDM sample data
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

**Login:** `admin` / `Admin@123`  |  **API Docs:** http://localhost:8000/docs

---

## 🌐 API Endpoints (50+)

### Auth
| POST /api/auth/login | GET /api/auth/me | POST /api/auth/logout |

### Hierarchy MDM
| `/api/mdm/product-groups` | `/api/mdm/sub-groups` | `/api/mdm/categories` | `/api/mdm/sub-categories` |

### Attribute MDM
| `/api/mdm/brands` | `/api/mdm/manufacturers` | `/api/mdm/suppliers` | `/api/mdm/sellers` |
| `/api/mdm/colors` | `/api/mdm/sizes` | `/api/mdm/materials` | `/api/mdm/patterns` | `/api/mdm/styles` |
| `/api/mdm/units` | `/api/mdm/weight-units` | `/api/mdm/product-types` |

### Commerce MDM
| `/api/mdm/hsn` | `/api/mdm/gst-rates` | `/api/mdm/warehouses` |
| `/api/mdm/stock-statuses` | `/api/mdm/delivery-types` | `/api/mdm/return-policies` |
| `/api/mdm/warranties` | `/api/mdm/alt-skus` |

### Item Master
| GET/POST `/api/items/` | GET/PUT/DELETE `/api/items/{id}` |
| GET `/api/items/generate-sku` | POST `/api/items/bulk-upload` |

### Utilities
| POST `/api/upload/image` |

---

## 🗄️ Database Tables (25+)

**Hierarchy:** product_groups → sub_groups → categories → sub_categories

**Attributes:** brands, manufacturers, suppliers, sellers, colors, sizes,
               weight_units, units, materials, patterns, styles, product_types

**Commerce:** hsn_codes, gst_rates, warehouses, stock_statuses,
              delivery_types, return_policies, warranties, alt_skus

**Catalog:** items (50+ columns), item_colors (M2M), item_sizes (M2M), item_alt_skus (M2M)

---

## 📦 Item Master — Amazon-Style Fields

| Section | Fields |
|---------|--------|
| Identity | SKU (auto-gen), Item Name, Short Name, Description, Bullet Points (5), Keywords |
| Hierarchy | Group → SubGroup → Category → SubCategory (dependent dropdowns) |
| Attributes | Brand, Manufacturer, Supplier, Seller, Material, Pattern, Style, Unit, Country |
| Variants | Colors (M2M), Sizes (M2M) — multi-select chips |
| Physical | Weight, L×W×H (cm), Package Weight |
| Pricing | MRP, Selling Price, Cost Price, Discount % (live % calculator) |
| Tax | HSN Code, GST Rate |
| Inventory | Warehouse, Stock Status, Stock Qty, Min/Max Order Qty |
| Logistics | Delivery Type, Return Policy, Warranty |
| Marketplace | ASIN, FNSKU, Model No., Part No., is_hazmat, is_fragile, is_fba_eligible, Battery Required, Included Components |
| Images | Primary image (upload + URL), Up to 8 additional images |
| Alt SKUs | Link alternate SKU codes (Amazon ASIN, Flipkart, Barcode) |

---

## 🚀 Phase Roadmap

| Phase | Features | Status |
|-------|----------|--------|
| 1 | Login + Group Master | ✅ |
| 2 | User Master | ✅ |
| 3 | MDM + Item Master | ✅ |
| 4 | Reports & Audit Logs | 🔜 |
# eCommerce-MDM

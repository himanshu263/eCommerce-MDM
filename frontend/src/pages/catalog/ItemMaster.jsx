/**
 * Full Amazon-style Item Master
 * Sections: Identity | Hierarchy | Attributes | Variants | Physical | Pricing | Tax | Inventory | Logistics | Marketplace | Images
 */
import { useState, useEffect, useRef } from "react";
import {
  itemAPI, productGroupAPI, subGroupAPI, categoryAPI, subCategoryAPI,
  brandAPI, manufacturerAPI, supplierAPI, sellerAPI,
  materialAPI, patternAPI, styleAPI, unitAPI, weightUnitAPI, productTypeAPI,
  sizeAPI, colorAPI, hsnAPI, gstAPI, warehouseAPI, stockStatusAPI,
  deliveryTypeAPI, returnPolicyAPI, warrantyAPI, altSkuAPI, uploadImage
} from "../../services/api";
import { Toast, ConfirmDialog, StatusBadge, Spinner } from "../../components/MasterTable";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EMPTY = {
  sku:"", item_name:"", short_name:"", description:"", bullet_points:["","","","",""],
  search_keywords:"", sub_category_id:"", product_type_id:"", brand_id:"", manufacturer_id:"",
  supplier_id:"", seller_id:"", material_id:"", pattern_id:"", style_id:"", unit_id:"",
  weight_unit_id:"", color_ids:[], size_ids:[], weight:"", length_cm:"", width_cm:"",
  height_cm:"", package_weight:"", mrp:"", selling_price:"", cost_price:"", discount_pct:"",
  hsn_id:"", gst_rate_id:"", warehouse_id:"", stock_status_id:"", stock_qty:0,
  min_order_qty:1, max_order_qty:"", delivery_type_id:"", return_policy_id:"", warranty_id:"",
  asin:"", fnsku:"", model_number:"", part_number:"", country_of_origin:"", is_hazmat:false,
  is_fragile:false, is_fba_eligible:true, age_restriction:"", battery_required:false,
  included_components:[""], primary_image:"", image_urls:[], alt_sku_ids:[],
  is_active:true, is_published:false,
};

const SECTIONS = ["Identity","Hierarchy","Attributes","Variants","Physical","Pricing","Tax","Inventory","Logistics","Marketplace","Images","Alt SKUs"];

function SectionTab({ sections, active, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap mb-6 bg-gray-100 p-1 rounded-xl">
      {sections.map((s, i) => (
        <button key={s} onClick={() => onChange(i)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active === i ? "bg-white text-indigo-700 shadow" : "text-gray-500 hover:text-gray-800"}`}>
          {s}
        </button>
      ))}
    </div>
  );
}

function SL({ label, children, required, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
function SI({ value, onChange, placeholder, type="text", error, className="" }) {
  return <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder}
    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error?"border-red-400 bg-red-50":"border-gray-300"} ${className}`}/>;
}
function SS({ value, onChange, children, error }) {
  return <select value={value ?? ""} onChange={onChange}
    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error?"border-red-400 bg-red-50":"border-gray-300"}`}>
    {children}
  </select>;
}

export default function ItemMaster() {
  const [items, setItems]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [view, setView]         = useState("list"); // list | form
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [toast, setToast]       = useState(null);
  const [confirm, setConfirm]   = useState(null);
  const [section, setSection]   = useState(0);
  const [search, setSearch]     = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const fileRef = useRef();

  // Lookup data
  const [groups, setGroups] = useState([]);
  const [subGroups, setSubGroups] = useState([]);
  const [cats, setCats]     = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [manuf, setManuf]   = useState([]);
  const [supps, setSupps]   = useState([]);
  const [sellers, setSellers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [patterns, setPatterns]   = useState([]);
  const [styles, setStyles]       = useState([]);
  const [units, setUnits]         = useState([]);
  const [wunits, setWunits]       = useState([]);
  const [ptypes, setPtypes]       = useState([]);
  const [sizes, setSizes]         = useState([]);
  const [colors, setColors]       = useState([]);
  const [hsns, setHsns]           = useState([]);
  const [gsts, setGsts]           = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockSts, setStockSts]   = useState([]);
  const [dlvTypes, setDlvTypes]   = useState([]);
  const [retPols, setRetPols]     = useState([]);
  const [warrs, setWarrs]         = useState([]);
  const [altSkus, setAltSkus]     = useState([]);

  // dependent dropdowns
  const [dgroupId, setDgroupId] = useState("");
  const [dsubId,   setDsubId]   = useState("");
  const [dcatId,   setDcatId]   = useState("");

  useEffect(() => { loadItems(); loadLookups(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try { const { data } = await itemAPI.getAll({ limit: 100 }); setItems(data.items); setTotal(data.total); }
    catch { showToast("Failed to load items.", "error"); }
    finally { setLoading(false); }
  };

  const loadLookups = async () => {
    const all = await Promise.allSettled([
      productGroupAPI.getAll(), subGroupAPI.getAll(), categoryAPI.getAll(), subCategoryAPI.getAll(),
      brandAPI.getAll(), manufacturerAPI.getAll(), supplierAPI.getAll(), sellerAPI.getAll(),
      materialAPI.getAll(), patternAPI.getAll(), styleAPI.getAll(), unitAPI.getAll(), weightUnitAPI.getAll(),
      productTypeAPI.getAll(), sizeAPI.getAll(), colorAPI.getAll(), hsnAPI.getAll(), gstAPI.getAll(),
      warehouseAPI.getAll(), stockStatusAPI.getAll(), deliveryTypeAPI.getAll(), returnPolicyAPI.getAll(),
      warrantyAPI.getAll(), altSkuAPI.getAll(),
    ]);
    const g = v => v.status === "fulfilled" ? (v.value.data.items || []) : [];
    setGroups(g(all[0])); setSubGroups(g(all[1])); setCats(g(all[2])); setSubCats(g(all[3]));
    setBrands(g(all[4])); setManuf(g(all[5])); setSupps(g(all[6])); setSellers(g(all[7]));
    setMaterials(g(all[8])); setPatterns(g(all[9])); setStyles(g(all[10])); setUnits(g(all[11])); setWunits(g(all[12]));
    setPtypes(g(all[13])); setSizes(g(all[14])); setColors(g(all[15])); setHsns(g(all[16])); setGsts(g(all[17]));
    setWarehouses(g(all[18])); setStockSts(g(all[19])); setDlvTypes(g(all[20])); setRetPols(g(all[21]));
    setWarrs(g(all[22])); setAltSkus(g(all[23]));
  };

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(() => setToast(null),3500); };

  const genSKU = async () => {
    try {
      const sc = subCats.find(s => String(s.id) === String(form.sub_category_id));
      const br = brands.find(b => String(b.id) === String(form.brand_id));
      const { data } = await itemAPI.generateSKU({ sub_category_code: sc?.code || "GEN", brand_code: br?.code || "XX" });
      setF("sku", data.sku);
    } catch { showToast("SKU generation failed.", "error"); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImgUploading(true);
    try {
      const { data } = await uploadImage(file);
      const url = `${API_BASE}${data.url}`;
      setF("primary_image", url);
      setF("image_urls", [...(form.image_urls || []), url]);
      showToast("Image uploaded!");
    } catch { showToast("Image upload failed.", "error"); }
    finally { setImgUploading(false); }
  };

  const handleAdditionalImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImgUploading(true);
    try {
      const { data } = await uploadImage(file);
      const url = `${API_BASE}${data.url}`;
      setF("image_urls", [...(form.image_urls || []), url]);
      showToast("Image added!");
    } catch { showToast("Image upload failed.", "error"); }
    finally { setImgUploading(false); }
  };

  const openCreate = () => {
    setForm(EMPTY); setErrors({}); setEditId(null);
    setDgroupId(""); setDsubId(""); setDcatId(""); setSection(0); setView("form");
  };

  const openEdit = (item) => {
    const f = { ...EMPTY, ...item };
    f.bullet_points = Array.isArray(item.bullet_points) && item.bullet_points.length ? item.bullet_points : ["","","","",""];
    f.included_components = Array.isArray(item.included_components) && item.included_components.length ? item.included_components : [""];
    f.image_urls = item.image_urls || [];
    f.color_ids = (item.colors || []).map(c => c.id);
    f.size_ids  = (item.sizes  || []).map(s => s.id);
    f.alt_sku_ids = (item.alt_skus || []).map(a => a.id);
    Object.keys(f).forEach(k => { if (f[k] === null) f[k] = ""; });
    setForm(f); setErrors({}); setEditId(item.id); setSection(0); setView("form");
  };

  const validate = () => {
    const e = {};
    if (!form.sku?.trim())       e.sku       = "SKU is required.";
    if (!form.item_name?.trim()) e.item_name  = "Item Name is required.";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const p = { ...form };
    ["weight","length_cm","width_cm","height_cm","package_weight","mrp","selling_price","cost_price","discount_pct","stock_qty","min_order_qty","max_order_qty"].forEach(k => {
      p[k] = p[k] === "" ? null : Number(p[k]);
    });
    ["sub_category_id","product_type_id","brand_id","manufacturer_id","supplier_id","seller_id",
     "material_id","pattern_id","style_id","unit_id","weight_unit_id","hsn_id","gst_rate_id",
     "warehouse_id","stock_status_id","delivery_type_id","return_policy_id","warranty_id"].forEach(k => {
      p[k] = p[k] === "" ? null : p[k] ? Number(p[k]) : null;
    });
    p.bullet_points = (p.bullet_points || []).filter(Boolean);
    p.included_components = (p.included_components || []).filter(Boolean);
    p.image_urls = (p.image_urls || []).filter(Boolean);
    return p;
  };

  const handleSubmit = async () => {
    if (!validate()) { showToast("Please fix validation errors.", "error"); setSection(0); return; }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editId) { await itemAPI.update(editId, payload); showToast("Item updated!"); }
      else        { await itemAPI.create(payload);          showToast("Item created!"); }
      setView("list"); loadItems();
    } catch (err) { showToast(err.response?.data?.detail || "Save failed.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await itemAPI.delete(confirm.id); showToast("Item deleted!"); setConfirm(null); loadItems(); }
    catch (err) { showToast(err.response?.data?.detail || "Delete failed.", "error"); }
    finally { setDeleting(false); }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMulti = (arr, id) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const filtSub  = subGroups.filter(s => !dgroupId || String(s.product_group_id) === dgroupId);
  const filtCat  = cats.filter(c => !dsubId   || String(c.sub_group_id)     === dsubId);
  const filtScat = subCats.filter(s => !dcatId   || String(s.category_id)    === dcatId);

  const filtered = items.filter(i =>
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Toast toast={toast}/>

        {/* Form header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView("list")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{editId ? "Edit Item" : "Create New Item"}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Amazon-style full product card</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setView("list")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
              {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {saving ? "Saving..." : editId ? "Update Item" : "Create Item"}
            </button>
          </div>
        </div>

        <SectionTab sections={SECTIONS} active={section} onChange={setSection}/>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* 0 — Identity */}
          {section === 0 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <SL label="SKU" required error={errors.sku}>
                    <div className="flex gap-2">
                      <SI value={form.sku} onChange={e => setF("sku", e.target.value.toUpperCase())} placeholder="AUTO-GEN or type manually" error={errors.sku} className="font-mono"/>
                      <button type="button" onClick={genSKU} className="px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 whitespace-nowrap">Auto SKU</button>
                    </div>
                  </SL>
                </div>
                <div className="w-40">
                  <SL label="Model No."><SI value={form.model_number} onChange={e => setF("model_number", e.target.value)} placeholder="e.g. SM-G990"/></SL>
                </div>
              </div>
              <SL label="Item Name" required error={errors.item_name}>
                <SI value={form.item_name} onChange={e => setF("item_name", e.target.value)} placeholder="Full product name as shown on marketplace" error={errors.item_name}/>
              </SL>
              <SL label="Short Name"><SI value={form.short_name} onChange={e => setF("short_name", e.target.value)} placeholder="Short / display name"/></SL>
              <SL label="Description">
                <textarea value={form.description ?? ""} onChange={e => setF("description", e.target.value)} rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Detailed product description..."/>
              </SL>
              <SL label="Bullet Points (up to 5)">
                <div className="space-y-2">
                  {(form.bullet_points || ["","","","",""]).map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs w-4">•</span>
                      <SI value={b} onChange={e => { const arr = [...(form.bullet_points||[])]; arr[i]=e.target.value; setF("bullet_points",arr); }} placeholder={`Bullet point ${i+1}`}/>
                    </div>
                  ))}
                </div>
              </SL>
              <SL label="Search Keywords">
                <SI value={form.search_keywords} onChange={e => setF("search_keywords", e.target.value)} placeholder="smartphone, android, samsung, mobile (comma-separated)"/>
              </SL>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_active} onChange={e => setF("is_active", e.target.checked)} className="w-4 h-4 accent-indigo-600"/>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!form.is_published} onChange={e => setF("is_published", e.target.checked)} className="w-4 h-4 accent-green-600"/>
                  <span className="text-sm font-medium text-gray-700">Published</span>
                </label>
              </div>
            </div>
          )}

          {/* 1 — Hierarchy */}
          {section === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">Use the dropdowns below to drill down through the hierarchy. Each selection filters the next level.</p>
              <div className="grid grid-cols-2 gap-4">
                <SL label="Product Group">
                  <SS value={dgroupId} onChange={e => { setDgroupId(e.target.value); setDsubId(""); setDcatId(""); setF("sub_category_id",""); }}>
                    <option value="">— All Groups —</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </SS>
                </SL>
                <SL label="Sub Group">
                  <SS value={dsubId} onChange={e => { setDsubId(e.target.value); setDcatId(""); setF("sub_category_id",""); }}>
                    <option value="">— Select Sub Group —</option>
                    {filtSub.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </SS>
                </SL>
                <SL label="Category">
                  <SS value={dcatId} onChange={e => { setDcatId(e.target.value); setF("sub_category_id",""); }}>
                    <option value="">— Select Category —</option>
                    {filtCat.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </SS>
                </SL>
                <SL label="Sub Category">
                  <SS value={form.sub_category_id ?? ""} onChange={e => setF("sub_category_id", e.target.value)}>
                    <option value="">— Select Sub Category —</option>
                    {filtScat.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </SS>
                </SL>
                <SL label="Product Type">
                  <SS value={form.product_type_id ?? ""} onChange={e => setF("product_type_id", e.target.value)}>
                    <option value="">— Select —</option>
                    {ptypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </SS>
                </SL>
              </div>
            </div>
          )}

          {/* 2 — Attributes */}
          {section === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Brand",        "brand_id",        brands],
                ["Manufacturer", "manufacturer_id",  manuf],
                ["Supplier",     "supplier_id",      supps],
                ["Seller",       "seller_id",        sellers],
                ["Material",     "material_id",      materials],
                ["Pattern",      "pattern_id",       patterns],
                ["Style",        "style_id",         styles],
                ["Unit",         "unit_id",          units],
                ["Weight Unit",  "weight_unit_id",   wunits],
              ].map(([label, key, opts]) => (
                <SL key={key} label={label}>
                  <SS value={form[key] ?? ""} onChange={e => setF(key, e.target.value)}>
                    <option value="">— Select —</option>
                    {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </SS>
                </SL>
              ))}
              <SL label="Part Number"><SI value={form.part_number} onChange={e => setF("part_number", e.target.value)} placeholder="e.g. SM-A325F/DS"/></SL>
              <SL label="Country of Origin"><SI value={form.country_of_origin} onChange={e => setF("country_of_origin", e.target.value)} placeholder="e.g. India"/></SL>
            </div>
          )}

          {/* 3 — Variants (Colors + Sizes) */}
          {section === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Colors</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button key={c.id} type="button" onClick={() => setF("color_ids", toggleMulti(form.color_ids||[], c.id))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${(form.color_ids||[]).includes(c.id) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-300"}`}>
                      {c.name}
                    </button>
                  ))}
                  {colors.length === 0 && <p className="text-xs text-gray-400">No colors defined. Add colors in MDM → Colors.</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(s => (
                    <button key={s.id} type="button" onClick={() => setF("size_ids", toggleMulti(form.size_ids||[], s.id))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${(form.size_ids||[]).includes(s.id) ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-300 hover:border-violet-300"}`}>
                      {s.name} ({s.code})
                    </button>
                  ))}
                  {sizes.length === 0 && <p className="text-xs text-gray-400">No sizes defined. Add sizes in MDM → Sizes.</p>}
                </div>
              </div>
            </div>
          )}

          {/* 4 — Physical */}
          {section === 4 && (
            <div className="grid grid-cols-3 gap-4">
              {[["Weight", "weight", "kg/g"],["Length (cm)","length_cm","cm"],["Width (cm)","width_cm","cm"],["Height (cm)","height_cm","cm"],["Package Weight","package_weight","kg"]].map(([l,k,u]) => (
                <SL key={k} label={`${l} (${u})`}><SI value={form[k]} onChange={e => setF(k, e.target.value)} type="number" placeholder="0"/></SL>
              ))}
            </div>
          )}

          {/* 5 — Pricing */}
          {section === 5 && (
            <div className="grid grid-cols-2 gap-4">
              {[["MRP (₹)","mrp"],["Selling Price (₹)","selling_price"],["Cost Price (₹)","cost_price"],["Discount %","discount_pct"]].map(([l,k]) => (
                <SL key={k} label={l}><SI value={form[k]} onChange={e => setF(k,e.target.value)} type="number" placeholder="0.00"/></SL>
              ))}
              {form.mrp && form.selling_price && (
                <div className="col-span-2 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-green-700 font-semibold">
                    Effective Discount: {(((form.mrp - form.selling_price) / form.mrp) * 100).toFixed(1)}% off MRP
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 6 — Tax */}
          {section === 6 && (
            <div className="grid grid-cols-2 gap-4">
              <SL label="HSN Code">
                <SS value={form.hsn_id ?? ""} onChange={e => setF("hsn_id", e.target.value)}>
                  <option value="">— Select HSN —</option>
                  {hsns.map(h => <option key={h.id} value={h.id}>{h.hsn_code} {h.description ? `— ${h.description.slice(0,40)}` : ""}</option>)}
                </SS>
              </SL>
              <SL label="GST Rate">
                <SS value={form.gst_rate_id ?? ""} onChange={e => setF("gst_rate_id", e.target.value)}>
                  <option value="">— Select GST —</option>
                  {gsts.map(g => <option key={g.id} value={g.id}>{g.name} ({g.rate}%)</option>)}
                </SS>
              </SL>
            </div>
          )}

          {/* 7 — Inventory */}
          {section === 7 && (
            <div className="grid grid-cols-2 gap-4">
              <SL label="Warehouse">
                <SS value={form.warehouse_id ?? ""} onChange={e => setF("warehouse_id", e.target.value)}>
                  <option value="">— Select —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                </SS>
              </SL>
              <SL label="Stock Status">
                <SS value={form.stock_status_id ?? ""} onChange={e => setF("stock_status_id", e.target.value)}>
                  <option value="">— Select —</option>
                  {stockSts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </SS>
              </SL>
              {[["Stock Qty","stock_qty",0],["Min Order Qty","min_order_qty",1],["Max Order Qty","max_order_qty",""]].map(([l,k,d]) => (
                <SL key={k} label={l}><SI value={form[k] ?? d} onChange={e => setF(k, e.target.value)} type="number"/></SL>
              ))}
            </div>
          )}

          {/* 8 — Logistics */}
          {section === 8 && (
            <div className="grid grid-cols-2 gap-4">
              <SL label="Delivery Type">
                <SS value={form.delivery_type_id ?? ""} onChange={e => setF("delivery_type_id", e.target.value)}>
                  <option value="">— Select —</option>
                  {dlvTypes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </SS>
              </SL>
              <SL label="Return Policy">
                <SS value={form.return_policy_id ?? ""} onChange={e => setF("return_policy_id", e.target.value)}>
                  <option value="">— Select —</option>
                  {retPols.map(r => <option key={r.id} value={r.id}>{r.name} ({r.return_days}d)</option>)}
                </SS>
              </SL>
              <SL label="Warranty">
                <SS value={form.warranty_id ?? ""} onChange={e => setF("warranty_id", e.target.value)}>
                  <option value="">— Select —</option>
                  {warrs.map(w => <option key={w.id} value={w.id}>{w.name} ({w.duration_months}m)</option>)}
                </SS>
              </SL>
            </div>
          )}

          {/* 9 — Marketplace */}
          {section === 9 && (
            <div className="space-y-4">
              <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 font-medium">Amazon / Flipkart marketplace-specific fields</p>
              <div className="grid grid-cols-2 gap-4">
                <SL label="ASIN"><SI value={form.asin} onChange={e => setF("asin", e.target.value.toUpperCase())} placeholder="e.g. B0C7XYZMN1"/></SL>
                <SL label="FNSKU"><SI value={form.fnsku} onChange={e => setF("fnsku", e.target.value.toUpperCase())} placeholder="Fulfillment Network SKU"/></SL>
                <SL label="Age Restriction"><SI value={form.age_restriction} onChange={e => setF("age_restriction", e.target.value)} placeholder="e.g. 18+"/></SL>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[["is_hazmat","Hazmat"],["is_fragile","Fragile"],["is_fba_eligible","FBA Eligible"],["battery_required","Battery Required"]].map(([k,l]) => (
                  <label key={k} className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${form[k] ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="checkbox" checked={!!form[k]} onChange={e => setF(k, e.target.checked)} className="w-4 h-4 accent-indigo-600"/>
                    <span className="text-sm font-medium text-gray-700">{l}</span>
                  </label>
                ))}
              </div>
              <SL label="Included Components (What's in the box)">
                <div className="space-y-2">
                  {(form.included_components || [""]).map((c, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <SI value={c} onChange={e => { const a=[...(form.included_components||[])]; a[i]=e.target.value; setF("included_components",a); }} placeholder={`Item ${i+1}`}/>
                      <button type="button" onClick={() => { const a=[...(form.included_components||[])]; a.splice(i,1); setF("included_components",a); }} className="text-red-400 hover:text-red-600 flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setF("included_components", [...(form.included_components||[]),""])}
                    className="text-xs text-indigo-600 hover:underline font-semibold">+ Add component</button>
                </div>
              </SL>
            </div>
          )}

          {/* 10 — Images */}
          {section === 10 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Primary Image</p>
                <div className="flex items-start gap-4">
                  {form.primary_image ? (
                    <div className="relative w-32 h-32 rounded-xl border border-gray-200 overflow-hidden flex-shrink-0">
                      <img src={form.primary_image} alt="Primary" className="w-full h-full object-cover"/>
                      <button onClick={() => setF("primary_image","")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-xs text-center p-2">No image</div>
                  )}
                  <div className="space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                    <button type="button" onClick={() => fileRef.current.click()} disabled={imgUploading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                      {imgUploading ? "Uploading..." : "Upload Image"}
                    </button>
                    <p className="text-xs text-gray-400">Or paste URL:</p>
                    <SI value={form.primary_image} onChange={e => setF("primary_image", e.target.value)} placeholder="https://..."/>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Additional Images (up to 8)</p>
                <div className="flex flex-wrap gap-3">
                  {(form.image_urls || []).map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl border border-gray-200 overflow-hidden">
                      <img src={url} alt={`img ${i}`} className="w-full h-full object-cover"/>
                      <button onClick={() => { const a=[...(form.image_urls||[])]; a.splice(i,1); setF("image_urls",a); }}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                  {(form.image_urls||[]).length < 8 && (
                    <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      <span className="text-xs mt-1">Add</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImage}/>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 11 — Alt SKUs */}
          {section === 11 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Link alternate SKUs (Amazon ASIN, Flipkart, Barcode, etc.) that map to this item. Create Alt SKUs in MDM first.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {altSkus.map(a => (
                  <label key={a.id} className={`flex items-start gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-all ${(form.alt_sku_ids||[]).includes(a.id) ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300"}`}>
                    <input type="checkbox" checked={(form.alt_sku_ids||[]).includes(a.id)}
                      onChange={() => setF("alt_sku_ids", toggleMulti(form.alt_sku_ids||[], a.id))}
                      className="w-4 h-4 accent-amber-500 mt-0.5"/>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 font-mono">{a.sku_code}</p>
                      <p className="text-xs text-gray-400">{a.source || a.sku_type || "—"}</p>
                    </div>
                  </label>
                ))}
                {altSkus.length === 0 && <p className="text-xs text-gray-400 col-span-3">No Alt SKUs defined. Create them in MDM → Alt SKUs.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Section nav */}
        <div className="flex justify-between mt-6">
          <button onClick={() => setSection(s => Math.max(0, s-1))} disabled={section === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50">← Previous</button>
          {section < SECTIONS.length - 1
            ? <button onClick={() => setSection(s => s+1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Next →</button>
            : <button onClick={handleSubmit} disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                {saving ? "Saving..." : editId ? "✓ Update Item" : "✓ Create Item"}
              </button>
          }
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toast toast={toast}/>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Item Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">Full Amazon-style product catalog — {total} items</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            Bulk Upload
            <input type="file" accept=".csv" className="hidden" onChange={async e => {
              try { const { data } = await itemAPI.bulkUpload(e.target.files[0]); showToast(`${data.total_rows} rows parsed. Review and confirm.`); }
              catch { showToast("Upload failed.", "error"); }
            }}/>
          </label>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            New Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          ["Total Items", total, "bg-indigo-50 text-indigo-600"],
          ["Active",      items.filter(i=>i.is_active).length, "bg-green-50 text-green-600"],
          ["Published",   items.filter(i=>i.is_published).length, "bg-blue-50 text-blue-600"],
          ["Draft",       items.filter(i=>!i.is_published).length, "bg-yellow-50 text-yellow-600"],
        ].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${c.split(" ")[0]} rounded-lg flex items-center justify-center`}>
              <span className={`text-xl font-bold ${c.split(" ")[1]}`}>{v}</span>
            </div>
            <div className="text-xs text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by item name or SKU..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner text="Loading items..."/> : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>
            {search ? "No items match your search." : "No items yet. Create your first product!"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#","Image","SKU","Item Name","Brand","Category","Price","Stock","Status",""].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${h===""?"text-right":"text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item, i) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i+1}</td>
                    <td className="px-4 py-3">
                      {item.primary_image
                        ? <img src={item.primary_image} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-100"/>
                        : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                      }
                    </td>
                    <td className="px-4 py-3"><span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{item.sku}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{item.item_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.brand_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.sub_category_name || "—"}</td>
                    <td className="px-4 py-3">
                      {item.selling_price
                        ? <div><div className="font-semibold text-gray-800 text-xs">{"₹"}{Number(item.selling_price).toLocaleString()}</div>
                            {item.mrp && <div className="text-gray-400 line-through text-xs">{"₹"}{Number(item.mrp).toLocaleString()}</div>}</div>
                        : <span className="text-gray-400 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-700">{item.stock_qty}</div>
                      <div className="text-xs text-gray-400">{item.stock_status_name || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge active={item.is_active}/>
                        {item.is_published && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Published</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={() => setConfirm(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmDialog item={confirm} label="Item" onConfirm={handleDelete} onCancel={() => setConfirm(null)} deleting={deleting}/>
    </div>
  );
}

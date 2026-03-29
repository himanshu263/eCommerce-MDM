import { useState, useEffect } from "react";
import api from "../../services/api";

const MARKETPLACE_META = {
  amazon_in: { name:"Amazon India",  logo:"🛒", color:"from-orange-400 to-yellow-400", fields:"amazon",    id:"A21TJRUUN4KGV" },
  amazon_us: { name:"Amazon US",     logo:"🛒", color:"from-orange-500 to-orange-400", fields:"amazon",    id:"ATVPDKIKX0DER" },
  flipkart:  { name:"Flipkart",      logo:"🛍️", color:"from-blue-500 to-yellow-400",   fields:"flipkart",  id:"" },
  meesho:    { name:"Meesho",        logo:"🌸", color:"from-pink-500 to-rose-400",      fields:"generic",   id:"" },
  myntra:    { name:"Myntra",        logo:"👗", color:"from-pink-600 to-red-400",       fields:"generic",   id:"" },
  demo:      { name:"Demo / Sandbox",logo:"🔬", color:"from-indigo-500 to-violet-500",  fields:"none",      id:"DEMO" },
};

function StatusPill({ status }) {
  const map = { success:["bg-green-100 text-green-700","✓ Connected"], failed:["bg-red-100 text-red-600","✗ Failed"], running:["bg-blue-100 text-blue-600","⟳ Syncing"], null:["bg-gray-100 text-gray-500","Not tested"] };
  const [cls, label] = map[status] || map[null];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2
      ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
      {toast.type==="error"?"✕":"✓"} {toast.msg}
    </div>
  );
}

function ProductCard({ product, onImport, importing }) {
  const discount = product.mrp && product.selling_price
    ? Math.round((1 - product.selling_price / product.mrp) * 100) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative bg-gray-50 h-44 flex items-center justify-center overflow-hidden">
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-contain p-2"/>
          : <div className="text-5xl opacity-20">📦</div>
        }
        {discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
        )}
        <span className="absolute top-2 right-2 bg-white border border-gray-200 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
          {product.source?.replace("_"," ").toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <p className="text-xs text-indigo-600 font-semibold">{product.brand || "—"}</p>
        <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">{product.title}</p>
        {product.category && <p className="text-xs text-gray-400">{product.category}</p>}

        {/* Pricing */}
        {product.selling_price || product.mrp ? (
          <div className="flex items-baseline gap-2 mt-1">
            {product.selling_price && <span className="text-lg font-extrabold text-gray-900">₹{Number(product.selling_price).toLocaleString()}</span>}
            {product.mrp && product.selling_price && product.mrp !== product.selling_price && (
              <span className="text-xs text-gray-400 line-through">₹{Number(product.mrp).toLocaleString()}</span>
            )}
          </div>
        ) : null}

        {/* External ID */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">ID:</span>
          <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{product.external_id}</code>
        </div>

        {/* Bullet points preview */}
        {product.bullet_points?.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {product.bullet_points.slice(0, 2).map((b, i) => (
              <li key={i} className="text-xs text-gray-500 flex gap-1"><span className="text-indigo-400 flex-shrink-0">•</span><span className="line-clamp-1">{b}</span></li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-0 mt-auto">
        <button onClick={() => onImport(product)} disabled={importing === product.external_id}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {importing === product.external_id
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Importing...</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Import to Catalog</>
          }
        </button>
      </div>
    </div>
  );
}

export default function MarketplaceFetch() {
  const [credentials, setCreds]     = useState([]);
  const [selectedCred, setSelected] = useState(null);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [testing, setTesting]       = useState(null);
  const [importing, setImporting]   = useState(null);
  const [toast, setToast]           = useState(null);
  const [showAddModal, setShowAdd]  = useState(false);
  const [showEditModal, setShowEdit]= useState(null);
  const [search, setSearch]         = useState("");
  const [asin, setAsin]             = useState("");
  const [maxResults, setMax]        = useState(10);
  const [credsLoading, setCredsLoading] = useState(true);

  // Add/Edit form
  const EMPTY_CRED = { marketplace:"demo", display_name:"", seller_id:"", marketplace_id:"",
    client_id:"", client_secret:"", refresh_token:"", api_key:"", api_secret:"",
    access_key:"", secret_key:"", role_arn:"", region:"eu-west-1",
    endpoint_url:"", auto_sync:false, sync_interval_hr:24, is_active:true };
  const [credForm, setCredForm] = useState(EMPTY_CRED);

  useEffect(() => { loadCredentials(); }, []);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadCredentials = async () => {
    setCredsLoading(true);
    try {
      const { data } = await api.get("/api/marketplace/credentials");
      setCreds(data);
      // auto-select first connected or first
      if (data.length > 0 && !selectedCred) setSelected(data[0]);
    } catch { showToast("Failed to load marketplace credentials.", "error"); }
    finally { setCredsLoading(false); }
  };

  const handleTest = async (cred) => {
    setTesting(cred.id);
    try {
      const { data } = await api.post(`/api/marketplace/credentials/${cred.id}/test`);
      showToast(data.message, data.connected ? "success" : "error");
      loadCredentials();
    } catch { showToast("Connection test failed.", "error"); }
    finally { setTesting(null); }
  };

  const handleFetch = async () => {
    if (!selectedCred) { showToast("Select a marketplace first.", "error"); return; }
    setLoading(true); setProducts([]);
    try {
      const { data } = await api.post("/api/marketplace/fetch", {
        marketplace_id: selectedCred.id,
        search_query: search || null,
        asin: asin || null,
        max_results: maxResults,
        import_to_catalog: false,
      });
      setProducts(data);
      if (data.length === 0) showToast("No products found. Try a different search.", "error");
      else showToast(`${data.length} product${data.length>1?"s":""} fetched from ${selectedCred.display_name}!`);
    } catch (err) {
      showToast(err.response?.data?.detail || "Fetch failed.", "error");
    } finally { setLoading(false); }
  };

  const handleImport = async (product) => {
    setImporting(product.external_id);
    try {
      const payload = {
        sku: product.external_id,
        item_name: product.title,
        description: product.description || "",
        bullet_points: product.bullet_points || [],
        mrp: product.mrp,
        selling_price: product.selling_price,
        asin: product.source?.includes("amazon") ? product.external_id : null,
        model_number: product.model_number,
        country_of_origin: product.country_of_origin,
        primary_image: product.images?.[0] || null,
        image_urls: product.images || [],
        weight: product.weight_kg,
        search_keywords: `${product.brand || ""} ${product.category || ""} ${product.title}`.trim(),
        is_active: true,
        is_published: false,
      };
      await api.post("/api/items/", payload);
      showToast(`"${product.title.slice(0, 40)}..." imported to Item Master!`);
    } catch (err) {
      showToast(err.response?.data?.detail || "Import failed.", "error");
    } finally { setImporting(null); }
  };

  const handleSaveCred = async () => {
    try {
      if (showEditModal) {
        await api.put(`/api/marketplace/credentials/${showEditModal.id}`, credForm);
        showToast("Credential updated!"); setShowEdit(null);
      } else {
        await api.post("/api/marketplace/credentials", credForm);
        showToast("Marketplace added!"); setShowAdd(false);
      }
      loadCredentials();
    } catch (err) { showToast(err.response?.data?.detail || "Save failed.", "error"); }
  };

  const handleDeleteCred = async (id) => {
    if (!window.confirm("Delete this marketplace credential?")) return;
    try { await api.delete(`/api/marketplace/credentials/${id}`); showToast("Deleted!"); loadCredentials(); }
    catch { showToast("Delete failed.", "error"); }
  };

  const setF = (k, v) => setCredForm(f => ({...f, [k]: v}));
  const meta = (mp) => MARKETPLACE_META[mp] || { name: mp, logo:"🌐", color:"from-gray-500 to-gray-400" };
  const selectedMeta = selectedCred ? meta(selectedCred.marketplace) : null;

  const CredModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-semibold text-lg">{showEditModal ? "Edit Marketplace" : "Add Marketplace"}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Marketplace *</label>
              <select value={credForm.marketplace} onChange={e => setF("marketplace", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(MARKETPLACE_META).map(([k, v]) => <option key={k} value={k}>{v.logo} {v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Display Name *</label>
              <input value={credForm.display_name} onChange={e => setF("display_name", e.target.value)}
                placeholder="e.g. Amazon India Store" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
          </div>

          {/* Amazon fields */}
          {MARKETPLACE_META[credForm.marketplace]?.fields === "amazon" && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
                <strong>Amazon SP-API Setup:</strong> You need LWA credentials from Seller Central → Apps &amp; Services → Develop Apps. Also requires AWS IAM role.
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Seller ID",      "seller_id",       "A1XXXXXXXXXXXXX"],
                  ["Marketplace ID", "marketplace_id",  "A21TJRUUN4KGV (India)"],
                  ["LWA Client ID",  "client_id",       "amzn1.application-oa2-client.xxx"],
                  ["LWA Client Secret","client_secret", "amzn1.oa2-cs.v1.xxx"],
                  ["Refresh Token",  "refresh_token",   "Atzr|xxx..."],
                  ["AWS Access Key", "access_key",      "AKIAIOSFODNN7EXAMPLE"],
                  ["AWS Secret Key", "secret_key",      "wJalrXUtnFEMI..."],
                  ["AWS Role ARN",   "role_arn",        "arn:aws:iam::123:role/SellingPartnerRole"],
                  ["Region",        "region",          "eu-west-1"],
                ].map(([l, k, p]) => (
                  <div key={k} className={k==="refresh_token"||k==="role_arn"?"col-span-2":""}>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{l}</label>
                    <input value={credForm[k]||""} onChange={e=>setF(k,e.target.value)} placeholder={p}
                      type={k.includes("secret")||k.includes("token")?"password":"text"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flipkart fields */}
          {MARKETPLACE_META[credForm.marketplace]?.fields === "flipkart" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <strong>Flipkart Seller API:</strong> Get credentials from seller.flipkart.com → Settings → API Credentials
              </div>
              {[["API Key","api_key","flipkart-api-key"],["API Secret","api_secret","flipkart-api-secret"],["Endpoint URL","endpoint_url","https://api.flipkart.net/sellers"]].map(([l,k,p])=>(
                <div key={k}>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{l}</label>
                  <input value={credForm[k]||""} onChange={e=>setF(k,e.target.value)} placeholder={p}
                    type={k.includes("secret")?"password":"text"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              ))}
            </div>
          )}

          {/* Generic */}
          {MARKETPLACE_META[credForm.marketplace]?.fields === "generic" && (
            <div className="grid grid-cols-2 gap-4">
              {[["API Key","api_key"],["API Secret","api_secret"],["Access Token","access_token"],["Endpoint URL","endpoint_url"]].map(([l,k])=>(
                <div key={k}>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">{l}</label>
                  <input value={credForm[k]||""} onChange={e=>setF(k,e.target.value)} placeholder={`Enter ${l}`}
                    type={k.includes("secret")||k.includes("token")?"password":"text"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              ))}
            </div>
          )}

          {/* Sync settings */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Sync Interval (hours)</label>
              <input type="number" value={credForm.sync_interval_hr} onChange={e=>setF("sync_interval_hr",Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={credForm.auto_sync} onChange={e=>setF("auto_sync",e.target.checked)} className="w-4 h-4 accent-indigo-600"/>
                <span className="text-sm font-semibold text-gray-700">Auto Sync</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={credForm.is_active} onChange={e=>setF("is_active",e.target.checked)} className="w-4 h-4 accent-green-600"/>
                <span className="text-sm font-semibold text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSaveCred} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700">Save</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toast toast={toast}/>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Marketplace Integration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fetch product data from Amazon, Flipkart, Meesho and import directly to Item Master</p>
        </div>
        <button onClick={() => { setCredForm(EMPTY_CRED); setShowAdd(true); }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Marketplace
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* ── LEFT: Credentials panel ────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Connected Marketplaces</p>

          {credsLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              <svg className="w-6 h-6 animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              Loading...
            </div>
          ) : credentials.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-4xl mb-2">🔌</p>
              <p className="text-sm font-semibold text-gray-600">No marketplaces added</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Add Amazon, Flipkart or use Demo mode</p>
              <button onClick={() => { setCredForm({...EMPTY_CRED, marketplace:"demo", display_name:"Demo / Sandbox"}); setShowAdd(true); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
                Quick Add Demo
              </button>
            </div>
          ) : (
            credentials.map(cred => {
              const m = meta(cred.marketplace);
              const isActive = selectedCred?.id === cred.id;
              return (
                <div key={cred.id} onClick={() => setSelected(cred)}
                  className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all
                    ${isActive ? "border-indigo-400 ring-2 ring-indigo-200 shadow-indigo-100" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                      {m.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{cred.display_name}</p>
                      <p className="text-xs text-gray-400">{m.name}</p>
                      <div className="mt-1"><StatusPill status={cred.last_sync_status}/></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={e => { e.stopPropagation(); handleTest(cred); }} disabled={testing===cred.id}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg text-xs" title="Test Connection">
                        {testing===cred.id
                          ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        }
                      </button>
                      <button onClick={e => { e.stopPropagation(); setCredForm({...EMPTY_CRED,...cred}); setShowEdit(cred); }}
                        className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteCred(cred.id); }}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                  {cred.last_synced_at && (
                    <p className="text-xs text-gray-400 mt-2 pl-14">
                      Last sync: {new Date(cred.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── RIGHT: Fetch panel ─────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              {selectedMeta && (
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selectedMeta.color} flex items-center justify-center text-xl`}>
                  {selectedMeta.logo}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-800 text-sm">{selectedCred?.display_name || "Select a marketplace"}</p>
                <p className="text-xs text-gray-400">{selectedCred ? `Fetch products from ${selectedMeta?.name}` : "Choose a marketplace from the left panel"}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Search Query</label>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="e.g. Samsung Galaxy S24, boAt headphones..."
                  onKeyDown={e => e.key==="Enter" && handleFetch()}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="w-44">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">ASIN (Amazon)</label>
                <input value={asin} onChange={e => setAsin(e.target.value.toUpperCase())}
                  placeholder="e.g. B0CHX1W1XY"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div className="w-28">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Max Results</label>
                <select value={maxResults} onChange={e => setMax(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {[5,10,20,50].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleFetch} disabled={loading || !selectedCred}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center gap-2 shadow">
                  {loading
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Fetching...</>
                    : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>Fetch Products</>
                  }
                </button>
              </div>
            </div>

            {/* Quick searches */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-400 font-semibold">Quick:</span>
              {["Samsung","Apple iPhone","boAt","OnePlus","Fastrack"].map(q => (
                <button key={q} onClick={() => { setSearch(q); }}
                  className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 rounded-full font-semibold transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <svg className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <p className="text-sm font-semibold text-gray-600">Fetching from {selectedCred?.display_name}...</p>
              <p className="text-xs text-gray-400 mt-1">Calling marketplace API, please wait</p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm font-bold text-gray-700">{products.length} Products Found</p>
                <button onClick={() => Promise.all(products.map(p => handleImport(p).catch(()=>{})))}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                  Import All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(p => (
                  <ProductCard key={p.external_id} product={p} onImport={handleImport} importing={importing}/>
                ))}
              </div>
            </div>
          )}

          {!loading && products.length === 0 && credentials.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-sm font-semibold text-gray-600">Search for products above</p>
              <p className="text-xs text-gray-400 mt-1">Try a keyword, brand name, or paste an ASIN</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {(showAddModal || showEditModal) && <CredModal onClose={() => { setShowAdd(false); setShowEdit(null); }}/>}
    </div>
  );
}

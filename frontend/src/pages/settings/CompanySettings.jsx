import { useState, useEffect, useRef } from "react";
import api, { uploadImage } from "../../services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TABS = [
  { key: "basic",    label: "Basic Info",      icon: "🏢" },
  { key: "address",  label: "Address",         icon: "📍" },
  { key: "tax",      label: "Tax & Legal",     icon: "📋" },
  { key: "finance",  label: "Finance",         icon: "💰" },
  { key: "branding", label: "Branding",        icon: "🎨" },
  { key: "system",   label: "System",          icon: "⚙️" },
  { key: "email",    label: "Email / SMTP",    icon: "📧" },
];

const EMPTY = {
  company_name:"", company_code:"", legal_name:"", tagline:"",
  logo_url:"", favicon_url:"", website:"", support_email:"", support_phone:"",
  address_line1:"", address_line2:"", city:"", state:"", pincode:"", country:"India",
  gst_number:"", pan_number:"", cin_number:"", tan_number:"", msme_number:"", fssai_number:"",
  currency:"INR", currency_symbol:"₹", fiscal_year_start:"04-01", default_tax_rate:"18",
  primary_color:"#4F46E5", secondary_color:"#7C3AED", theme_mode:"light",
  timezone:"Asia/Kolkata", date_format:"DD/MM/YYYY", time_format:"12h", language:"en",
  smtp_host:"", smtp_port:587, smtp_user:"", smtp_password:"", smtp_from_name:"", smtp_from_email:"",
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 transition-all
      ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
      <span>{toast.type === "error" ? "✕" : "✓"}</span>{toast.msg}
    </div>
  );
}

function FL({ label, children, hint, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function FI({ value, onChange, placeholder, type="text", className="" }) {
  return (
    <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder}
      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}/>
  );
}

function FS({ value, onChange, children }) {
  return (
    <select value={value ?? ""} onChange={onChange}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
      {children}
    </select>
  );
}

export default function CompanySettings() {
  const [form, setForm]         = useState(EMPTY);
  const [activeTab, setTab]     = useState("basic");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [logoUploading, setLU]  = useState(false);
  const logoRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await api.get("/api/company/settings");
      setForm({ ...EMPTY, ...data });
    } catch { showToast("Failed to load settings.", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/company/settings", form);
      showToast("Company settings saved successfully!");
    } catch (err) {
      showToast(err.response?.data?.detail || "Save failed.", "error");
    } finally { setSaving(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setLU(true);
    try {
      const { data } = await uploadImage(file);
      setF("logo_url", `${API_BASE}${data.url}`);
      showToast("Logo uploaded!");
    } catch { showToast("Logo upload failed.", "error"); }
    finally { setLU(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>Loading settings...
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Toast toast={toast}/>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Company Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure your organisation's identity, tax, branding and system preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 shadow-md shadow-indigo-200 transition-all">
          {saving
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving...</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Save Settings</>
          }
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                  ${activeTab === t.key ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}>
                <span className="text-base">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* ── Basic Info ────────────────────────────────────────────── */}
          {activeTab === "basic" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">Basic Information</h2>

              {/* Logo upload */}
              <FL label="Company Logo">
                <div className="flex items-center gap-4">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-xl border border-gray-200 p-1"/>
                    : <div className="w-20 h-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-3xl">🏢</div>
                  }
                  <div className="space-y-2">
                    <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
                    <button type="button" onClick={() => logoRef.current.click()} disabled={logoUploading}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 disabled:opacity-60">
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                    </button>
                    <p className="text-xs text-gray-400">PNG, JPG — recommended 200×60px</p>
                    {form.logo_url && (
                      <FI value={form.logo_url} onChange={e => setF("logo_url", e.target.value)} placeholder="Or paste URL"/>
                    )}
                  </div>
                </div>
              </FL>

              <div className="grid grid-cols-2 gap-4">
                <FL label="Company Name" required>
                  <FI value={form.company_name} onChange={e => setF("company_name", e.target.value)} placeholder="e.g. Acme Pvt Ltd"/>
                </FL>
                <FL label="Company Code">
                  <FI value={form.company_code} onChange={e => setF("company_code", e.target.value.toUpperCase())} placeholder="e.g. ACME"/>
                </FL>
              </div>

              <FL label="Legal Name">
                <FI value={form.legal_name} onChange={e => setF("legal_name", e.target.value)} placeholder="Full registered legal name"/>
              </FL>

              <FL label="Tagline">
                <FI value={form.tagline} onChange={e => setF("tagline", e.target.value)} placeholder="e.g. Quality you can trust"/>
              </FL>

              <div className="grid grid-cols-2 gap-4">
                <FL label="Website">
                  <FI value={form.website} onChange={e => setF("website", e.target.value)} placeholder="https://yourcompany.com"/>
                </FL>
                <FL label="Support Email">
                  <FI value={form.support_email} onChange={e => setF("support_email", e.target.value)} type="email" placeholder="support@yourcompany.com"/>
                </FL>
                <FL label="Support Phone">
                  <FI value={form.support_phone} onChange={e => setF("support_phone", e.target.value)} placeholder="+91 XXXXX XXXXX"/>
                </FL>
              </div>
            </div>
          )}

          {/* ── Address ────────────────────────────────────────────────── */}
          {activeTab === "address" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">Registered Address</h2>
              <FL label="Address Line 1">
                <FI value={form.address_line1} onChange={e => setF("address_line1", e.target.value)} placeholder="Building, Street"/>
              </FL>
              <FL label="Address Line 2">
                <FI value={form.address_line2} onChange={e => setF("address_line2", e.target.value)} placeholder="Area, Landmark"/>
              </FL>
              <div className="grid grid-cols-2 gap-4">
                <FL label="City">   <FI value={form.city}    onChange={e => setF("city", e.target.value)}    placeholder="e.g. Mumbai"/></FL>
                <FL label="State">  <FI value={form.state}   onChange={e => setF("state", e.target.value)}   placeholder="e.g. Maharashtra"/></FL>
                <FL label="Pincode"><FI value={form.pincode} onChange={e => setF("pincode", e.target.value)} placeholder="e.g. 400001"/></FL>
                <FL label="Country"><FI value={form.country} onChange={e => setF("country", e.target.value)} placeholder="e.g. India"/></FL>
              </div>
            </div>
          )}

          {/* ── Tax & Legal ────────────────────────────────────────────── */}
          {activeTab === "tax" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">Tax & Legal Identifiers</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["GST Number",  "gst_number",  "27AABCU9603R1ZM"],
                  ["PAN Number",  "pan_number",  "AABCU9603R"],
                  ["CIN Number",  "cin_number",  "U72200MH2021PTC123456"],
                  ["TAN Number",  "tan_number",  "PNEA00000B"],
                  ["MSME Number", "msme_number", "MH01D0000001"],
                  ["FSSAI Number","fssai_number","10020042000015"],
                ].map(([l, k, p]) => (
                  <FL key={k} label={l}>
                    <FI value={form[k]} onChange={e => setF(k, e.target.value.toUpperCase())} placeholder={p}
                      className="font-mono"/>
                  </FL>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
                <strong>Note:</strong> These identifiers are used on invoices, e-way bills, and GST filings. Ensure they match your MCA/GST portal exactly.
              </div>
            </div>
          )}

          {/* ── Finance ────────────────────────────────────────────────── */}
          {activeTab === "finance" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">Finance & Currency</h2>
              <div className="grid grid-cols-2 gap-4">
                <FL label="Currency">
                  <FS value={form.currency} onChange={e => setF("currency", e.target.value)}>
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </FS>
                </FL>
                <FL label="Currency Symbol">
                  <FI value={form.currency_symbol} onChange={e => setF("currency_symbol", e.target.value)} placeholder="₹"/>
                </FL>
                <FL label="Fiscal Year Start" hint="MM-DD format">
                  <FS value={form.fiscal_year_start} onChange={e => setF("fiscal_year_start", e.target.value)}>
                    <option value="04-01">April 1 (India Standard)</option>
                    <option value="01-01">January 1 (Calendar Year)</option>
                    <option value="07-01">July 1</option>
                  </FS>
                </FL>
                <FL label="Default Tax Rate (%)">
                  <FS value={form.default_tax_rate} onChange={e => setF("default_tax_rate", e.target.value)}>
                    {["0","5","12","18","28"].map(r => <option key={r} value={r}>GST {r}%</option>)}
                  </FS>
                </FL>
              </div>
            </div>
          )}

          {/* ── Branding ───────────────────────────────────────────────── */}
          {activeTab === "branding" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">Brand & Theme</h2>
              <div className="grid grid-cols-2 gap-4">
                <FL label="Primary Color" hint="Main brand colour used for buttons & accents">
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color || "#4F46E5"} onChange={e => setF("primary_color", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"/>
                    <FI value={form.primary_color} onChange={e => setF("primary_color", e.target.value)} placeholder="#4F46E5" className="font-mono"/>
                  </div>
                </FL>
                <FL label="Secondary Color">
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondary_color || "#7C3AED"} onChange={e => setF("secondary_color", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"/>
                    <FI value={form.secondary_color} onChange={e => setF("secondary_color", e.target.value)} placeholder="#7C3AED" className="font-mono"/>
                  </div>
                </FL>
              </div>
              <FL label="Theme Mode">
                <div className="flex gap-3">
                  {["light","dark","auto"].map(m => (
                    <label key={m} className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-all
                      ${form.theme_mode === m ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      <input type="radio" value={m} checked={form.theme_mode === m} onChange={() => setF("theme_mode", m)} className="hidden"/>
                      <span className="text-lg">{m==="light"?"☀️":m==="dark"?"🌙":"🔄"}</span>
                      <span className="text-sm font-semibold capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </FL>
              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Brand Preview</p>
                <div className="flex items-center gap-3">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="logo" className="h-10 object-contain"/>
                    : <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{background: form.primary_color || "#4F46E5"}}>
                        {(form.company_name || "A")[0]}
                      </div>
                  }
                  <div>
                    <p className="font-bold text-gray-800">{form.company_name || "Company Name"}</p>
                    <p className="text-xs text-gray-500">{form.tagline || "Your tagline here"}</p>
                  </div>
                  <button className="ml-auto px-4 py-2 rounded-lg text-white text-sm font-semibold"
                    style={{background: form.primary_color || "#4F46E5"}}>
                    Sample Button
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── System ─────────────────────────────────────────────────── */}
          {activeTab === "system" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">System Preferences</h2>
              <div className="grid grid-cols-2 gap-4">
                <FL label="Timezone">
                  <FS value={form.timezone} onChange={e => setF("timezone", e.target.value)}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8)</option>
                  </FS>
                </FL>
                <FL label="Date Format">
                  <FS value={form.date_format} onChange={e => setF("date_format", e.target.value)}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (India)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </FS>
                </FL>
                <FL label="Time Format">
                  <FS value={form.time_format} onChange={e => setF("time_format", e.target.value)}>
                    <option value="12h">12 Hour (AM/PM)</option>
                    <option value="24h">24 Hour</option>
                  </FS>
                </FL>
                <FL label="Language">
                  <FS value={form.language} onChange={e => setF("language", e.target.value)}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                  </FS>
                </FL>
              </div>
            </div>
          )}

          {/* ── Email / SMTP ────────────────────────────────────────────── */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-100">Email / SMTP Configuration</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                SMTP settings are used for system notifications and order emails. Passwords are encrypted at rest.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FL label="SMTP Host">      <FI value={form.smtp_host}       onChange={e => setF("smtp_host", e.target.value)}       placeholder="smtp.gmail.com"/></FL>
                <FL label="SMTP Port">      <FI value={form.smtp_port}       onChange={e => setF("smtp_port", e.target.value)}       type="number" placeholder="587"/></FL>
                <FL label="SMTP Username">  <FI value={form.smtp_user}       onChange={e => setF("smtp_user", e.target.value)}       placeholder="your@gmail.com"/></FL>
                <FL label="SMTP Password">  <FI value={form.smtp_password}   onChange={e => setF("smtp_password", e.target.value)}   type="password" placeholder="App password"/></FL>
                <FL label="From Name">      <FI value={form.smtp_from_name}  onChange={e => setF("smtp_from_name", e.target.value)}  placeholder="Acme Support"/></FL>
                <FL label="From Email">     <FI value={form.smtp_from_email} onChange={e => setF("smtp_from_email", e.target.value)} type="email" placeholder="no-reply@acme.com"/></FL>
              </div>
              <div className="flex">
                <button onClick={async () => {
                    try {
                      await api.post("/api/company/test-email");
                      showToast("Test email sent!");
                    } catch { showToast("SMTP test failed — check settings.", "error"); }
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800">
                  Send Test Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

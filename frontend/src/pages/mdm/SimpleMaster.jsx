/**
 * Generic master page — works for: Brand, Manufacturer, Supplier, Size, Color,
 * WeightUnit, Unit, Material, Pattern, Style, ProductType, StockStatus,
 * Warehouse, DeliveryType, ReturnPolicy, Warranty, Seller, HSN, GST, AltSKU.
 *
 * Props:
 *   title, subtitle, accentColor (tailwind color name like "indigo"), api (apiObject),
 *   columns: [{key, label, render?}]
 *   formFields: [{key, label, type?, required?, options?}]  -- options = [{value,label}]
 *   emptyForm: {}
 */
import { useState, useEffect } from "react";
import {
  Toast, ConfirmDialog, StatusBadge, Spinner,
  ModalHeader, FormField, Input, Select, Toggle, SaveButton
} from "../../components/MasterTable";

export default function SimpleMaster({
  title, subtitle, accentColor = "indigo", api,
  columns = [], formFields = [], emptyForm = {}
}) {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [confirm, setConfirm]   = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.getAll(); setRows(data.items); setTotal(data.total); }
    catch { showToast("Failed to load data.", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => { setForm(emptyForm); setErrors({}); setEditId(null); setShowModal(true); };
  const openEdit   = (r)  => {
    const f = {};
    formFields.forEach(ff => { f[ff.key] = r[ff.key] ?? emptyForm[ff.key] ?? ""; });
    setForm(f); setErrors({}); setEditId(r.id); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    formFields.forEach(ff => {
      if (ff.required && !String(form[ff.key] ?? "").trim()) e[ff.key] = `${ff.label} is required.`;
    });
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault(); if (!validate()) return;
    setSaving(true);
    try {
      if (editId) { await api.update(editId, form); showToast(`${title} updated!`); }
      else        { await api.create(form);          showToast(`${title} created!`); }
      setShowModal(false); load();
    } catch (err) { showToast(err.response?.data?.detail || "Save failed.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await api.delete(confirm.id); showToast("Deleted!"); setConfirm(null); load(); }
    catch (err) { showToast(err.response?.data?.detail || "Delete failed.", "error"); }
    finally { setDeleting(false); }
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filtered = rows.filter(r =>
    Object.values(r).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const COLORS = {
    indigo: { btn: "bg-indigo-600 hover:bg-indigo-700", grad: "from-indigo-600 to-blue-600", ring: "focus:ring-indigo-500" },
    emerald:{ btn: "bg-emerald-600 hover:bg-emerald-700", grad: "from-emerald-600 to-teal-600", ring: "focus:ring-emerald-500" },
    violet: { btn: "bg-violet-600 hover:bg-violet-700", grad: "from-violet-600 to-purple-600", ring: "focus:ring-violet-500" },
    orange: { btn: "bg-orange-500 hover:bg-orange-600", grad: "from-orange-500 to-red-500", ring: "focus:ring-orange-500" },
    sky:    { btn: "bg-sky-600 hover:bg-sky-700", grad: "from-sky-600 to-blue-600", ring: "focus:ring-sky-500" },
    rose:   { btn: "bg-rose-600 hover:bg-rose-700", grad: "from-rose-600 to-pink-600", ring: "focus:ring-rose-500" },
  };
  const C = COLORS[accentColor] || COLORS.indigo;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <button onClick={openCreate}
          className={`inline-flex items-center gap-2 ${C.btn} text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow transition-colors`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add {title}
        </button>
      </div>

      {/* Stats + Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </div>
          <div><div className="text-2xl font-bold text-gray-800">{total}</div><div className="text-xs text-gray-500">Total Records</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div><div className="text-2xl font-bold text-gray-800">{rows.filter(r => r.is_active).length}</div><div className="text-xs text-gray-500">Active</div></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title}...`}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner text={`Loading ${title}...`}/> : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            {search ? "No records match your search." : `No ${title} found. Create one!`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">#</th>
                  {columns.map(c => (
                    <th key={c.key} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">{c.label}</th>
                  ))}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    {columns.map(c => (
                      <td key={c.key} className="px-4 py-3 text-gray-700">
                        {c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-4 py-3"><StatusBadge active={r.is_active}/></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={() => setConfirm(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <ModalHeader title={editId ? `Edit ${title}` : `Create ${title}`} gradient={C.grad} onClose={() => setShowModal(false)}/>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formFields.map(ff => (
                <FormField key={ff.key} label={ff.label} error={errors[ff.key]} required={ff.required}>
                  {ff.type === "toggle" ? (
                    <Toggle value={!!form[ff.key]} onChange={v => setF(ff.key, v)} label={ff.hint || ff.label}/>
                  ) : ff.type === "select" ? (
                    <Select value={form[ff.key] ?? ""} onChange={e => setF(ff.key, e.target.value)} error={errors[ff.key]}>
                      <option value="">— Select —</option>
                      {(ff.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : ff.type === "textarea" ? (
                    <textarea value={form[ff.key] ?? ""} onChange={e => setF(ff.key, e.target.value)}
                      placeholder={ff.placeholder} rows={3}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors[ff.key] ? "border-red-400" : "border-gray-300"}`}/>
                  ) : (
                    <Input value={form[ff.key] ?? ""} onChange={e => setF(ff.key, ff.uppercase ? e.target.value.toUpperCase() : e.target.value)}
                      placeholder={ff.placeholder || ff.label} type={ff.type || "text"} error={errors[ff.key]}/>
                  )}
                </FormField>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <SaveButton saving={saving} editId={editId}/>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog item={confirm} label={title} onConfirm={handleDelete} onCancel={() => setConfirm(null)} deleting={deleting}/>
    </div>
  );
}

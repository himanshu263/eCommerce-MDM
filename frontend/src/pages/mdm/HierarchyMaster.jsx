/**
 * 4-level hierarchy page: ProductGroup → SubGroup → Category → SubCategory
 * Dependent dropdowns — selecting a parent filters children.
 */
import { useState, useEffect } from "react";
import { productGroupAPI, subGroupAPI, categoryAPI, subCategoryAPI } from "../../services/api";
import { Toast, ConfirmDialog, StatusBadge, Spinner, ModalHeader, FormField, Input, Select, Toggle, SaveButton } from "../../components/MasterTable";

const TABS = ["Product Groups", "Sub Groups", "Categories", "Sub Categories"];

const COLORS = ["bg-blue-50 text-blue-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700", "bg-orange-50 text-orange-700"];

export default function HierarchyMaster() {
  const [tab, setTab]           = useState(0);
  const [groups, setGroups]     = useState([]);
  const [subGroups, setSubGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCats, setSubCats]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({});
  const [errors, setErrors]     = useState({});
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [confirm, setConfirm]   = useState(null);

  // Filter dropdowns
  const [filterGroup, setFilterGroup]   = useState("");
  const [filterSub, setFilterSub]       = useState("");
  const [filterCat, setFilterCat]       = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [g, sg, c, sc] = await Promise.all([
        productGroupAPI.getAll(), subGroupAPI.getAll(), categoryAPI.getAll(), subCategoryAPI.getAll()
      ]);
      setGroups(g.data.items);
      setSubGroups(sg.data.items);
      setCategories(c.data.items);
      setSubCats(sc.data.items);
    } catch { showToast("Failed to load hierarchy.", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const currentData = () => {
    if (tab === 0) return groups;
    if (tab === 1) return subGroups.filter(r => !filterGroup || String(r.product_group_id) === filterGroup);
    if (tab === 2) return categories.filter(r => !filterSub || String(r.sub_group_id) === filterSub);
    return subCats.filter(r => !filterCat || String(r.category_id) === filterCat);
  };

  const filtered = currentData().filter(r =>
    Object.values(r).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const apis = [productGroupAPI, subGroupAPI, categoryAPI, subCategoryAPI];
  const labels = ["Product Group", "Sub Group", "Category", "Sub Category"];

  const openCreate = () => {
    const base = { name: "", code: "", description: "", is_active: true, sort_order: 0 };
    if (tab === 1) base.product_group_id = filterGroup || "";
    if (tab === 2) base.sub_group_id     = filterSub   || "";
    if (tab === 3) base.category_id      = filterCat   || "";
    setForm(base); setErrors({}); setEditId(null); setShowModal(true);
  };

  const openEdit = (r) => {
    const base = { name: r.name, code: r.code, description: r.description || "", is_active: r.is_active, sort_order: r.sort_order ?? 0 };
    if (tab === 1) base.product_group_id = r.product_group_id;
    if (tab === 2) base.sub_group_id     = r.sub_group_id;
    if (tab === 3) base.category_id      = r.category_id;
    setForm(base); setErrors({}); setEditId(r.id); setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required.";
    if (!form.code?.trim()) e.code = "Code is required.";
    if (tab === 1 && !form.product_group_id) e.product_group_id = "Product Group is required.";
    if (tab === 2 && !form.sub_group_id)     e.sub_group_id     = "Sub Group is required.";
    if (tab === 3 && !form.category_id)      e.category_id      = "Category is required.";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault(); if (!validate()) return;
    setSaving(true);
    const payload = { ...form, code: form.code.toUpperCase() };
    try {
      if (editId) { await apis[tab].update(editId, payload); showToast(`${labels[tab]} updated!`); }
      else        { await apis[tab].create(payload);          showToast(`${labels[tab]} created!`); }
      setShowModal(false); loadAll();
    } catch (err) { showToast(err.response?.data?.detail || "Save failed.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await apis[tab].delete(confirm.id); showToast("Deleted!"); setConfirm(null); loadAll(); }
    catch (err) { showToast(err.response?.data?.detail || "Delete failed.", "error"); }
    finally { setDeleting(false); }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const gradients = [
    "from-blue-600 to-indigo-600",
    "from-violet-600 to-purple-600",
    "from-emerald-600 to-teal-600",
    "from-orange-500 to-red-500",
  ];

  const filteredSubGroups = subGroups.filter(s => !form.product_group_id || String(s.product_group_id) === String(form.product_group_id));
  const filteredCats      = categories.filter(c => !form.sub_group_id || String(c.sub_group_id) === String(form.sub_group_id));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toast toast={toast}/>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Product Hierarchy</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage Group → Sub Group → Category → Sub Category</p>
      </div>

      {/* Breadcrumb visual */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((t, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { setTab(i); setSearch(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === i ? "bg-indigo-600 text-white shadow" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {t}
              <span className="ml-2 text-xs opacity-70">
                ({i === 0 ? groups.length : i === 1 ? subGroups.length : i === 2 ? categories.length : subCats.length})
              </span>
            </button>
            {i < 3 && <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>}
          </div>
        ))}
      </div>

      {/* Filter + Add row */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {tab === 1 && (
          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
        {tab === 2 && (
          <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Sub Groups</option>
            {subGroups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {tab === 3 && (
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-colors ml-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add {labels[tab]}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner/> : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  {tab >= 1 && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent</th>}
                  {tab >= 2 && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Group</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono px-2 py-0.5 rounded text-xs font-semibold ${COLORS[tab]}`}>{r.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                    {tab >= 1 && <td className="px-4 py-3 text-gray-600 text-xs">{r.product_group_name || r.sub_group_name || r.category_name || "—"}</td>}
                    {tab >= 2 && <td className="px-4 py-3 text-gray-500 text-xs">{r.product_group_name || "—"}</td>}
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.description || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge active={r.is_active}/></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={() => setConfirm(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
            <ModalHeader title={editId ? `Edit ${labels[tab]}` : `Create ${labels[tab]}`} gradient={gradients[tab]} onClose={() => setShowModal(false)}/>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {tab === 1 && (
                <FormField label="Product Group" required error={errors.product_group_id}>
                  <Select value={form.product_group_id ?? ""} onChange={e => setF("product_group_id", e.target.value)} error={errors.product_group_id}>
                    <option value="">— Select Group —</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </FormField>
              )}
              {tab === 2 && (
                <>
                  <FormField label="Product Group">
                    <Select value={form._pg ?? ""} onChange={e => { setF("_pg", e.target.value); setF("sub_group_id", ""); }}>
                      <option value="">— Select Group —</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Sub Group" required error={errors.sub_group_id}>
                    <Select value={form.sub_group_id ?? ""} onChange={e => setF("sub_group_id", e.target.value)} error={errors.sub_group_id}>
                      <option value="">— Select Sub Group —</option>
                      {filteredSubGroups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </FormField>
                </>
              )}
              {tab === 3 && (
                <>
                  <FormField label="Sub Group">
                    <Select value={form._sg ?? ""} onChange={e => { setF("_sg", e.target.value); setF("category_id", ""); }}>
                      <option value="">— Select Sub Group —</option>
                      {subGroups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Category" required error={errors.category_id}>
                    <Select value={form.category_id ?? ""} onChange={e => setF("category_id", e.target.value)} error={errors.category_id}>
                      <option value="">— Select Category —</option>
                      {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </FormField>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Name" required error={errors.name}>
                  <Input value={form.name ?? ""} onChange={e => setF("name", e.target.value)} placeholder={`e.g. Electronics`} error={errors.name}/>
                </FormField>
                <FormField label="Code" required error={errors.code}>
                  <Input value={form.code ?? ""} onChange={e => setF("code", e.target.value.toUpperCase())} placeholder="e.g. ELEC" error={errors.code}/>
                </FormField>
              </div>
              <FormField label="Description">
                <textarea value={form.description ?? ""} onChange={e => setF("description", e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Optional description..."/>
              </FormField>
              <Toggle value={!!form.is_active} onChange={v => setF("is_active", v)} label="Active Status" hint="Inactive records are hidden from dropdowns"/>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <SaveButton saving={saving} editId={editId}/>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog item={confirm} label={labels[tab]} onConfirm={handleDelete} onCancel={() => setConfirm(null)} deleting={deleting}/>
    </div>
  );
}

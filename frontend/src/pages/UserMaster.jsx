import { useState, useEffect } from "react";
import { userAPI, groupAPI } from "../services/api";

const EMPTY_FORM = {
  username: "", email: "", password: "",
  full_name: "", group_id: "", is_active: true,
};

const EMPTY_PWD = { new_password: "", confirm_password: "" };

export default function UserMaster() {
  const [users, setUsers]       = useState([]);
  const [groups, setGroups]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(null); // user object
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [pwd, setPwd]           = useState(EMPTY_PWD);
  const [errors, setErrors]     = useState({});
  const [pwdErrors, setPwdErrors] = useState({});
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await userAPI.getAll();
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      showToast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data } = await groupAPI.getAll();
      setGroups(data.groups.filter(g => g.is_active));
    } catch { /* silent */ }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setForm({
      username:  u.username,
      email:     u.email,
      full_name: u.full_name || "",
      group_id:  u.group_id ?? "",
      is_active: u.is_active,
      password:  "",   // password not shown in edit mode
    });
    setErrors({});
    setEditId(u.id);
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim())              e.username  = "Username is required.";
    else if (form.username.trim().length < 3) e.username = "Min 3 characters.";
    if (!form.email.trim())                 e.email     = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address.";
    if (!editId) {
      if (!form.password)                   e.password  = "Password is required.";
      else if (form.password.length < 6)    e.password  = "Min 6 characters.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editId) {
        const payload = {
          username:  form.username,
          email:     form.email,
          full_name: form.full_name || null,
          group_id:  form.group_id || null,
          is_active: form.is_active,
        };
        await userAPI.update(editId, payload);
        showToast("User updated successfully!");
      } else {
        const payload = {
          ...form,
          full_name: form.full_name || null,
          group_id:  form.group_id  || null,
        };
        await userAPI.create(payload);
        showToast("User created successfully!");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const validatePwd = () => {
    const e = {};
    if (!pwd.new_password)               e.new_password     = "Password is required.";
    else if (pwd.new_password.length < 6) e.new_password    = "Min 6 characters.";
    if (pwd.new_password !== pwd.confirm_password) e.confirm_password = "Passwords do not match.";
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async (ev) => {
    ev.preventDefault();
    if (!validatePwd()) return;
    setSaving(true);
    try {
      await userAPI.changePassword(showPwdModal.id, pwd.new_password);
      showToast("Password changed successfully!");
      setShowPwdModal(null);
      setPwd(EMPTY_PWD);
    } catch (err) {
      showToast(err.response?.data?.detail || "Password change failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await userAPI.delete(id);
      showToast("User deleted successfully!");
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || "Delete failed.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = users.filter(u => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  // ── Avatar initials helper ──────────────────────────────────────────────
  const initials = (u) =>
    (u.full_name || u.username || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const avatarColor = (u) => {
    const colors = [
      "from-blue-500 to-indigo-500",
      "from-purple-500 to-pink-500",
      "from-green-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-yellow-500 to-orange-500",
      "from-teal-500 to-cyan-500",
    ];
    return colors[u.id % colors.length];
  };

  // ── Input helper ────────────────────────────────────────────────────────
  const Field = ({ label, name, type = "text", placeholder, required, hint }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        autoComplete={type === "password" ? "new-password" : "off"}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500
          ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
      />
      {hint && !errors[name] && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2
          ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error"
            ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Master</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system users and their group assignments</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5
            rounded-lg text-sm font-semibold shadow transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          New User
        </button>
      </div>

      {/* Stats + Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-xs text-gray-500">Total Users</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{activeCount}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{inactiveCount}</div>
            <div className="text-xs text-gray-500">Inactive</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {search ? "No users match your search." : "No users found. Create one!"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Username</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Group</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(u)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                          {initials(u)}
                        </div>
                        <span className="font-medium text-gray-800">{u.full_name || <span className="text-gray-400 italic">—</span>}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {u.username}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      {u.group_name
                        ? <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">{u.group_name}</span>
                        : <span className="text-gray-400 text-xs">No group</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${u.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-400"}`}/>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        {/* Change Password */}
                        <button onClick={() => { setShowPwdModal(u); setPwd(EMPTY_PWD); setPwdErrors({}); }}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Change Password">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        <button onClick={() => setConfirmDelete(u)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-semibold text-lg">
                {editId ? "Edit User" : "Create New User"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Username & Full Name */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Username" name="username" placeholder="e.g. jdoe" required
                  hint="Min 3 characters" />
                <Field label="Full Name" name="full_name" placeholder="e.g. John Doe" />
              </div>

              {/* Email */}
              <Field label="Email" name="email" type="email" placeholder="e.g. jdoe@example.com" required />

              {/* Password — only on create */}
              {!editId && (
                <Field label="Password" name="password" type="password"
                  placeholder="Min 6 characters" required hint="Min 6 characters" />
              )}

              {/* Group */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Group
                </label>
                <select value={form.group_id} onChange={e => setForm({ ...form, group_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">— No Group —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.group_name} ({g.group_code})</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Active Status</p>
                  <p className="text-xs text-gray-500">Inactive users cannot log in</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none
                    ${form.is_active ? "bg-purple-600" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${form.is_active ? "translate-x-6" : "translate-x-0"}`}/>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700
                    hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold
                    transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  {saving ? "Saving..." : editId ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-semibold text-lg">Change Password</h2>
                <p className="text-white/80 text-xs mt-0.5">@{showPwdModal.username}</p>
              </div>
              <button onClick={() => setShowPwdModal(null)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input type="password" value={pwd.new_password}
                  onChange={e => setPwd({ ...pwd, new_password: e.target.value })}
                  placeholder="Min 6 characters" autoComplete="new-password"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500
                    ${pwdErrors.new_password ? "border-red-400 bg-red-50" : "border-gray-300"}`}/>
                {pwdErrors.new_password && <p className="text-red-500 text-xs mt-1">{pwdErrors.new_password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input type="password" value={pwd.confirm_password}
                  onChange={e => setPwd({ ...pwd, confirm_password: e.target.value })}
                  placeholder="Re-enter new password" autoComplete="new-password"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500
                    ${pwdErrors.confirm_password ? "border-red-400 bg-red-50" : "border-gray-300"}`}/>
                {pwdErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{pwdErrors.confirm_password}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPwdModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold
                    transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  {saving ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-700">"{confirmDelete.full_name || confirmDelete.username}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold
                  transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting === confirmDelete.id && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

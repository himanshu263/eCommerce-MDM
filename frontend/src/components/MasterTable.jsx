/**
 * Reusable master table component.
 * Props: title, columns, rows, total, loading, onAdd, onEdit, onDelete,
 *        search, onSearch, toast
 */
import { useState } from "react";

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2
      ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
      {toast.type === "error"
        ? <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
        : <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
      }
      {toast.msg}
    </div>
  );
}

export function ConfirmDialog({ item, label, onConfirm, onCancel, deleting }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">Delete {label}?</h3>
        <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-400"}`}/>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center h-48 text-gray-400">
      <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      {text}
    </div>
  );
}

export function ModalHeader({ title, gradient = "from-indigo-600 to-blue-600", onClose }) {
  return (
    <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center justify-between`}>
      <h2 className="text-white font-semibold text-lg">{title}</h2>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

export function FormField({ label, error, children, required }) {
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

export function Input({ value, onChange, placeholder, type = "text", error, className = "", ...rest }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${error ? "border-red-400 bg-red-50" : "border-gray-300"} ${className}`}
      {...rest}
    />
  );
}

export function Select({ value, onChange, children, error }) {
  return (
    <select value={value} onChange={onChange}
      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${error ? "border-red-400 bg-red-50" : "border-gray-300"}`}>
      {children}
    </select>
  );
}

export function Toggle({ value, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${value ? "bg-indigo-600" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : ""}`}/>
      </button>
    </div>
  );
}

export function SaveButton({ saving, editId }) {
  return (
    <button type="submit" disabled={saving}
      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold
        transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
      {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
      {saving ? "Saving..." : editId ? "Update" : "Create"}
    </button>
  );
}

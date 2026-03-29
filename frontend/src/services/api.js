import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (username, password) => api.post("/api/auth/login", { username, password }),
  me: () => api.get("/api/auth/me"),
  logout: () => { localStorage.removeItem("access_token"); localStorage.removeItem("user"); },
};

export const groupAPI = {
  getAll: () => api.get("/api/groups/"), getById: (id) => api.get(`/api/groups/${id}`),
  create: (d) => api.post("/api/groups/", d), update: (id, d) => api.put(`/api/groups/${id}`, d),
  delete: (id) => api.delete(`/api/groups/${id}`),
};

export const userAPI = {
  getAll: () => api.get("/api/users/"), getById: (id) => api.get(`/api/users/${id}`),
  create: (d) => api.post("/api/users/", d), update: (id, d) => api.put(`/api/users/${id}`, d),
  changePassword: (id, p) => api.patch(`/api/users/${id}/password`, { new_password: p }),
  delete: (id) => api.delete(`/api/users/${id}`),
};

// ─── MDM Helpers ─────────────────────────────────────────────────────────────
const mdm = (path) => ({
  getAll:  (params) => api.get(`/api/mdm/${path}/`, { params }),
  getById: (id)     => api.get(`/api/mdm/${path}/${id}`),
  create:  (d)      => api.post(`/api/mdm/${path}/`, d),
  update:  (id, d)  => api.put(`/api/mdm/${path}/${id}`, d),
  delete:  (id)     => api.delete(`/api/mdm/${path}/${id}`),
});

export const productGroupAPI  = mdm("product-groups");
export const subGroupAPI      = mdm("sub-groups");
export const categoryAPI      = mdm("categories");
export const subCategoryAPI   = mdm("sub-categories");
export const brandAPI         = mdm("brands");
export const manufacturerAPI  = mdm("manufacturers");
export const supplierAPI      = mdm("suppliers");
export const sizeAPI          = mdm("sizes");
export const colorAPI         = mdm("colors");
export const weightUnitAPI    = mdm("weight-units");
export const unitAPI          = mdm("units");
export const materialAPI      = mdm("materials");
export const patternAPI       = mdm("patterns");
export const styleAPI         = mdm("styles");
export const productTypeAPI   = mdm("product-types");
export const hsnAPI           = mdm("hsn");
export const gstAPI           = mdm("gst-rates");
export const warehouseAPI     = mdm("warehouses");
export const stockStatusAPI   = mdm("stock-statuses");
export const deliveryTypeAPI  = mdm("delivery-types");
export const returnPolicyAPI  = mdm("return-policies");
export const warrantyAPI      = mdm("warranties");
export const sellerAPI        = mdm("sellers");
export const altSkuAPI        = mdm("alt-skus");

export const itemAPI = {
  getAll:       (params) => api.get("/api/items/", { params }),
  getById:      (id)     => api.get(`/api/items/${id}`),
  create:       (d)      => api.post("/api/items/", d),
  update:       (id, d)  => api.put(`/api/items/${id}`, d),
  delete:       (id)     => api.delete(`/api/items/${id}`),
  generateSKU:  (p)      => api.get("/api/items/generate-sku", { params: p }),
  bulkUpload:   (file)   => {
    const fd = new FormData(); fd.append("file", file);
    return api.post("/api/items/bulk-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

export const uploadImage = (file) => {
  const fd = new FormData(); fd.append("file", file);
  return api.post("/api/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
};

export default api;

// ─── Company Settings ─────────────────────────────────────────────────────────
export const companyAPI = {
  getSettings:    ()      => api.get("/api/company/settings"),
  updateSettings: (data)  => api.put("/api/company/settings", data),
  uploadLogo:     (file)  => { const fd=new FormData(); fd.append("file",file); return api.post("/api/company/settings/logo", fd, {headers:{"Content-Type":"multipart/form-data"}}); },
};

// ─── Marketplace ───────────────────────────────────────────────────────────────
export const marketplaceAPI = {
  getCredentials:  ()          => api.get("/api/marketplace/credentials"),
  getCredential:   (id)        => api.get(`/api/marketplace/credentials/${id}`),
  createCredential:(data)      => api.post("/api/marketplace/credentials", data),
  updateCredential:(id, data)  => api.put(`/api/marketplace/credentials/${id}`, data),
  deleteCredential:(id)        => api.delete(`/api/marketplace/credentials/${id}`),
  testConnection:  (id)        => api.post(`/api/marketplace/credentials/${id}/test`),
  fetchProducts:   (data)      => api.post("/api/marketplace/fetch", data),
};

export const todoAPI = {
  getAll: (params) => api.get("/api/todos/", { params }),
  getById: (id) => api.get(`/api/todos/${id}`),
  create: (d) => api.post("/api/todos/", d),
  update: (id, d) => api.put(`/api/todos/${id}`, d),
  delete: (id) => api.delete(`/api/todos/${id}`),
};

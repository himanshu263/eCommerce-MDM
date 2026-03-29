import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GroupMaster from "./pages/GroupMaster";
import UserMaster from "./pages/UserMaster";
import TodoApp from "./pages/TodoApp";

// MDM
import HierarchyMaster from "./pages/mdm/HierarchyMaster";
import SimpleMaster    from "./pages/mdm/SimpleMaster";

// Catalog
import ItemMaster from "./pages/catalog/ItemMaster";


// Settings & Marketplace
import CompanySettings from "./pages/settings/CompanySettings";
import MarketplaceFetch from "./pages/marketplace/MarketplaceFetch";

// API objects
import {
  brandAPI, supplierAPI, sellerAPI, manufacturerAPI,
  colorAPI, sizeAPI, materialAPI, patternAPI, styleAPI,
  unitAPI, weightUnitAPI, productTypeAPI,
  hsnAPI, gstAPI, warehouseAPI, stockStatusAPI,
  deliveryTypeAPI, returnPolicyAPI, warrantyAPI, altSkuAPI,
} from "./services/api";

// ─── Attribute Master configs ─────────────────────────────────────────────────
const brandConfig = {
  title:"Brand Master", subtitle:"Manage product brands", accentColor:"indigo", api: brandAPI,
  columns:[{key:"code",label:"Code",render:v=><span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},{key:"name",label:"Name"},{key:"country",label:"Country"}],
  formFields:[
    {key:"name",label:"Brand Name",required:true,placeholder:"e.g. Samsung"},
    {key:"code",label:"Code",required:true,placeholder:"e.g. SAMSUNG",uppercase:true},
    {key:"description",label:"Description",type:"textarea"},
    {key:"website",label:"Website",placeholder:"https://..."},
    {key:"country",label:"Country",placeholder:"e.g. South Korea"},
    {key:"is_active",label:"Active",type:"toggle"},
  ],
  emptyForm:{name:"",code:"",description:"",website:"",country:"",is_active:true},
};

const supplierConfig = {
  title:"Supplier Master", subtitle:"Manage product suppliers", accentColor:"emerald", api: supplierAPI,
  columns:[{key:"code",label:"Code",render:v=><span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},{key:"name",label:"Name"},{key:"contact_name",label:"Contact"},{key:"email",label:"Email"},{key:"gst_number",label:"GST No."}],
  formFields:[
    {key:"name",label:"Supplier Name",required:true},{key:"code",label:"Code",required:true,uppercase:true},
    {key:"contact_name",label:"Contact Name"},{key:"email",label:"Email",type:"email"},{key:"phone",label:"Phone"},
    {key:"gst_number",label:"GST Number",placeholder:"e.g. 27AABCU9603R1ZM"},{key:"address",label:"Address",type:"textarea"},{key:"is_active",label:"Active",type:"toggle"},
  ],
  emptyForm:{name:"",code:"",contact_name:"",email:"",phone:"",gst_number:"",address:"",is_active:true},
};

const sellerConfig = {
  title:"Seller Master", subtitle:"Manage marketplace sellers / vendors", accentColor:"violet", api: sellerAPI,
  columns:[{key:"code",label:"Code",render:v=><span className="font-mono bg-violet-50 text-violet-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"rating",label:"Rating"}],
  formFields:[
    {key:"name",label:"Seller Name",required:true},{key:"code",label:"Code",required:true,uppercase:true},
    {key:"email",label:"Email",type:"email"},{key:"phone",label:"Phone"},{key:"gst_number",label:"GST Number"},
    {key:"address",label:"Address",type:"textarea"},{key:"rating",label:"Rating (0-5)",type:"number"},{key:"is_active",label:"Active",type:"toggle"},
  ],
  emptyForm:{name:"",code:"",email:"",phone:"",gst_number:"",address:"",rating:"",is_active:true},
};

const simpleConfig = (title, subtitle, api, accentColor="sky", extraFields=[]) => ({
  title, subtitle, accentColor, api,
  columns:[
    {key:"code",label:"Code",render:(v)=><span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},
    {key:"name",label:"Name"},
    ...extraFields.filter(f=>f.inTable).map(f=>({key:f.key,label:f.label})),
  ],
  formFields:[
    {key:"name",label:"Name",required:true},{key:"code",label:"Code",required:true,uppercase:true},
    {key:"description",label:"Description",type:"textarea"},
    ...extraFields,
    {key:"is_active",label:"Active",type:"toggle"},
  ],
  emptyForm:{name:"",code:"",description:"",...Object.fromEntries(extraFields.map(f=>[f.key,f.default??""])),...{is_active:true}},
});

const hsnConfig = {
  title:"HSN / Tax Code", subtitle:"Harmonised System Nomenclature codes", accentColor:"orange", api: hsnAPI,
  columns:[{key:"hsn_code",label:"HSN Code",render:v=><span className="font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},{key:"description",label:"Description"},{key:"gst_rate",label:"GST %"}],
  formFields:[{key:"hsn_code",label:"HSN Code",required:true},{key:"description",label:"Description",type:"textarea"},{key:"gst_rate",label:"Default GST Rate (%)",type:"number"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{hsn_code:"",description:"",gst_rate:"",is_active:true},
};

const gstConfig = {
  title:"GST Rate Master", subtitle:"Tax rate slabs", accentColor:"orange", api: gstAPI,
  columns:[{key:"name",label:"Name"},{key:"rate",label:"Rate %"},{key:"cgst",label:"CGST"},{key:"sgst",label:"SGST"},{key:"igst",label:"IGST"}],
  formFields:[{key:"name",label:"Name",required:true,placeholder:"e.g. GST 18%"},{key:"rate",label:"Rate %",required:true,type:"number"},{key:"cgst",label:"CGST %",type:"number"},{key:"sgst",label:"SGST %",type:"number"},{key:"igst",label:"IGST %",type:"number"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{name:"",rate:"",cgst:"",sgst:"",igst:"",is_active:true},
};

const warehouseConfig = {
  title:"Warehouse Master", subtitle:"Inventory storage locations", accentColor:"sky", api: warehouseAPI,
  columns:[{key:"code",label:"Code",render:v=><span className="font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},{key:"name",label:"Name"},{key:"city",label:"City"},{key:"state",label:"State"},{key:"pincode",label:"Pincode"}],
  formFields:[{key:"name",label:"Name",required:true},{key:"code",label:"Code",required:true,uppercase:true},{key:"city",label:"City"},{key:"state",label:"State"},{key:"pincode",label:"Pincode"},{key:"address",label:"Address",type:"textarea"},{key:"contact",label:"Contact"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{name:"",code:"",city:"",state:"",pincode:"",address:"",contact:"",is_active:true},
};

const deliveryConfig = {
  title:"Delivery Type Master", subtitle:"Shipping methods and ETAs", accentColor:"sky", api: deliveryTypeAPI,
  columns:[{key:"code",label:"Code"},{key:"name",label:"Name"},{key:"eta_days",label:"ETA (days)"},{key:"charges",label:"Charges (₹)"}],
  formFields:[{key:"name",label:"Name",required:true,placeholder:"e.g. Express Delivery"},{key:"code",label:"Code",required:true,uppercase:true},{key:"description",label:"Description",type:"textarea"},{key:"charges",label:"Delivery Charges (₹)",type:"number"},{key:"eta_days",label:"ETA Days",type:"number"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{name:"",code:"",description:"",charges:"",eta_days:"",is_active:true},
};

const returnConfig = {
  title:"Return Policy Master", subtitle:"Return and refund policies", accentColor:"rose", api: returnPolicyAPI,
  columns:[{key:"name",label:"Policy Name"},{key:"return_days",label:"Return Days"},{key:"is_returnable",label:"Returnable",render:v=><span className={`text-xs font-semibold ${v?"text-green-600":"text-red-500"}`}>{v?"Yes":"No"}</span>}],
  formFields:[{key:"name",label:"Policy Name",required:true},{key:"code",label:"Code",required:true,uppercase:true},{key:"return_days",label:"Return Window (days)",type:"number"},{key:"policy_details",label:"Policy Details",type:"textarea"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{name:"",code:"",return_days:"",policy_details:"",is_active:true},
};

const warrantyConfig = {
  title:"Warranty Master", subtitle:"Product warranty types and durations", accentColor:"sky", api: warrantyAPI,
  columns:[{key:"name",label:"Name"},{key:"duration_months",label:"Duration (months)"},{key:"warranty_type",label:"Type"}],
  formFields:[{key:"name",label:"Warranty Name",required:true},{key:"code",label:"Code",required:true,uppercase:true},{key:"duration_months",label:"Duration (months)",type:"number"},{key:"warranty_type",label:"Warranty Type",placeholder:"e.g. Manufacturer"},{key:"description",label:"Description",type:"textarea"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{name:"",code:"",duration_months:"",warranty_type:"",description:"",is_active:true},
};

const altSkuConfig = {
  title:"Alt SKU Master", subtitle:"Alternate SKUs — Amazon ASIN, Flipkart, Barcodes", accentColor:"indigo", api: altSkuAPI,
  columns:[{key:"sku_code",label:"SKU Code",render:v=><span className="font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-semibold">{v}</span>},{key:"sku_type",label:"Type"},{key:"source",label:"Source / Marketplace"}],
  formFields:[{key:"sku_code",label:"SKU Code",required:true,placeholder:"e.g. B0C7XYZMN1"},{key:"sku_type",label:"Type",placeholder:"e.g. ASIN, Barcode, Flipkart"},{key:"source",label:"Source / Marketplace",placeholder:"e.g. Amazon, Flipkart"},{key:"is_active",label:"Active",type:"toggle"}],
  emptyForm:{sku_code:"",sku_type:"",source:"",is_active:true},
};

// ─── MDM Variants page (Color + Size tabs) ───────────────────────────────────
import { useState } from "react";
function VariantsMaster() {
  const [tab, setTab] = useState(0);
  const configs = [
    simpleConfig("Color Master","Product colors",colorAPI,"violet",[{key:"hex_code",label:"Hex Color Code",placeholder:"#FF5733",inTable:true}]),
    simpleConfig("Size Master","Product sizes & measurements",sizeAPI,"violet",[{key:"size_type",label:"Size Type",placeholder:"e.g. Apparel / Footwear",inTable:true}]),
  ];
  return (
    <div>
      <div className="flex gap-2 p-6 pb-0">
        {["Colors","Sizes"].map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===i?"bg-violet-600 text-white shadow":"bg-white border border-gray-200 text-gray-600 hover:border-violet-300"}`}>
            {t}
          </button>
        ))}
      </div>
      <SimpleMaster key={tab} {...configs[tab]}/>
    </div>
  );
}

// ─── MDM More Attributes page (Material, Pattern, Style, Unit, Weight, ProductType) ─
function MoreAttrsMaster() {
  const [tab, setTab] = useState(0);
  const tabs = ["Material","Pattern","Style","Unit","Weight Unit","Product Type"];
  const configs = [
    simpleConfig("Material Master","Fabric & material types",materialAPI,"sky"),
    simpleConfig("Pattern Master","Print & pattern types",patternAPI,"sky"),
    simpleConfig("Style Master","Product style classifications",styleAPI,"sky"),
    simpleConfig("Unit Master","Measurement units (kg, g, litre...)",unitAPI,"sky",[{key:"unit_type",label:"Unit Type",placeholder:"e.g. Weight / Volume / Count",inTable:true}]),
    simpleConfig("Weight Unit Master","Weight measurement units",weightUnitAPI,"sky"),
    simpleConfig("Product Type Master","Product type classifications",productTypeAPI,"sky"),
  ];
  return (
    <div>
      <div className="flex gap-2 flex-wrap p-6 pb-0">
        {tabs.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab===i?"bg-sky-600 text-white shadow":"bg-white border border-gray-200 text-gray-600 hover:border-sky-300"}`}>
            {t}
          </button>
        ))}
      </div>
      <SimpleMaster key={tab} {...configs[tab]}/>
    </div>
  );
}

// ─── Tax page (HSN + GST tabs) ────────────────────────────────────────────────
function TaxMaster() {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div className="flex gap-2 p-6 pb-0">
        {["HSN / Tax Codes","GST Rates"].map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===i?"bg-orange-500 text-white shadow":"bg-white border border-gray-200 text-gray-600 hover:border-orange-300"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab===0 ? <SimpleMaster key="hsn" {...hsnConfig}/> : <SimpleMaster key="gst" {...gstConfig}/>}
    </div>
  );
}

// ─── Logistics page (Delivery + Return + Warranty) ────────────────────────────
function LogisticsMaster() {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div className="flex gap-2 flex-wrap p-6 pb-0">
        {["Delivery Types","Return Policies","Warranties","Stock Status"].map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab===i?"bg-sky-600 text-white shadow":"bg-white border border-gray-200 text-gray-600 hover:border-sky-300"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab===0 && <SimpleMaster key="dlv" {...deliveryConfig}/>}
      {tab===1 && <SimpleMaster key="ret" {...returnConfig}/>}
      {tab===2 && <SimpleMaster key="war" {...warrantyConfig}/>}
      {tab===3 && <SimpleMaster key="sts" {...simpleConfig("Stock Status","Inventory stock statuses",stockStatusAPI,"sky")}/>}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace/>}/>
            <Route path="dashboard"      element={<Dashboard/>}/>
            <Route path="groups"         element={<GroupMaster/>}/>
            <Route path="users"          element={<UserMaster/>}/>
            <Route path="todos"          element={<TodoApp/>}/>

            {/* MDM Hierarchy */}
            <Route path="mdm/hierarchy"  element={<HierarchyMaster/>}/>

            {/* MDM Attributes */}
            <Route path="mdm/brands"     element={<SimpleMaster {...brandConfig}/>}/>
            <Route path="mdm/suppliers"  element={<SimpleMaster {...supplierConfig}/>}/>
            <Route path="mdm/sellers"    element={<SimpleMaster {...sellerConfig}/>}/>
            <Route path="mdm/variants"   element={<VariantsMaster/>}/>
            <Route path="mdm/more"       element={<MoreAttrsMaster/>}/>

            {/* MDM Commerce */}
            <Route path="mdm/tax"        element={<TaxMaster/>}/>
            <Route path="mdm/warehouse"  element={<SimpleMaster {...warehouseConfig}/>}/>
            <Route path="mdm/logistics"  element={<LogisticsMaster/>}/>
            <Route path="mdm/alt-skus"   element={<SimpleMaster {...altSkuConfig}/>}/>

            {/* Catalog */}
            <Route path="catalog/items"  element={<ItemMaster/>}/>

            {/* Settings */}
            <Route path="settings/company"    element={<CompanySettings/>}/>

            {/* Marketplace */}
            <Route path="marketplace/fetch"   element={<MarketplaceFetch/>}/>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

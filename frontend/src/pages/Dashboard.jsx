import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MODULES = [
  {
    section: "System Administration",
    color: "blue",
    items: [
      { title:"Group Master",  desc:"User permission groups",  path:"/groups",  badge:"Phase 1", active:true,  icon:"👥", bg:"bg-blue-50",   textColor:"text-blue-600" },
      { title:"User Master",   desc:"System users & accounts", path:"/users",   badge:"Phase 2", active:true,  icon:"👤", bg:"bg-purple-50", textColor:"text-purple-600" },
    ]
  },
  {
    section: "Product Hierarchy (MDM)",
    color: "indigo",
    items: [
      { title:"Product Hierarchy", desc:"Group → SubGroup → Category → SubCategory", path:"/mdm/hierarchy", badge:"Phase 3", active:true, icon:"🗂️", bg:"bg-indigo-50", textColor:"text-indigo-600" },
    ]
  },
  {
    section: "Attribute Masters",
    color: "violet",
    items: [
      { title:"Brand Master",    desc:"Product brands",         path:"/mdm/brands",    badge:"Phase 3", active:true, icon:"🏷️", bg:"bg-indigo-50",  textColor:"text-indigo-600" },
      { title:"Supplier Master", desc:"Product suppliers",      path:"/mdm/suppliers", badge:"Phase 3", active:true, icon:"🏭", bg:"bg-emerald-50", textColor:"text-emerald-600" },
      { title:"Seller Master",   desc:"Marketplace sellers",    path:"/mdm/sellers",   badge:"Phase 3", active:true, icon:"🛒", bg:"bg-violet-50",  textColor:"text-violet-600" },
      { title:"Colors & Sizes",  desc:"Variants & dimensions",  path:"/mdm/variants",  badge:"Phase 3", active:true, icon:"🎨", bg:"bg-pink-50",    textColor:"text-pink-600" },
      { title:"More Attributes", desc:"Material, Pattern, Style, Unit...", path:"/mdm/more", badge:"Phase 3", active:true, icon:"⚙️", bg:"bg-sky-50", textColor:"text-sky-600" },
    ]
  },
  {
    section: "Commerce Masters",
    color: "orange",
    items: [
      { title:"Tax & HSN",       desc:"HSN codes & GST rates",  path:"/mdm/tax",       badge:"Phase 3", active:true, icon:"🧾", bg:"bg-orange-50",textColor:"text-orange-600" },
      { title:"Warehouse",       desc:"Storage locations",       path:"/mdm/warehouse", badge:"Phase 3", active:true, icon:"🏬", bg:"bg-sky-50",   textColor:"text-sky-600" },
      { title:"Logistics",       desc:"Delivery, Returns, Warranty", path:"/mdm/logistics",badge:"Phase 3", active:true, icon:"🚚", bg:"bg-teal-50",textColor:"text-teal-600" },
      { title:"Alt SKUs",        desc:"Alternate SKU codes",     path:"/mdm/alt-skus",  badge:"Phase 3", active:true, icon:"🔖", bg:"bg-amber-50", textColor:"text-amber-600" },
    ]
  },
  {
    section: "Product Catalog",
    color: "green",
    items: [
      { title:"Item Master", desc:"Full Amazon-style product cards with images, pricing, variants", path:"/catalog/items", badge:"Phase 3", active:true, icon:"📦", bg:"bg-green-50", textColor:"text-green-600", highlight:true },
    ]
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Good day, {user?.full_name || user?.username}! 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">eCommerce Master Data Management System — Phase 3 Complete</p>
      </div>

      {/* Phase progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Development Progress</p>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Phase 3 / 4</span>
        </div>
        <div className="flex gap-2">
          {[["Phase 1","Login & Groups","bg-blue-500"],["Phase 2","User Master","bg-purple-500"],["Phase 3","MDM + Catalog","bg-indigo-500"],["Phase 4","Reports & Audit","bg-gray-200 text-gray-400"]].map(([p,d,c])=>(
            <div key={p} className="flex-1">
              <div className={`h-2 rounded-full ${c} mb-1`}/>
              <p className="text-xs font-semibold text-gray-600">{p}</p>
              <p className="text-xs text-gray-400">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module sections */}
      {MODULES.map(section => (
        <div key={section.section} className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">{section.section}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.items.map(item => (
              <div key={item.title}
                onClick={() => item.active && navigate(item.path)}
                className={`bg-white border rounded-2xl shadow-sm p-5 transition-all
                  ${item.active ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 border-gray-100" : "opacity-50 cursor-not-allowed border-gray-100"}
                  ${item.highlight ? "ring-2 ring-indigo-200 border-indigo-100" : ""}`}>
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-3 text-2xl`}>
                  {item.icon}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{item.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0
                    ${item.active ? `${item.bg} ${item.textColor}` : "bg-gray-100 text-gray-400"}`}>
                    {item.badge}
                  </span>
                </div>
                {item.active && (
                  <div className={`mt-3 flex items-center ${item.textColor} text-xs font-semibold gap-1`}>
                    Open <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

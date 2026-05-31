import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, UserPlus, Building2, Route, Droplets,
  GitBranch, FolderOpen, ChevronRight, Plus, Search,
  Edit2, Trash2, X, Check, AlertCircle, Activity,
  MapPin, Phone, Zap, ArrowRight, Network, Layers,
  Upload, Download, Menu, ChevronDown, ChevronUp,
  Heart, Crosshair, Navigation, Database, RefreshCw,
  Clock, CheckCircle, XCircle, Filter, Eye, Save
} from "lucide-react";

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const INITIAL_NODES = [
  { id: 0, name: "Jeevan Dhara Blood Bank", type: "bloodbank", bloodGroup: "A+", stock: 50, demand: 0, alive: true },
  { id: 1, name: "Raktdaan Seva Kendra",    type: "bloodbank", bloodGroup: "B+", stock: 30, demand: 0, alive: true },
  { id: 2, name: "Sanjeevani Blood Bank",   type: "bloodbank", bloodGroup: "O+", stock: 40, demand: 0, alive: true },
  { id: 3, name: "Jeevan Jyoti Blood Bank", type: "bloodbank", bloodGroup: "AB+",stock: 20, demand: 0, alive: true },
  { id: 4, name: "Apollo Hospitals Noida",  type: "hospital",  bloodGroup: "A+", stock: 0,  demand: 15, alive: true },
  { id: 5, name: "Fortis Hospital Noida",   type: "hospital",  bloodGroup: "B+", stock: 0,  demand: 10, alive: true },
  { id: 6, name: "Max Hospital",            type: "hospital",  bloodGroup: "O+", stock: 0,  demand: 20, alive: true },
  { id: 7, name: "Yatharth Super Speciality Hospital", type: "hospital", bloodGroup: "AB+", stock: 0, demand: 8, alive: true },
  { id: 8, name: "Jaypee Hospital",         type: "hospital",  bloodGroup: "A+", stock: 0,  demand: 12, alive: true },
];

const INITIAL_EDGES = [
  { u: 0, v: 4, dist: 8 },
  { u: 0, v: 5, dist: 12 },
  { u: 1, v: 5, dist: 6 },
  { u: 1, v: 7, dist: 14 },
  { u: 2, v: 6, dist: 10 },
  { u: 2, v: 8, dist: 7 },
  { u: 3, v: 7, dist: 9 },
  { u: 3, v: 6, dist: 15 },
  { u: 0, v: 8, dist: 11 },
  { u: 1, v: 4, dist: 16 },
];

const INITIAL_DONORS = [
  { id: 1, name: "Harsh",  bloodGroup: "A+", age: 28, units: 5, phone: "9876543210", city: "Jamshedpur" },
  { id: 3, name: "Priya",  bloodGroup: "B+", age: 24, units: 4, phone: "9876543212", city: "Dhanbad" },
  { id: 4, name: "Arjun",  bloodGroup: "O+", age: 32, units: 6, phone: "9876543213", city: "Jamshedpur" },
  { id: 6, name: "Vikram", bloodGroup: "AB+",age: 35, units: 3, phone: "9876543215", city: "Patna" },
  { id: 8, name: "Ravi",   bloodGroup: "O-", age: 27, units: 5, phone: "9876543217", city: "Jamshedpur" },
  { id: 10,name: "Suresh", bloodGroup: "A-", age: 30, units: 3, phone: "9876543219", city: "Bokaro" },
];

const INITIAL_PATIENTS = [
  { id: 2, name: "Rahul",  bloodGroup: "O+", units: 3, phone: "9876543211", city: "Ranchi",  hospital: "Max Hospital",             status: "Waiting" },
  { id: 5, name: "Sneha",  bloodGroup: "A+", units: 2, phone: "9876543214", city: "Bokaro",  hospital: "Apollo Hospitals Noida",    status: "Allocated" },
  { id: 7, name: "Ananya", bloodGroup: "B+", units: 4, phone: "9876543216", city: "Ranchi",  hospital: "Fortis Hospital Noida",     status: "Waiting" },
  { id: 9, name: "Meena",  bloodGroup: "AB+",units: 1, phone: "9876543218", city: "Dhanbad", hospital: "Yatharth Super Speciality Hospital", status: "Waiting" },
];

const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

// ─── DIJKSTRA ─────────────────────────────────────────────────────────────────
function dijkstra(nodes, edges, srcId, dstId) {
  const alive = new Set(nodes.filter(n => n.alive).map(n => n.id));
  const adj = {};
  alive.forEach(id => { adj[id] = []; });
  edges.forEach(({ u, v, dist }) => {
    if (alive.has(u) && alive.has(v)) {
      adj[u].push({ to: v, w: dist });
      adj[v].push({ to: u, w: dist });
    }
  });
  const dist = {};
  const prev = {};
  alive.forEach(id => { dist[id] = Infinity; prev[id] = -1; });
  dist[srcId] = 0;
  const visited = new Set();
  const pq = [[0, srcId]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    (adj[u] || []).forEach(({ to, w }) => {
      if (!visited.has(to) && d + w < dist[to]) {
        dist[to] = d + w;
        prev[to] = u;
        pq.push([dist[to], to]);
      }
    });
  }
  if (dist[dstId] === Infinity) return null;
  const path = [];
  for (let v = dstId; v !== -1; v = prev[v]) path.unshift(v);
  return { path, total: dist[dstId] };
}

// ─── DSU ZONES ────────────────────────────────────────────────────────────────
function computeZones(nodes, edges) {
  const par = {};
  nodes.filter(n => n.alive).forEach(n => { par[n.id] = n.id; });
  const find = x => { if (par[x] !== x) par[x] = find(par[x]); return par[x]; };
  const unite = (a, b) => { par[find(a)] = find(b); };
  edges.forEach(({ u, v }) => {
    if (par[u] !== undefined && par[v] !== undefined) unite(u, v);
  });
  const zones = {};
  nodes.filter(n => n.alive).forEach(n => {
    const root = find(n.id);
    if (!zones[root]) zones[root] = [];
    zones[root].push(n);
  });
  return Object.values(zones);
}

// ─── GREEDY ALLOCATION ────────────────────────────────────────────────────────
function greedyAllocate(nodes, edges) {
  const banks = nodes.filter(n => n.alive && n.type === "bloodbank" && n.stock > 0)
    .map(n => ({ ...n }));
  const hospitals = nodes.filter(n => n.alive && n.type === "hospital" && n.demand > 0)
    .map(n => ({ ...n }));
  const logs = [];
  hospitals.forEach(h => {
    let remaining = h.demand;
    banks.sort((a, b) => {
      const da = dijkstra(nodes, edges, a.id, h.id);
      const db = dijkstra(nodes, edges, b.id, h.id);
      return (da ? da.total : 9999) - (db ? db.total : 9999);
    });
    banks.forEach(b => {
      if (remaining <= 0 || b.stock <= 0) return;
      const supply = Math.min(remaining, b.stock);
      const route = dijkstra(nodes, edges, b.id, h.id);
      b.stock -= supply;
      remaining -= supply;
      logs.push({
        from: b.name, to: h.name,
        units: supply,
        distance: route ? route.total : "N/A",
        status: "Allocated",
        path: route ? route.path : [],
      });
    });
    if (remaining > 0)
      logs.push({ from: "—", to: h.name, units: 0, distance: "—", status: "Insufficient Stock", path: [] });
  });
  return logs;
}

// ─── THEME & TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg: "#F8F7F5",
  surface: "#FFFFFF",
  border: "#E8E2DC",
  sidebar: "#1A0A0A",
  sidebarText: "#C9A8A8",
  sidebarActive: "#C41E3A",
  accent: "#C41E3A",
  accentLight: "#FEF0F0",
  accentDark: "#8B0000",
  text: "#1C1C1C",
  textMuted: "#8A7A7A",
  success: "#2E7D32",
  warning: "#E65100",
  badge: "#FFEAEA",
};

// ─── BLOOD DROP SVG ───────────────────────────────────────────────────────────
const BloodDropIcon = ({ size = 20, color = T.accent }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" opacity="0.9"/>
    <path d="M9 15.5a3 3 0 003 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

// ─── NETWORK GRAPH VISUAL ────────────────────────────────────────────────────
const NetworkGraph = ({ nodes, edges }) => {
  const W = 700, H = 300;
  const banks = nodes.filter(n => n.alive && n.type === "bloodbank");
  const hosps = nodes.filter(n => n.alive && n.type === "hospital");
  const positions = {};
  banks.forEach((n, i) => {
    positions[n.id] = { x: 80 + i * (W * 0.22), y: 80 };
  });
  hosps.forEach((n, i) => {
    positions[n.id] = { x: 50 + i * (W * 0.17), y: 220 };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 300 }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.accent} opacity="0.6"/>
        </marker>
      </defs>
      {edges.map(({ u, v, dist }, i) => {
        const pu = positions[u], pv = positions[v];
        if (!pu || !pv) return null;
        const mx = (pu.x + pv.x) / 2, my = (pu.y + pv.y) / 2;
        return (
          <g key={i}>
            <line x1={pu.x} y1={pu.y} x2={pv.x} y2={pv.y}
              stroke={T.accent} strokeWidth="1.5" strokeOpacity="0.35"
              strokeDasharray="4 3" markerEnd="url(#arrow)"/>
            <text x={mx} y={my - 5} textAnchor="middle" fontSize="9" fill={T.textMuted}>{dist}km</text>
          </g>
        );
      })}
      {banks.map(n => {
        const p = positions[n.id];
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r="22" fill="#8B0000" opacity="0.12"/>
            <circle cx={p.x} cy={p.y} r="16" fill="#8B0000" opacity="0.9"/>
            <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white">BB</text>
            <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize="8" fill={T.textMuted} style={{ maxWidth: 80 }}>
              {n.name.length > 16 ? n.name.slice(0, 14) + "…" : n.name}
            </text>
          </g>
        );
      })}
      {hosps.map(n => {
        const p = positions[n.id];
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r="22" fill="#C41E3A" opacity="0.12"/>
            <rect x={p.x - 14} y={p.y - 14} width="28" height="28" rx="5" fill="#C41E3A" opacity="0.9"/>
            <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white">H</text>
            <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="8" fill={T.textMuted}>
              {n.name.length > 14 ? n.name.slice(0, 12) + "…" : n.name}
            </text>
          </g>
        );
      })}
      <text x={10} y={H - 10} fontSize="9" fill={T.textMuted}>● Blood Banks (BB)   ■ Hospitals (H)</text>
    </svg>
  );
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <AnimatePresence>
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <motion.div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Field = ({ label, children }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium mb-1" style={{ color: T.textMuted }}>{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all"
    style={{ borderColor: T.border, color: T.text, background: T.bg }}
    onFocus={e => e.target.style.borderColor = T.accent}
    onBlur={e => e.target.style.borderColor = T.border}
    {...props}/>
);

const Select = ({ children, ...props }) => (
  <select className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
    style={{ borderColor: T.border, color: T.text, background: T.bg }} {...props}>
    {children}
  </select>
);

const Btn = ({ children, onClick, variant = "primary", className = "", disabled = false, icon }) => {
  const styles = {
    primary: { background: T.accent, color: "white" },
    secondary: { background: T.bg, color: T.text, border: `1px solid ${T.border}` },
    ghost: { background: "transparent", color: T.accent },
    danger: { background: "#FEF0F0", color: T.accentDark, border: `1px solid #FECACA` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 active:scale-95 disabled:opacity-50 ${className}`}
      style={styles[variant]}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = {
    Waiting:   { bg: "#FFF7ED", color: "#C2410C", icon: <Clock size={10}/> },
    Allocated: { bg: "#F0FDF4", color: "#166534", icon: <CheckCircle size={10}/> },
    "Insufficient Stock": { bg: "#FEF2F2", color: "#991B1B", icon: <XCircle size={10}/> },
  };
  const c = cfg[status] || cfg.Waiting;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.color }}>
      {c.icon}{status}
    </span>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: "home",       label: "Dashboard Home",           icon: <Home size={16}/> },
  { id: "donors",     label: "Donor Management",         icon: <Heart size={16}/> },
  { id: "patients",   label: "Patient Requests",         icon: <Activity size={16}/> },
  { id: "network",    label: "Hospital & Blood Bank",    icon: <Building2 size={16}/> },
  { id: "roads",      label: "Road Management",          icon: <Route size={16}/> },
  { id: "route",      label: "Route Optimization",       icon: <Navigation size={16}/> },
  { id: "allocation", label: "Supply Allocation",        icon: <Zap size={16}/> },
  { id: "zones",      label: "Supply Zones",             icon: <Layers size={16}/> },
  { id: "files",      label: "File Management",          icon: <FolderOpen size={16}/> },
];

const Sidebar = ({ active, setActive }) => (
  <aside className="fixed left-0 top-0 h-full flex flex-col z-40"
    style={{ width: 220, background: T.sidebar }}>
    {/* Logo */}
    <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "#2A0A0A" }}>
      <BloodDropIcon size={24} color="#C41E3A"/>
      <div>
        <div className="text-white text-sm font-bold leading-tight">BloodNet</div>
        <div className="text-xs" style={{ color: "#7A4040" }}>Supply Optimizer</div>
      </div>
    </div>
    {/* Nav */}
    <nav className="flex-1 py-4 overflow-y-auto">
      {NAV.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)}
          className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-sm transition-all relative"
          style={{ color: active === item.id ? "white" : T.sidebarText,
                   background: active === item.id ? T.sidebarActive + "22" : "transparent" }}>
          {active === item.id && (
            <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
              style={{ background: T.sidebarActive }}/>
          )}
          <span style={{ color: active === item.id ? T.sidebarActive : T.sidebarText }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
    <div className="px-5 py-4 border-t" style={{ borderColor: "#2A0A0A" }}>
      <div className="text-xs" style={{ color: "#5A3030" }}>v2.0 · DSA-Powered</div>
    </div>
  </aside>
);

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, color }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm border"
    style={{ borderColor: T.border }}>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
      style={{ background: color + "18", color }}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold" style={{ color: T.text }}>{value}</div>
      <div className="text-xs" style={{ color: T.textMuted }}>{label}</div>
    </div>
  </motion.div>
);

// ─── PAGES ────────────────────────────────────────────────────────────────────

const HomePage = ({ nodes, edges, donors, patients }) => {
  const banks = nodes.filter(n => n.alive && n.type === "bloodbank").length;
  const hosps = nodes.filter(n => n.alive && n.type === "hospital").length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: T.text }}>Blood Supply Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Real-time network overview</p>
      </div>
      <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <SummaryCard label="Total Donors"   value={donors.length}   icon={<Heart size={20}/>}     color="#C41E3A"/>
        <SummaryCard label="Active Patients" value={patients.length} icon={<Activity size={20}/>}  color="#E65100"/>
        <SummaryCard label="Hospitals"       value={hosps}           icon={<Building2 size={20}/>} color="#1565C0"/>
        <SummaryCard label="Blood Banks"     value={banks}           icon={<Droplets size={20}/>}  color="#2E7D32"/>
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-sm" style={{ color: T.text }}>Network Overview</h2>
            <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Blood Banks → Hospitals supply graph</p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: T.textMuted }}>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: "#8B0000" }}/>Blood Bank</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: T.accent }}/>Hospital</span>
          </div>
        </div>
        <NetworkGraph nodes={nodes} edges={edges}/>
      </motion.div>
    </div>
  );
};

// ── DONORS ────────────────────────────────────────────────────────────────────
const DonorsPage = ({ donors, setDonors }) => {
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBG, setFilterBG] = useState("All");
  const [form, setForm] = useState({ name: "", bloodGroup: "A+", age: "", units: "", phone: "", city: "" });

  const filtered = donors.filter(d =>
    (filterBG === "All" || d.bloodGroup === filterBG) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) ||
     d.city.toLowerCase().includes(search.toLowerCase()))
  );

  const addDonor = () => {
    if (!form.name || !form.age || !form.units) return;
    setDonors(prev => [...prev, { ...form, id: Date.now(), age: +form.age, units: +form.units }]);
    setModal(false);
    setForm({ name: "", bloodGroup: "A+", age: "", units: "", phone: "", city: "" });
  };

  const removeDonor = id => setDonors(prev => prev.filter(d => d.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Donor Management</h1>
          <p className="text-sm" style={{ color: T.textMuted }}>BST-indexed donor registry</p>
        </div>
        <Btn onClick={() => setModal(true)} icon={<Plus size={14}/>}>Add Donor</Btn>
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or city…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: T.border, background: T.bg }}/>
        </div>
        <Select value={filterBG} onChange={e => setFilterBG(e.target.value)} style={{ width: 120 }}>
          <option>All</option>
          {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
        </Select>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {["ID","Name","Blood Group","Age","Units","Phone","City",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: T.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.id} className="border-b transition-colors hover:bg-red-50/30"
                style={{ borderColor: T.border }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: T.textMuted }}>#{d.id}</td>
                <td className="px-4 py-3 font-medium" style={{ color: T.text }}>{d.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: T.badge, color: T.accentDark }}>{d.bloodGroup}</span>
                </td>
                <td className="px-4 py-3" style={{ color: T.textMuted }}>{d.age}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: T.accent }}>{d.units}u</td>
                <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{d.phone}</td>
                <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{d.city}</td>
                <td className="px-4 py-3">
                  <button onClick={() => removeDonor(d.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13}/>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: T.textMuted }}>No donors found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Add New Donor" onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Full Name"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Donor name"/></Field>
            <Field label="Blood Group">
              <Select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Age"><Input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="e.g. 28"/></Field>
            <Field label="Units Donated"><Input type="number" value={form.units} onChange={e => setForm({...form, units: e.target.value})} placeholder="e.g. 4"/></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="10-digit number"/></Field>
            <Field label="City"><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City name"/></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={addDonor} icon={<Check size={14}/>}>Add Donor</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── PATIENTS ──────────────────────────────────────────────────────────────────
const PatientsPage = ({ patients, setPatients, nodes }) => {
  const [modal, setModal] = useState(false);
  const hospitals = nodes.filter(n => n.alive && n.type === "hospital");
  const [form, setForm] = useState({ name: "", bloodGroup: "A+", units: "", phone: "", city: "", hospital: hospitals[0]?.name || "" });

  const addPatient = () => {
    if (!form.name || !form.units) return;
    setPatients(prev => [...prev, { ...form, id: Date.now(), units: +form.units, status: "Waiting" }]);
    setModal(false);
    setForm({ name: "", bloodGroup: "A+", units: "", phone: "", city: "", hospital: hospitals[0]?.name || "" });
  };

  const removePatient = id => setPatients(prev => prev.filter(p => p.id !== id));
  const toggleStatus = id => setPatients(prev => prev.map(p =>
    p.id === id ? { ...p, status: p.status === "Waiting" ? "Allocated" : "Waiting" } : p
  ));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Patient Requests</h1>
          <p className="text-sm" style={{ color: T.textMuted }}>Queue-managed patient blood requests</p>
        </div>
        <Btn onClick={() => setModal(true)} icon={<Plus size={14}/>}>Add Request</Btn>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {["Patient ID","Name","Blood Group","Units Needed","Assigned Hospital","Status",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: T.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} className="border-b hover:bg-red-50/20 transition-colors" style={{ borderColor: T.border }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: T.textMuted }}>#{p.id}</td>
                <td className="px-4 py-3 font-medium" style={{ color: T.text }}>{p.name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: T.badge, color: T.accentDark }}>{p.bloodGroup}</span>
                </td>
                <td className="px-4 py-3 font-semibold" style={{ color: T.accent }}>{p.units}u</td>
                <td className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>{p.hospital}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(p.id)}>
                    <StatusBadge status={p.status}/>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => removePatient(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Add Patient Request" onClose={() => setModal(false)}>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Patient Name"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name"/></Field>
            <Field label="Blood Group">
              <Select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Units Needed"><Input type="number" value={form.units} onChange={e => setForm({...form, units: e.target.value})} placeholder="e.g. 3"/></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone number"/></Field>
            <Field label="City"><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City"/></Field>
            <Field label="Assigned Hospital">
              <Select value={form.hospital} onChange={e => setForm({...form, hospital: e.target.value})}>
                {hospitals.map(h => <option key={h.id}>{h.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={addPatient} icon={<Check size={14}/>}>Add to Queue</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── NETWORK NODES ─────────────────────────────────────────────────────────────
const NetworkPage = ({ nodes, setNodes }) => {
  const [modal, setModal] = useState(null); // null | 'add' | node object for edit
  const [form, setForm] = useState({ name: "", type: "hospital", bloodGroup: "A+", stock: "", demand: "" });

  const openAdd = () => { setForm({ name: "", type: "hospital", bloodGroup: "A+", stock: "", demand: "" }); setModal("add"); };
  const openEdit = n => { setForm({ name: n.name, type: n.type, bloodGroup: n.bloodGroup, stock: n.stock, demand: n.demand }); setModal(n); };

  const saveNode = () => {
    if (!form.name) return;
    if (modal === "add") {
      setNodes(prev => [...prev, { ...form, id: Date.now(), stock: +form.stock, demand: +form.demand, alive: true }]);
    } else {
      setNodes(prev => prev.map(n => n.id === modal.id ? { ...n, ...form, stock: +form.stock, demand: +form.demand } : n));
    }
    setModal(null);
  };

  const deleteNode = id => setNodes(prev => prev.map(n => n.id === id ? { ...n, alive: false } : n));

  const alive = nodes.filter(n => n.alive);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Hospital & Blood Bank Network</h1>
          <p className="text-sm" style={{ color: T.textMuted }}>Manage network nodes</p>
        </div>
        <Btn onClick={openAdd} icon={<Plus size={14}/>}>Add Node</Btn>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {alive.map(n => (
          <motion.div key={n.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: T.border }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: n.type === "bloodbank" ? "#8B000018" : "#C41E3A18" }}>
                  {n.type === "bloodbank" ? <Droplets size={15} color="#8B0000"/> : <Building2 size={15} color={T.accent}/>}
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: T.text }}>{n.name}</div>
                  <div className="text-xs capitalize" style={{ color: T.textMuted }}>{n.type} · Node #{n.id}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(n)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={12}/></button>
                <button onClick={() => deleteNode(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-lg p-2 text-center" style={{ background: T.bg }}>
                <div className="text-xs font-bold" style={{ color: T.accentDark }}>{n.bloodGroup}</div>
                <div className="text-xs" style={{ color: T.textMuted }}>Type</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: "#F0FDF4" }}>
                <div className="text-xs font-bold text-green-700">{n.stock}u</div>
                <div className="text-xs" style={{ color: T.textMuted }}>Stock</div>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: "#FFF7ED" }}>
                <div className="text-xs font-bold text-orange-700">{n.demand}u</div>
                <div className="text-xs" style={{ color: T.textMuted }}>Demand</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add Network Node" : `Edit — ${modal.name}`} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Node Name"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Apollo Hospitals"/></Field>
            <Field label="Type">
              <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="hospital">Hospital</option>
                <option value="bloodbank">Blood Bank</option>
              </Select>
            </Field>
            <Field label="Blood Group">
              <Select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Stock (units)"><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0"/></Field>
            <Field label="Demand (units)"><Input type="number" value={form.demand} onChange={e => setForm({...form, demand: e.target.value})} placeholder="0"/></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveNode} icon={<Save size={14}/>}>{modal === "add" ? "Add Node" : "Save Changes"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── ROADS ─────────────────────────────────────────────────────────────────────
const RoadsPage = ({ nodes, edges, setEdges }) => {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ u: "", v: "", dist: "" });
  const alive = nodes.filter(n => n.alive);
  const nodeName = id => nodes.find(n => n.id == id)?.name || id;

  const addRoad = () => {
    if (!form.u || !form.v || !form.dist || form.u === form.v) return;
    setEdges(prev => [...prev, { u: +form.u, v: +form.v, dist: +form.dist }]);
    setModal(null);
  };

  const deleteRoad = (u, v) => setEdges(prev => prev.filter(e => !(
    (e.u === u && e.v === v) || (e.u === v && e.v === u)
  )));

  const openEdit = e => { setForm({ u: e.u, v: e.v, dist: e.dist }); setModal(e); };

  const saveEdit = () => {
    setEdges(prev => prev.map(e =>
      (e.u === modal.u && e.v === modal.v) ? { ...e, dist: +form.dist } : e
    ));
    setModal(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Road Management</h1>
          <p className="text-sm" style={{ color: T.textMuted }}>Manage edges in the supply network</p>
        </div>
        <Btn onClick={() => { setForm({ u: "", v: "", dist: "" }); setModal("add"); }} icon={<Plus size={14}/>}>Add Road</Btn>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {["Source Node","Destination Node","Distance (km)",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: T.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {edges.map((e, i) => (
              <tr key={i} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: T.border }}>
                <td className="px-4 py-3 font-medium text-sm" style={{ color: T.text }}>{nodeName(e.u)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={12} style={{ color: T.accent }}/>
                    <span className="font-medium text-sm" style={{ color: T.text }}>{nodeName(e.v)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{e.dist} km</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"><Edit2 size={12}/></button>
                    <button onClick={() => deleteRoad(e.u, e.v)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add Road" : "Modify Road"} onClose={() => setModal(null)}>
          <Field label="Source Node">
            <Select value={form.u} onChange={e => setForm({...form, u: e.target.value})} disabled={modal !== "add"}>
              <option value="">Select node…</option>
              {alive.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </Field>
          <Field label="Destination Node">
            <Select value={form.v} onChange={e => setForm({...form, v: e.target.value})} disabled={modal !== "add"}>
              <option value="">Select node…</option>
              {alive.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </Field>
          <Field label="Distance (km)"><Input type="number" value={form.dist} onChange={e => setForm({...form, dist: e.target.value})} placeholder="e.g. 12"/></Field>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={modal === "add" ? addRoad : saveEdit} icon={<Check size={14}/>}>{modal === "add" ? "Add Road" : "Update"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── ROUTE OPTIMIZATION ────────────────────────────────────────────────────────
const RoutePage = ({ nodes, edges }) => {
  const banks = nodes.filter(n => n.alive && n.type === "bloodbank");
  const hosps = nodes.filter(n => n.alive && n.type === "hospital");
  const [src, setSrc] = useState(banks[0]?.id || "");
  const [dst, setDst] = useState(hosps[0]?.id || "");
  const [result, setResult] = useState(null);
  const [ran, setRan] = useState(false);

  const find = () => {
    const r = dijkstra(nodes, edges, +src, +dst);
    setResult(r);
    setRan(true);
  };

  const nodeName = id => nodes.find(n => n.id == id)?.name || id;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: T.text }}>Route Optimization</h1>
        <p className="text-sm" style={{ color: T.textMuted }}>Dijkstra shortest path algorithm</p>
      </div>
      <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: T.border }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Source Blood Bank">
            <Select value={src} onChange={e => setSrc(e.target.value)}>
              {banks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </Field>
          <Field label="Destination Hospital">
            <Select value={dst} onChange={e => setDst(e.target.value)}>
              {hosps.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
          </Field>
        </div>
        <Btn onClick={find} icon={<Navigation size={14}/>}>Find Shortest Route</Btn>
      </div>

      <AnimatePresence>
        {ran && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: T.border }}>
            {result ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={16} color="#2E7D32"/>
                  <span className="font-semibold text-sm text-green-800">Route Found</span>
                </div>
                {/* Path visual */}
                <div className="flex items-center gap-1 flex-wrap mb-4">
                  {result.path.map((id, i) => (
                    <div key={id} className="flex items-center gap-1">
                      <div className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: i === 0 ? "#8B000018" : i === result.path.length - 1 ? T.accentLight : "#F8F7F5",
                          color: i === 0 ? "#8B0000" : i === result.path.length - 1 ? T.accentDark : T.text,
                          border: `1px solid ${T.border}`
                        }}>
                        {nodeName(id)}
                      </div>
                      {i < result.path.length - 1 && (
                        <div className="flex items-center gap-0.5">
                          <div className="h-0.5 w-4" style={{ background: T.accent }}/>
                          <ArrowRight size={10} style={{ color: T.accent }}/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl p-3 text-center" style={{ background: T.bg }}>
                    <div className="text-lg font-bold" style={{ color: T.accent }}>{result.total} km</div>
                    <div className="text-xs" style={{ color: T.textMuted }}>Total Distance</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: T.bg }}>
                    <div className="text-lg font-bold" style={{ color: T.text }}>{result.path.length}</div>
                    <div className="text-xs" style={{ color: T.textMuted }}>Nodes Traversed</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: T.bg }}>
                    <div className="text-lg font-bold" style={{ color: T.text }}>{result.path.length - 1}</div>
                    <div className="text-xs" style={{ color: T.textMuted }}>Road Segments</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm" style={{ color: T.textMuted }}>
                <XCircle size={16} color={T.accent}/>
                No path exists between the selected nodes.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── ALLOCATION ────────────────────────────────────────────────────────────────
const AllocationPage = ({ nodes, edges }) => {
  const [logs, setLogs] = useState([]);
  const [ran, setRan] = useState(false);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    setTimeout(() => {
      setLogs(greedyAllocate(nodes, edges));
      setRan(true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Supply Allocation</h1>
          <p className="text-sm" style={{ color: T.textMuted }}>Greedy blood supply assignment algorithm</p>
        </div>
        <Btn onClick={run} disabled={loading} icon={loading ? <RefreshCw size={14} className="animate-spin"/> : <Zap size={14}/>}>
          {loading ? "Running…" : "Run Allocation"}
        </Btn>
      </div>

      {ran && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>
            Allocation Logs — {logs.length} operations
          </div>
          {logs.map((log, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border p-4 flex items-center gap-4 shadow-sm"
              style={{ borderColor: T.border }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#8B000018" }}>
                <Droplets size={14} color="#8B0000"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: T.text }}>
                  <span className="truncate">{log.from}</span>
                  <ArrowRight size={12} style={{ color: T.accent }}/>
                  <span className="truncate">{log.to}</span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs" style={{ color: T.textMuted }}>Units: <b style={{ color: T.text }}>{log.units}u</b></span>
                  <span className="text-xs" style={{ color: T.textMuted }}>Distance: <b style={{ color: T.text }}>{log.distance}{typeof log.distance === "number" ? " km" : ""}</b></span>
                </div>
              </div>
              <StatusBadge status={log.status}/>
            </motion.div>
          ))}
        </div>
      )}

      {!ran && (
        <div className="bg-white rounded-xl border p-10 text-center shadow-sm" style={{ borderColor: T.border }}>
          <Zap size={32} style={{ color: T.border, margin: "0 auto 12px" }}/>
          <p className="text-sm" style={{ color: T.textMuted }}>Click "Run Allocation" to execute the greedy algorithm</p>
        </div>
      )}
    </div>
  );
};

// ── SUPPLY ZONES ──────────────────────────────────────────────────────────────
const ZonesPage = ({ nodes, edges }) => {
  const zones = computeZones(nodes, edges);
  const [expanded, setExpanded] = useState(new Set([0]));
  const toggle = i => setExpanded(prev => {
    const s = new Set(prev);
    s.has(i) ? s.delete(i) : s.add(i);
    return s;
  });
  const ZONE_COLORS = ["#C41E3A","#1565C0","#2E7D32","#E65100","#6A1B9A","#00695C"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: T.text }}>Supply Zones</h1>
        <p className="text-sm" style={{ color: T.textMuted }}>DSU (Disjoint Set Union) connected components</p>
      </div>
      <div className="space-y-3">
        {zones.map((zone, i) => {
          const color = ZONE_COLORS[i % ZONE_COLORS.length];
          const open = expanded.has(i);
          return (
            <motion.div key={i} layout className="bg-white rounded-xl border overflow-hidden shadow-sm"
              style={{ borderColor: T.border }}>
              <button className="w-full flex items-center justify-between px-5 py-4"
                onClick={() => toggle(i)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: color }}>Z{i + 1}</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm" style={{ color: T.text }}>Zone {i + 1}</div>
                    <div className="text-xs" style={{ color: T.textMuted }}>{zone.length} nodes connected</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "#FEF0F0", color: T.accentDark }}>
                      {zone.filter(n => n.type === "bloodbank").length} Banks
                    </span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                      {zone.filter(n => n.type === "hospital").length} Hospitals
                    </span>
                  </div>
                  {open ? <ChevronUp size={16} style={{ color: T.textMuted }}/> : <ChevronDown size={16} style={{ color: T.textMuted }}/>}
                </div>
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-4 grid gap-2" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                      {zone.map(n => (
                        <div key={n.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: T.bg }}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded flex items-center justify-center"
                              style={{ background: n.type === "bloodbank" ? "#8B000018" : "#C41E3A18" }}>
                              {n.type === "bloodbank" ? <Droplets size={10} color="#8B0000"/> : <Building2 size={10} color={T.accent}/>}
                            </div>
                            <span className="text-sm font-medium" style={{ color: T.text }}>{n.name}</span>
                          </div>
                          <span className="text-xs capitalize px-2 py-0.5 rounded-full"
                            style={{ background: n.type === "bloodbank" ? "#8B000018" : "#C41E3A18",
                                     color: n.type === "bloodbank" ? "#8B0000" : T.accentDark }}>
                            {n.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ── FILE MANAGEMENT ───────────────────────────────────────────────────────────
const FilesPage = ({ nodes, donors, patients, setNodes, setDonors, setPatients }) => {
  const [statuses, setStatuses] = useState({});

  const simulate = (key, label, action) => {
    setStatuses(s => ({ ...s, [key]: "loading" }));
    setTimeout(() => {
      if (action) action();
      setStatuses(s => ({ ...s, [key]: "done" }));
      setTimeout(() => setStatuses(s => ({ ...s, [key]: null })), 3000);
    }, 800);
  };

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };

  const parseCSV = (text, type) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
      const vals = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = isNaN(vals[i]) ? vals[i] : +vals[i]);
      return obj;
    });
  };

  const loadFile = (type) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".csv";
    input.onchange = e => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        const data = parseCSV(ev.target.result, type);
        if (type === "hospitals") {
          setNodes(data.map(d => ({ ...d, alive: true })));
        } else {
          const donors = data.filter(d => d.role === "donor").map(d => ({ ...d, id: d.id, bloodGroup: d.bloodGroup, units: d.units }));
          const patients = data.filter(d => d.role === "patient").map(d => ({ ...d, units: d.units, status: "Waiting", hospital: "" }));
          setDonors(donors); setPatients(patients);
        }
        setStatuses(s => ({ ...s, [`load_${type}`]: "done" }));
        setTimeout(() => setStatuses(s => ({ ...s, [`load_${type}`]: null })), 3000);
      };
      reader.readAsText(file);
      setStatuses(s => ({ ...s, [`load_${type}`]: "loading" }));
    };
    input.click();
  };

  const StatusIcon = ({ k }) => {
    if (statuses[k] === "loading") return <RefreshCw size={14} className="animate-spin text-blue-400"/>;
    if (statuses[k] === "done") return <CheckCircle size={14} className="text-green-500"/>;
    return null;
  };

  const FileCard = ({ title, desc, actions }) => (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: T.border }}>
      <h3 className="font-semibold text-sm mb-1" style={{ color: T.text }}>{title}</h3>
      <p className="text-xs mb-4" style={{ color: T.textMuted }}>{desc}</p>
      <div className="flex gap-2 flex-wrap">
        {actions.map(a => (
          <button key={a.label} onClick={a.action}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={a.variant === "primary" ? { background: T.accentLight, color: T.accentDark } : { background: T.bg, color: T.text, border: `1px solid ${T.border}` }}>
            {a.icon}{a.label}<StatusIcon k={a.key}/>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: T.text }}>File Management</h1>
        <p className="text-sm" style={{ color: T.textMuted }}>Load and save CSV data files</p>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <FileCard title="People Data" desc="Donors and patients CSV (id, name, role, bloodGroup, units, phone, city)"
          actions={[
            { label: "Load People Data", key: "load_people", icon: <Upload size={12}/>, action: () => loadFile("people"), variant: "primary" },
            { label: "Save People Data", key: "save_people", icon: <Download size={12}/>, action: () => { exportCSV([...donors.map(d => ({ ...d, role: "donor" })), ...patients.map(p => ({ ...p, role: "patient" }))], "people.csv"); simulate("save_people"); } },
          ]}/>
        <FileCard title="Hospital Data" desc="Hospitals and blood banks CSV (id, name, type, bloodGroup, stock, demand)"
          actions={[
            { label: "Load Hospital Data", key: "load_hospitals", icon: <Upload size={12}/>, action: () => loadFile("hospitals"), variant: "primary" },
            { label: "Save Hospital Data", key: "save_hospitals", icon: <Download size={12}/>, action: () => { exportCSV(nodes.filter(n => n.alive), "hospitals.csv"); simulate("save_hospitals"); } },
          ]}/>
      </div>
      <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: T.border }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: T.text }}>System Status</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"/>
            <span style={{ color: T.textMuted }}>Donors loaded: <b style={{ color: T.text }}>{donors.length}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400"/>
            <span style={{ color: T.textMuted }}>Patients: <b style={{ color: T.text }}>{patients.length}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: T.accent }}/>
            <span style={{ color: T.textMuted }}>Network nodes: <b style={{ color: T.text }}>{nodes.filter(n => n.alive).length}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [donors, setDonors] = useState(INITIAL_DONORS);
  const [patients, setPatients] = useState(INITIAL_PATIENTS);

  const pages = {
    home:       <HomePage nodes={nodes} edges={edges} donors={donors} patients={patients}/>,
    donors:     <DonorsPage donors={donors} setDonors={setDonors}/>,
    patients:   <PatientsPage patients={patients} setPatients={setPatients} nodes={nodes}/>,
    network:    <NetworkPage nodes={nodes} setNodes={setNodes}/>,
    roads:      <RoadsPage nodes={nodes} edges={edges} setEdges={setEdges}/>,
    route:      <RoutePage nodes={nodes} edges={edges}/>,
    allocation: <AllocationPage nodes={nodes} edges={edges}/>,
    zones:      <ZonesPage nodes={nodes} edges={edges}/>,
    files:      <FilesPage nodes={nodes} donors={donors} patients={patients} setNodes={setNodes} setDonors={setDonors} setPatients={setPatients}/>,
  };

  return (
    <div className="min-h-screen" style={{ background: T.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E8E2DC; border-radius: 2px; }
        select { appearance: none; }
      `}</style>
      <Sidebar active={page} setActive={setPage}/>
      <main className="min-h-screen" style={{ marginLeft: 220 }}>
        <div className="max-w-5xl mx-auto px-6 py-7">
          <AnimatePresence mode="wait">
            <motion.div key={page}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}>
              {pages[page]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

import { calcWindowCost } from "./windows";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "borrador"
  | "enviado"
  | "aceptado"
  | "en_obra"
  | "finalizado"
  | "cancelado";

export type Unit = "m2" | "ud";

export interface ProductDef {
  label: string;
  category: string;
  unit: Unit;
  basePrice: number;
  minArea?: number;
  options: Record<string, { label: string; choices: { value: string; label: string; delta: number }[] }>;
}

export interface WindowCalc {
  systemKey: string;        // key from WINDOW_SYSTEMS
  aperturaType: string;     // 'corredera_2h', 'oscilobatiente', 'fija', etc.
  colorKey: string;         // 'LB', 'LC', etc.
  glassKey: string;         // 'climalit_4124', etc.
  mountKey: string;         // 'sin_montaje', etc.
}

export interface LineItem {
  id: string;
  productKey: string;       // 'ventana_win' for profile-based windows; CATALOGUE key otherwise
  description: string;
  widthCm: string;
  heightCm: string;
  qty: string;
  selectedOptions: Record<string, string>;
  manualPrice: string;
  manualLabel: string;
  windowCalc?: WindowCalc;  // set when productKey === 'ventana_win'
}

export type ClientType = "particular" | "constructora" | "taller" | "otro";

export const CLIENT_TYPE_META: Record<ClientType, { label: string; beneficioPct: number }> = {
  particular:   { label: "Particular",   beneficioPct: 35 },
  constructora: { label: "Constructora", beneficioPct: 25 },
  taller:       { label: "Taller",       beneficioPct: 20 },
  otro:         { label: "Otro",         beneficioPct: 30 },
};

export interface Project {
  id: string;
  number: string;           // VAL-001
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  // Client
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientNif: string;
  clientType: ClientType;   // tipo de cliente → determina % beneficio
  beneficioPct: string;     // % override (vacío = usar el del clientType)
  // Project
  projectDescription: string;
  location: string;
  notes: string;
  validityDays: string;
  deliveryWeeks: string;    // plazo de entrega en semanas
  paymentTerms: string;     // condiciones de pago
  // Quote
  items: LineItem[];
  discount: string;         // % as string
}

// ─── Status meta ─────────────────────────────────────────────────────────────

export const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  borrador:   { label: "Borrador",    color: "text-slate-600",   bg: "bg-slate-100"   },
  enviado:    { label: "Enviado",     color: "text-blue-700",    bg: "bg-blue-100"    },
  aceptado:   { label: "Aceptado",    color: "text-emerald-700", bg: "bg-emerald-100" },
  en_obra:    { label: "En obra",     color: "text-amber-700",   bg: "bg-amber-100"   },
  finalizado: { label: "Finalizado",  color: "text-purple-700",  bg: "bg-purple-100"  },
  cancelado:  { label: "Cancelado",   color: "text-red-600",     bg: "bg-red-100"     },
};

export const STATUS_FLOW: ProjectStatus[] = [
  "borrador", "enviado", "aceptado", "en_obra", "finalizado", "cancelado",
];

// ─── Product catalogue ────────────────────────────────────────────────────────

export const CATALOGUE: Record<string, ProductDef> = {
  ventana_pvc: {
    label: "Ventana PVC", category: "Ventanas", unit: "m2", basePrice: 320, minArea: 0.5,
    options: {
      apertura: { label: "Apertura", choices: [
        { value: "fija",        label: "Fija",               delta: -30 },
        { value: "oscilante",   label: "Oscilobatiente",     delta: 0   },
        { value: "corredera_2", label: "Corredera 2 hojas",  delta: 10  },
        { value: "corredera_3", label: "Corredera 3 hojas",  delta: 20  },
        { value: "abatible",    label: "Abatible",           delta: 5   },
      ]},
      vidrio: { label: "Vidrio", choices: [
        { value: "doble_std",   label: "Doble 4/16/4",          delta: 0  },
        { value: "doble_low_e", label: "Doble bajo emisivo",    delta: 30 },
        { value: "triple",      label: "Triple (máx. efic.)",   delta: 80 },
      ]},
      color: { label: "Color", choices: [
        { value: "blanco",      label: "Blanco",               delta: 0  },
        { value: "gris_antrac", label: "Gris antracita",       delta: 15 },
        { value: "beige",       label: "Beige",                delta: 10 },
        { value: "madera",      label: "Imitación madera",     delta: 25 },
        { value: "ral",         label: "RAL personalizado",    delta: 40 },
      ]},
    },
  },
  ventana_alu: {
    label: "Ventana Aluminio RPT", category: "Ventanas", unit: "m2", basePrice: 390, minArea: 0.5,
    options: {
      apertura: { label: "Apertura", choices: [
        { value: "fija",        label: "Fija",               delta: -40 },
        { value: "oscilante",   label: "Oscilobatiente",     delta: 0   },
        { value: "corredera_2", label: "Corredera 2 hojas",  delta: 15  },
        { value: "corredera_4", label: "Corredera 4 hojas",  delta: 30  },
        { value: "plegable",    label: "Plegable acordeón",  delta: 60  },
      ]},
      vidrio: { label: "Vidrio", choices: [
        { value: "doble_std",   label: "Doble 4/16/4",       delta: 0  },
        { value: "doble_low_e", label: "Doble bajo emisivo", delta: 35 },
        { value: "triple",      label: "Triple",             delta: 90 },
        { value: "laminado",    label: "Laminado seguridad", delta: 45 },
      ]},
      color: { label: "Acabado", choices: [
        { value: "blanco",      label: "Blanco RAL 9016",      delta: 0  },
        { value: "gris_antrac", label: "Gris antracita 7016",  delta: 20 },
        { value: "negro",       label: "Negro RAL 9005",       delta: 20 },
        { value: "bronce",      label: "Bronce",               delta: 25 },
        { value: "ral",         label: "RAL a medida",         delta: 50 },
        { value: "anodizado",   label: "Anodizado natural",    delta: 30 },
      ]},
    },
  },
  puerta_entrada: {
    label: "Puerta entrada aluminio", category: "Puertas", unit: "ud", basePrice: 1200,
    options: {
      apertura: { label: "Tipo", choices: [
        { value: "abatible_1", label: "Abatible 1 hoja",   delta: 0   },
        { value: "abatible_2", label: "Abatible 2 hojas",  delta: 400 },
        { value: "pivotante",  label: "Pivotante",         delta: 300 },
      ]},
      seguridad: { label: "Seguridad", choices: [
        { value: "estandar",   label: "Estándar (3 pts)",   delta: 0   },
        { value: "alta",       label: "Alta seg. (5 pts)",  delta: 250 },
        { value: "blindada",   label: "Blindada",           delta: 600 },
      ]},
      vidrio: { label: "Panel", choices: [
        { value: "ciego",      label: "Panel ciego",        delta: -100 },
        { value: "parcial",    label: "Vidrio parcial",     delta: 0    },
        { value: "total",      label: "Vidrio total",       delta: 150  },
      ]},
    },
  },
  puerta_corredera: {
    label: "Puerta corredera aluminio", category: "Puertas", unit: "m2", basePrice: 680, minArea: 1.0,
    options: {
      hojas: { label: "Hojas", choices: [
        { value: "2_hojas", label: "2 hojas", delta: 0  },
        { value: "4_hojas", label: "4 hojas", delta: 30 },
      ]},
      vidrio: { label: "Vidrio", choices: [
        { value: "doble_std",   label: "Doble estándar",    delta: 0  },
        { value: "doble_low_e", label: "Doble bajo emisivo",delta: 40 },
        { value: "laminado",    label: "Laminado seguridad",delta: 50 },
      ]},
      color: { label: "Acabado", choices: [
        { value: "blanco",      label: "Blanco",       delta: 0  },
        { value: "gris_antrac", label: "Gris antracita",delta: 20 },
        { value: "negro",       label: "Negro",        delta: 20 },
        { value: "ral",         label: "RAL a medida", delta: 50 },
      ]},
    },
  },
  cerramiento: {
    label: "Cerramiento terraza / porche", category: "Cerramientos", unit: "m2", basePrice: 295, minArea: 2.0,
    options: {
      tipo: { label: "Sistema", choices: [
        { value: "fijo",       label: "Fijo corredera",   delta: 0  },
        { value: "replegable", label: "Replegable",       delta: 40 },
        { value: "mixto",      label: "Fijo + practicable",delta: 20},
      ]},
      vidrio: { label: "Vidrio", choices: [
        { value: "templado_8",  label: "Templado 8 mm",  delta: 0  },
        { value: "templado_10", label: "Templado 10 mm", delta: 20 },
        { value: "laminado",    label: "Laminado 6+6",   delta: 40 },
      ]},
      color: { label: "Perfil", choices: [
        { value: "blanco",     label: "Blanco",         delta: 0  },
        { value: "gris_antrac",label: "Gris antracita", delta: 15 },
        { value: "anodizado",  label: "Anodizado plata",delta: 20 },
      ]},
    },
  },
  persiana: {
    label: "Persiana enrollable", category: "Persianas", unit: "m2", basePrice: 95, minArea: 0.3,
    options: {
      material: { label: "Material", choices: [
        { value: "pvc",       label: "PVC",             delta: 0  },
        { value: "aluminio",  label: "Aluminio",        delta: 20 },
        { value: "madera",    label: "Madera sintética",delta: 35 },
      ]},
      accionamiento: { label: "Accionamiento", choices: [
        { value: "cinta",     label: "Manual (cinta)",   delta: 0   },
        { value: "manivela",  label: "Manual (manivela)",delta: 10  },
        { value: "motor_std", label: "Motor estándar",   delta: 70  },
        { value: "motor_wifi",label: "Motor WiFi",       delta: 120 },
      ]},
    },
  },
  mosquitera: {
    label: "Mosquitera", category: "Mosquiteras", unit: "m2", basePrice: 65, minArea: 0.2,
    options: {
      tipo: { label: "Tipo", choices: [
        { value: "fija",       label: "Fija",      delta: -15 },
        { value: "enrollable", label: "Enrollable",delta: 0   },
        { value: "plisada",    label: "Plisada",   delta: 25  },
        { value: "corredera",  label: "Corredera", delta: 20  },
      ]},
      color: { label: "Marco", choices: [
        { value: "blanco", label: "Blanco", delta: 0 },
        { value: "gris",   label: "Gris",   delta: 0 },
        { value: "negro",  label: "Negro",  delta: 5 },
        { value: "madera", label: "Madera", delta: 10},
      ]},
    },
  },
  reparacion: {
    label: "Reparación / Mantenimiento", category: "Servicios", unit: "ud", basePrice: 80,
    options: {
      tipo: { label: "Tipo", choices: [
        { value: "gomas",     label: "Gomas y burletes",  delta: 0  },
        { value: "herrajes",  label: "Herrajes / cremonas",delta: 30 },
        { value: "regulacion",label: "Regulación / ajuste",delta: -20},
        { value: "mecanismo", label: "Mecanismo",         delta: 20 },
        { value: "vidrio",    label: "Cambio vidrio",     delta: 50 },
        { value: "completo",  label: "Revisión completa", delta: 60 },
      ]},
    },
  },
  otro: {
    label: "Partida libre", category: "Otros", unit: "ud", basePrice: 0,
    options: {},
  },
};

export const CATEGORIES = [...new Set(Object.values(CATALOGUE).map((p) => p.category))];

// ─── Calculations ─────────────────────────────────────────────────────────────

export function optionsDelta(productKey: string, selectedOptions: Record<string, string>): number {
  const def = CATALOGUE[productKey];
  if (!def) return 0;
  return Object.entries(selectedOptions).reduce((acc, [k, v]) => {
    const choice = def.options[k]?.choices.find((c) => c.value === v);
    return acc + (choice?.delta ?? 0);
  }, 0);
}

export function calcLineTotal(item: LineItem): number {
  const qty = Math.max(1, parseFloat(item.qty) || 1);

  // Profile-based window calculator
  if (item.productKey === "ventana_win" && item.windowCalc) {
    const wc = item.windowCalc;
    const wM = (parseFloat(item.widthCm) || 0) / 100;
    const hM = (parseFloat(item.heightCm) || 0) / 100;
    const breakdown = calcWindowCost(wc.systemKey, wc.aperturaType, wc.colorKey, wc.glassKey, wc.mountKey, wM, hM);
    return breakdown.total * qty;
  }

  const def = CATALOGUE[item.productKey];
  if (!def) return 0;
  if (item.productKey === "otro") return (parseFloat(item.manualPrice) || 0) * qty;
  const price = def.basePrice + optionsDelta(item.productKey, item.selectedOptions);
  if (def.unit === "ud") return price * qty;
  const w = parseFloat(item.widthCm) || 0;
  const h = parseFloat(item.heightCm) || 0;
  const area = Math.max((w * h) / 10000, def.minArea ?? 0);
  return price * area * qty;
}

export function calcArea(item: LineItem): number | null {
  const def = CATALOGUE[item.productKey];
  if (!def || def.unit !== "m2") return null;
  const w = parseFloat(item.widthCm) || 0;
  const h = parseFloat(item.heightCm) || 0;
  if (!w || !h) return null;
  return Math.max((w * h) / 10000, def.minArea ?? 0);
}

export function calcTotals(items: LineItem[], discount: string, clientType?: ClientType, beneficioPctOverride?: string) {
  const subtotal = items.reduce((a, i) => a + calcLineTotal(i), 0);
  const pct = Math.min(100, Math.max(0, parseFloat(discount) || 0));
  const discountAmt = (subtotal * pct) / 100;
  const afterDiscount = subtotal - discountAmt;
  // Beneficio
  const beneficioPct = beneficioPctOverride && parseFloat(beneficioPctOverride) >= 0
    ? parseFloat(beneficioPctOverride)
    : clientType ? CLIENT_TYPE_META[clientType].beneficioPct : 0;
  const beneficioAmt = (afterDiscount * beneficioPct) / 100;
  const base = afterDiscount + beneficioAmt;
  const iva = base * 0.21;
  return { subtotal, discountAmt, discountPct: pct, beneficioPct, beneficioAmt, base, iva, total: base + iva };
}

export function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Default item factory ─────────────────────────────────────────────────────

export function makeItem(id: string): LineItem {
  return {
    id,
    productKey: "ventana_win",
    description: "",
    widthCm: "",
    heightCm: "",
    qty: "1",
    selectedOptions: {},
    manualPrice: "",
    manualLabel: "",
    windowCalc: {
      systemKey: "ALBA_PROS_70_RPT",
      aperturaType: "oscilobatiente",
      colorKey: "LB",
      glassKey: "climalit_4124",
      mountKey: "sin_retirada",
    },
  };
}

// ─── localStorage store ───────────────────────────────────────────────────────

const STORE_KEY = "valauni_projects";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
  catch { return []; }
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const all = getProjects();
  const idx = all.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = updated; else all.unshift(updated);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function deleteProject(id: string): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(getProjects().filter((p) => p.id !== id)));
}

export function nextProjectNumber(): string {
  const nums = getProjects()
    .map((p) => parseInt(p.number.replace("VAL-", "")))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `VAL-${String(max + 1).padStart(3, "0")}`;
}

export function createBlankProject(): Project {
  return {
    id: crypto.randomUUID(),
    number: nextProjectNumber(),
    status: "borrador",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientName: "", clientPhone: "", clientEmail: "", clientAddress: "", clientNif: "",
    clientType: "particular", beneficioPct: "",
    projectDescription: "", location: "", notes: "Presupuesto válido por el período indicado. Precios incluyen mano de obra e instalación en Mallorca. Sujeto a confirmación en visita técnica.",
    validityDays: "30", deliveryWeeks: "4-6", paymentTerms: "50% a la firma del contrato, 50% a la entrega e instalación.",
    items: [makeItem(crypto.randomUUID())],
    discount: "",
  };
}

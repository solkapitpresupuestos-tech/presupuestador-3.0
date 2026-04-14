"use client";

import { useState, useEffect, useCallback, useId } from "react";
import Link from "next/link";

// ─── Catalogue ────────────────────────────────────────────────────────────────

type Unit = "m2" | "ud";

interface ProductDef {
  label: string;
  category: string;
  unit: Unit;
  basePrice: number;
  minArea?: number;
  options: Record<string, { label: string; choices: { value: string; label: string; delta: number }[] }>;
}

const CATALOGUE: Record<string, ProductDef> = {
  ventana_pvc: {
    label: "Ventana PVC",
    category: "Ventanas",
    unit: "m2",
    basePrice: 320,
    minArea: 0.5,
    options: {
      apertura: {
        label: "Apertura",
        choices: [
          { value: "fija",          label: "Fija",                     delta: -30 },
          { value: "oscilante",     label: "Oscilobatiente",           delta: 0   },
          { value: "corredera_2",   label: "Corredera 2 hojas",        delta: 10  },
          { value: "corredera_3",   label: "Corredera 3 hojas",        delta: 20  },
          { value: "abatible",      label: "Abatible",                 delta: 5   },
        ],
      },
      vidrio: {
        label: "Vidrio",
        choices: [
          { value: "doble_std",     label: "Doble 4/16/4",             delta: 0   },
          { value: "doble_low_e",   label: "Doble bajo emisivo",       delta: 30  },
          { value: "triple",        label: "Triple (máx. eficiencia)", delta: 80  },
        ],
      },
      color: {
        label: "Color",
        choices: [
          { value: "blanco",        label: "Blanco",                   delta: 0   },
          { value: "gris_antrac",   label: "Gris antracita",           delta: 15  },
          { value: "beige",         label: "Beige",                    delta: 10  },
          { value: "madera",        label: "Imitación madera",         delta: 25  },
          { value: "ral",           label: "RAL personalizado",        delta: 40  },
        ],
      },
    },
  },

  ventana_alu: {
    label: "Ventana Aluminio RPT",
    category: "Ventanas",
    unit: "m2",
    basePrice: 390,
    minArea: 0.5,
    options: {
      apertura: {
        label: "Apertura",
        choices: [
          { value: "fija",          label: "Fija",                     delta: -40 },
          { value: "oscilante",     label: "Oscilobatiente",           delta: 0   },
          { value: "corredera_2",   label: "Corredera 2 hojas",        delta: 15  },
          { value: "corredera_4",   label: "Corredera 4 hojas",        delta: 30  },
          { value: "plegable",      label: "Plegable (acordeón)",      delta: 60  },
        ],
      },
      vidrio: {
        label: "Vidrio",
        choices: [
          { value: "doble_std",     label: "Doble 4/16/4",             delta: 0   },
          { value: "doble_low_e",   label: "Doble bajo emisivo",       delta: 35  },
          { value: "triple",        label: "Triple",                   delta: 90  },
          { value: "laminado",      label: "Laminado seguridad",       delta: 45  },
        ],
      },
      color: {
        label: "Acabado",
        choices: [
          { value: "blanco",        label: "Blanco RAL 9016",          delta: 0   },
          { value: "gris_antrac",   label: "Gris antracita RAL 7016",  delta: 20  },
          { value: "negro",         label: "Negro RAL 9005",           delta: 20  },
          { value: "bronce",        label: "Bronce",                   delta: 25  },
          { value: "ral",           label: "RAL a medida",             delta: 50  },
          { value: "anodizado",     label: "Anodizado natural",        delta: 30  },
        ],
      },
    },
  },

  puerta_entrada: {
    label: "Puerta entrada aluminio",
    category: "Puertas",
    unit: "ud",
    basePrice: 1200,
    options: {
      apertura: {
        label: "Tipo",
        choices: [
          { value: "abatible_1",    label: "Abatible 1 hoja",          delta: 0    },
          { value: "abatible_2",    label: "Abatible 2 hojas",         delta: 400  },
          { value: "pivotante",     label: "Pivotante",                delta: 300  },
        ],
      },
      seguridad: {
        label: "Seguridad",
        choices: [
          { value: "estandar",      label: "Estándar (3 puntos)",      delta: 0    },
          { value: "alta",          label: "Alta seguridad (5 puntos)", delta: 250 },
          { value: "blindada",      label: "Blindada",                 delta: 600  },
        ],
      },
      vidrio: {
        label: "Vidrio / Panel",
        choices: [
          { value: "panel_ciego",   label: "Panel ciego (sin vidrio)", delta: -100 },
          { value: "vidrio_parte",  label: "Vidrio parcial",           delta: 0    },
          { value: "vidrio_total",  label: "Vidrio total",             delta: 150  },
        ],
      },
    },
  },

  puerta_corredera: {
    label: "Puerta corredera aluminio",
    category: "Puertas",
    unit: "m2",
    basePrice: 680,
    minArea: 1.0,
    options: {
      hojas: {
        label: "Hojas",
        choices: [
          { value: "2_hojas",       label: "2 hojas",                  delta: 0   },
          { value: "4_hojas",       label: "4 hojas",                  delta: 30  },
        ],
      },
      vidrio: {
        label: "Vidrio",
        choices: [
          { value: "doble_std",     label: "Doble estándar",           delta: 0   },
          { value: "doble_low_e",   label: "Doble bajo emisivo",       delta: 40  },
          { value: "laminado",      label: "Laminado seguridad",       delta: 50  },
        ],
      },
      color: {
        label: "Acabado",
        choices: [
          { value: "blanco",        label: "Blanco",                   delta: 0   },
          { value: "gris_antrac",   label: "Gris antracita",           delta: 20  },
          { value: "negro",         label: "Negro",                    delta: 20  },
          { value: "ral",           label: "RAL a medida",             delta: 50  },
        ],
      },
    },
  },

  cerramiento: {
    label: "Cerramiento terraza / porche",
    category: "Cerramientos",
    unit: "m2",
    basePrice: 295,
    minArea: 2.0,
    options: {
      tipo: {
        label: "Sistema",
        choices: [
          { value: "fijo",          label: "Fijo (corredera horizontal)", delta: 0  },
          { value: "replegable",    label: "Replegable (acordeón)",     delta: 40  },
          { value: "mixto",         label: "Fijo + practicable",        delta: 20  },
        ],
      },
      vidrio: {
        label: "Vidrio",
        choices: [
          { value: "templado_8",    label: "Templado 8 mm",             delta: 0   },
          { value: "templado_10",   label: "Templado 10 mm",            delta: 20  },
          { value: "laminado",      label: "Laminado 6+6",              delta: 40  },
        ],
      },
      color: {
        label: "Perfil",
        choices: [
          { value: "blanco",        label: "Blanco",                    delta: 0   },
          { value: "gris_antrac",   label: "Gris antracita",            delta: 15  },
          { value: "anodizado",     label: "Anodizado plata",           delta: 20  },
        ],
      },
    },
  },

  persiana: {
    label: "Persiana enrollable",
    category: "Persianas",
    unit: "m2",
    basePrice: 95,
    minArea: 0.3,
    options: {
      material: {
        label: "Material",
        choices: [
          { value: "pvc",           label: "PVC",                       delta: 0   },
          { value: "aluminio",      label: "Aluminio",                  delta: 20  },
          { value: "madera_sint",   label: "Madera sintética",          delta: 35  },
        ],
      },
      accionamiento: {
        label: "Accionamiento",
        choices: [
          { value: "manual_cinta",  label: "Manual (cinta)",            delta: 0   },
          { value: "manual_mani",   label: "Manual (manivela)",         delta: 10  },
          { value: "motor_std",     label: "Motor estándar",            delta: 70  },
          { value: "motor_smart",   label: "Motor WiFi / domótica",     delta: 120 },
        ],
      },
    },
  },

  mosquitera: {
    label: "Mosquitera",
    category: "Mosquiteras",
    unit: "m2",
    basePrice: 65,
    minArea: 0.2,
    options: {
      tipo: {
        label: "Tipo",
        choices: [
          { value: "fija",          label: "Fija (marco de aluminio)",  delta: -15 },
          { value: "enrollable",    label: "Enrollable",                delta: 0   },
          { value: "plisada",       label: "Plisada",                   delta: 25  },
          { value: "corredera",     label: "Corredera",                 delta: 20  },
        ],
      },
      color: {
        label: "Color marco",
        choices: [
          { value: "blanco",        label: "Blanco",                    delta: 0   },
          { value: "gris",          label: "Gris plata",                delta: 0   },
          { value: "negro",         label: "Negro",                     delta: 5   },
          { value: "madera",        label: "Imitación madera",          delta: 10  },
        ],
      },
    },
  },

  reparacion: {
    label: "Reparación / Mantenimiento",
    category: "Servicios",
    unit: "ud",
    basePrice: 80,
    options: {
      tipo: {
        label: "Tipo de trabajo",
        choices: [
          { value: "gomas",         label: "Cambio gomas y burletes",   delta: 0   },
          { value: "herrajes",      label: "Cambio herrajes / cremonas", delta: 30 },
          { value: "regulacion",    label: "Regulación y ajuste",       delta: -20 },
          { value: "mecanismo",     label: "Reparación mecanismo",      delta: 20  },
          { value: "vidrio",        label: "Cambio de vidrio",          delta: 50  },
          { value: "completo",      label: "Revisión completa",         delta: 60  },
        ],
      },
    },
  },

  otro: {
    label: "Partida libre",
    category: "Otros",
    unit: "ud",
    basePrice: 0,
    options: {},
  },
};

const CATEGORIES = [...new Set(Object.values(CATALOGUE).map((p) => p.category))];

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  productKey: string;
  description: string;
  widthCm: string;
  heightCm: string;
  qty: string;
  selectedOptions: Record<string, string>;
  manualPrice: string;
  manualLabel: string;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  nif: string;
}

interface QuoteState {
  customer: Customer;
  items: LineItem[];
  notes: string;
  validityDays: string;
  discount: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function optionsDelta(productKey: string, selectedOptions: Record<string, string>): number {
  const def = CATALOGUE[productKey];
  if (!def) return 0;
  return Object.entries(selectedOptions).reduce((acc, [optKey, val]) => {
    const opt = def.options[optKey];
    if (!opt) return acc;
    const choice = opt.choices.find((c) => c.value === val);
    return acc + (choice?.delta ?? 0);
  }, 0);
}

function calcLineTotal(item: LineItem): number {
  const def = CATALOGUE[item.productKey];
  if (!def) return 0;
  const qty = Math.max(1, parseFloat(item.qty) || 1);

  if (item.productKey === "otro") {
    return (parseFloat(item.manualPrice) || 0) * qty;
  }

  const effectivePrice = def.basePrice + optionsDelta(item.productKey, item.selectedOptions);

  if (def.unit === "ud") {
    return effectivePrice * qty;
  }

  const w = parseFloat(item.widthCm) || 0;
  const h = parseFloat(item.heightCm) || 0;
  const rawArea = (w * h) / 10000;
  const area = Math.max(rawArea, def.minArea ?? 0);
  return effectivePrice * area * qty;
}

function calcArea(item: LineItem): number | null {
  const def = CATALOGUE[item.productKey];
  if (!def || def.unit !== "m2") return null;
  const w = parseFloat(item.widthCm) || 0;
  const h = parseFloat(item.heightCm) || 0;
  if (!w || !h) return null;
  const rawArea = (w * h) / 10000;
  return Math.max(rawArea, def.minArea ?? 0);
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayEs() {
  return new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function makeQuoteId() {
  const now = new Date();
  return `VAL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
}

function makeItem(id: string): LineItem {
  const def = CATALOGUE["ventana_pvc"];
  const selectedOptions: Record<string, string> = {};
  Object.entries(def.options).forEach(([k, opt]) => {
    selectedOptions[k] = opt.choices[1]?.value ?? opt.choices[0].value;
  });
  return { id, productKey: "ventana_pvc", description: "", widthCm: "", heightCm: "", qty: "1", selectedOptions, manualPrice: "", manualLabel: "" };
}

const STORAGE_KEY = "valauni_quote_draft";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PresupuestoPage() {
  const uid = useId();
  const [quoteId] = useState(makeQuoteId);
  const [dateStr] = useState(todayEs);

  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "", address: "", nif: "" });
  const [items, setItems] = useState<LineItem[]>([makeItem(`${uid}-0`)]);
  const [notes, setNotes] = useState("Presupuesto válido por el número de días indicado. Precios incluyen mano de obra e instalación en Mallorca. Sujeto a confirmación en visita técnica sin cargo.");
  const [validityDays, setValidityDays] = useState("30");
  const [discount, setDiscount] = useState("");
  const [sendState, setSendState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: QuoteState = JSON.parse(raw);
      setCustomer(saved.customer);
      setItems(saved.items);
      setNotes(saved.notes);
      setValidityDays(saved.validityDays ?? "30");
      setDiscount(saved.discount ?? "");
    } catch { /* ignore */ }
  }, []);

  // Auto-save draft
  const saveDraft = useCallback(() => {
    try {
      const state: QuoteState = { customer, items, notes, validityDays, discount };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSavedMsg("Borrador guardado");
      setTimeout(() => setSavedMsg(""), 2000);
    } catch { /* ignore */ }
  }, [customer, items, notes, validityDays, discount]);

  // ─── Totals ───────────────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, item) => acc + calcLineTotal(item), 0);
  const discountPct = Math.min(100, Math.max(0, parseFloat(discount) || 0));
  const discountAmt = (subtotal * discountPct) / 100;
  const afterDiscount = subtotal - discountAmt;
  const iva = afterDiscount * 0.21;
  const total = afterDiscount + iva;

  // ─── Item handlers ────────────────────────────────────────────────────────
  function addItem() {
    setItems((prev) => [...prev, makeItem(`${uid}-${Date.now()}`)]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...patch };
        // When product changes, reset options to defaults
        if (patch.productKey && patch.productKey !== i.productKey) {
          const def = CATALOGUE[patch.productKey];
          const selectedOptions: Record<string, string> = {};
          if (def) {
            Object.entries(def.options).forEach(([k, opt]) => {
              selectedOptions[k] = opt.choices[1]?.value ?? opt.choices[0].value;
            });
          }
          updated.selectedOptions = selectedOptions;
        }
        return updated;
      })
    );
  }

  function updateOption(id: string, optKey: string, val: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, selectedOptions: { ...i.selectedOptions, [optKey]: val } } : i
      )
    );
  }

  // ─── Send quote ───────────────────────────────────────────────────────────
  async function handleSend() {
    setSendState("loading");
    setSendError("");

    const lines = items.map((item, idx) => {
      const def = CATALOGUE[item.productKey];
      const label = item.productKey === "otro" ? (item.manualLabel || "Partida libre") : def?.label ?? "";
      const desc = item.description ? ` — ${item.description}` : "";
      const area = calcArea(item);
      const dims = area != null ? ` (${item.widthCm}×${item.heightCm} cm, ${fmt(area)} m² × ${item.qty} ud)` : ` × ${item.qty}`;
      return `${idx + 1}. ${label}${desc}${dims}: ${fmt(calcLineTotal(item))} €`;
    }).join("\n");

    const optLines = items.map((item) => {
      const def = CATALOGUE[item.productKey];
      if (!def || item.productKey === "otro") return null;
      const opts = Object.entries(item.selectedOptions)
        .map(([k, v]) => {
          const opt = def.options[k];
          const choice = opt?.choices.find((c) => c.value === v);
          return choice ? `${opt.label}: ${choice.label}` : null;
        })
        .filter(Boolean);
      return opts.length ? `   ${opts.join(" | ")}` : null;
    }).filter(Boolean).join("\n");

    const message = [
      `Presupuesto ${quoteId} — ${dateStr}`,
      `Validez: ${validityDays} días`,
      "",
      lines,
      optLines ? `\nOpciones:\n${optLines}` : "",
      "",
      `Subtotal: ${fmt(subtotal)} €`,
      discountPct > 0 ? `Descuento ${discountPct}%: -${fmt(discountAmt)} €` : "",
      `Base imponible: ${fmt(afterDiscount)} €`,
      `IVA 21%: ${fmt(iva)} €`,
      `TOTAL: ${fmt(total)} €`,
      notes ? `\nNotas: ${notes}` : "",
    ].filter((l) => l !== "").join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name || "Sin nombre",
          phone: customer.phone || "Sin teléfono",
          email: customer.email,
          service: `Presupuesto ${quoteId}`,
          message,
        }),
      });
      if (!res.ok) throw new Error();
      setSendState("ok");
    } catch {
      setSendState("error");
      setSendError("No se pudo enviar. Usa «Imprimir» para guardar el PDF.");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; color: #111; }
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
        @page { margin: 1.5cm; }
      `}</style>

      {/* Nav */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-amber-400">Valauni</span>
            <span className="text-xs text-slate-400 hidden sm:block">Carpintería PVC &amp; Aluminio · Mallorca</span>
          </Link>
          <div className="flex items-center gap-3">
            {savedMsg && <span className="text-xs text-emerald-400">{savedMsg}</span>}
            <button onClick={saveDraft} className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
              Guardar borrador
            </button>
            <span className="text-amber-400 text-sm font-semibold">Calculadora de presupuestos</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 print:py-0 print:space-y-4">

        {/* Header block */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Presupuesto</h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">{quoteId}</p>
            <p className="text-sm text-slate-500">Fecha: {dateStr}</p>
            <p className="text-sm text-slate-500">Validez: {validityDays} días</p>
          </div>
          <div className="text-sm text-slate-600 sm:text-right space-y-0.5">
            <p className="font-bold text-slate-900 text-base">Valauni S.L.</p>
            <p>Carpintería PVC &amp; Aluminio</p>
            <p>Mallorca, Islas Baleares</p>
            <p className="font-medium">+34 600 000 000</p>
            <p>info@valauni.com</p>
            <p>www.valauni.com</p>
          </div>
        </div>

        {/* ── Customer ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                { name: "name",    label: "Nombre / Empresa",  type: "text",  span: 2 },
                { name: "nif",     label: "NIF / CIF",         type: "text",  span: 1 },
                { name: "phone",   label: "Teléfono",          type: "tel",   span: 1 },
                { name: "email",   label: "Email",             type: "email", span: 1 },
                { name: "address", label: "Dirección / Obra",  type: "text",  span: 1 },
              ] as const
            ).map(({ name, label, type, span }) => (
              <div key={name} className={span === 2 ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={customer[name]}
                  onChange={(e) => setCustomer((c) => ({ ...c, [name]: e.target.value }))}
                  placeholder={label}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Validity & Discount (screen only) ── */}
        <div className="flex flex-wrap gap-4 no-print">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Validez (días)</label>
            <select
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descuento global (%)</label>
            <input
              type="number" min="0" max="100" placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* ── Line items ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Partidas</h2>
          <div className="space-y-4">
            {items.map((item, idx) => {
              const def = CATALOGUE[item.productKey];
              const isM2 = def?.unit === "m2";
              const isOtro = item.productKey === "otro";
              const lineTotal = calcLineTotal(item);
              const area = calcArea(item);
              const effectivePrice = isOtro ? null : (def?.basePrice ?? 0) + optionsDelta(item.productKey, item.selectedOptions);

              return (
                <div key={item.id} className="print-card bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {/* Line header */}
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                    <span className="text-xs font-bold text-slate-500">Partida {idx + 1}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="text-slate-300 hover:text-red-400 disabled:opacity-20 text-xs no-print transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Row 1: product type + dims */}
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto] gap-4 items-end">
                      <div>
                        {/* Category pills */}
                        <div className="flex flex-wrap gap-1.5 mb-2 no-print">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                const first = Object.entries(CATALOGUE).find(([, d]) => d.category === cat);
                                if (first) updateItem(item.id, { productKey: first[0] });
                              }}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                def?.category === cat
                                  ? "bg-amber-400 border-amber-400 text-slate-900 font-semibold"
                                  : "border-gray-200 text-slate-500 hover:border-amber-300"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
                        <select
                          value={item.productKey}
                          onChange={(e) => updateItem(item.id, { productKey: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          {CATEGORIES.map((cat) => (
                            <optgroup key={cat} label={cat}>
                              {Object.entries(CATALOGUE)
                                .filter(([, d]) => d.category === cat)
                                .map(([key, d]) => (
                                  <option key={key} value={key}>{d.label}</option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Dims / qty */}
                      <div className="flex items-end gap-2">
                        {isM2 && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Ancho cm</label>
                              <input
                                type="number" min="1" placeholder="120"
                                value={item.widthCm}
                                onChange={(e) => updateItem(item.id, { widthCm: e.target.value })}
                                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Alto cm</label>
                              <input
                                type="number" min="1" placeholder="120"
                                value={item.heightCm}
                                onChange={(e) => updateItem(item.id, { heightCm: e.target.value })}
                                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Uds.</label>
                          <input
                            type="number" min="1" placeholder="1"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                            className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                        {isOtro && (
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Precio ud. €</label>
                            <input
                              type="number" min="0" placeholder="0"
                              value={item.manualPrice}
                              onChange={(e) => updateItem(item.id, { manualPrice: e.target.value })}
                              className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options grid */}
                    {!isOtro && Object.keys(def?.options ?? {}).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(def.options).map(([optKey, opt]) => (
                          <div key={optKey}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{opt.label}</label>
                            <select
                              value={item.selectedOptions[optKey] ?? opt.choices[0].value}
                              onChange={(e) => updateOption(item.id, optKey, e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              {opt.choices.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}{c.delta !== 0 ? ` (${c.delta > 0 ? "+" : ""}${c.delta} €/u)` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Description row */}
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {isOtro ? "Descripción *" : "Referencia / ubicación (opcional)"}
                        </label>
                        <input
                          type="text"
                          placeholder={isOtro ? "Descripción de la partida" : "Ej: Dormitorio principal, fachada sur…"}
                          value={isOtro ? item.manualLabel : item.description}
                          onChange={(e) =>
                            isOtro
                              ? updateItem(item.id, { manualLabel: e.target.value })
                              : updateItem(item.id, { description: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      {/* Line total */}
                      <div className="text-right shrink-0 min-w-[90px]">
                        {area != null && (
                          <p className="text-xs text-slate-400">{fmt(area)} m²</p>
                        )}
                        {effectivePrice != null && (
                          <p className="text-xs text-slate-400">{fmt(effectivePrice)} €/{def?.unit === "m2" ? "m²" : "ud"}</p>
                        )}
                        <p className="text-lg font-bold text-slate-900">{fmt(lineTotal)} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={addItem}
            className="no-print mt-3 w-full border-2 border-dashed border-gray-300 hover:border-amber-400 text-slate-500 hover:text-amber-600 rounded-xl py-3 text-sm font-medium transition-colors"
          >
            + Añadir partida
          </button>
        </section>

        {/* ── Notes ── */}
        <section>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notas y condiciones</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </section>

        {/* ── Totals ── */}
        <section className="bg-slate-50 rounded-2xl border border-gray-200 p-5 print-card">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (sin IVA)</span>
              <span className="font-medium">{fmt(subtotal)} €</span>
            </div>
            {discountPct > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento {discountPct}%</span>
                <span className="font-medium">-{fmt(discountAmt)} €</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Base imponible</span>
              <span className="font-medium">{fmt(afterDiscount)} €</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA 21%</span>
              <span className="font-medium">{fmt(iva)} €</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-gray-300 pt-3 mt-2">
              <span>TOTAL</span>
              <span>{fmt(total)} €</span>
            </div>
          </div>
        </section>

        {/* ── Signature block (print only) ── */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-8">
          <div>
            <p className="text-xs text-slate-500 mb-8">Firma y sello Valauni S.L.</p>
            <div className="border-b border-gray-400 w-full" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-8">Firma y conformidad del cliente</p>
            <div className="border-b border-gray-400 w-full" />
            <p className="text-xs text-slate-400 mt-1">{customer.name}</p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="no-print flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-full text-sm transition-colors"
          >
            Imprimir / Guardar PDF
          </button>

          {sendState === "ok" ? (
            <div className="flex-1 bg-emerald-50 border border-emerald-400 text-emerald-700 font-semibold py-3 rounded-full text-sm text-center">
              ✓ Presupuesto enviado al equipo
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={sendState === "loading"}
              className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-full text-sm transition-colors"
            >
              {sendState === "loading" ? "Enviando…" : "Enviar al equipo por email"}
            </button>
          )}
        </div>

        {sendState === "error" && (
          <p className="text-red-600 text-sm text-center no-print">{sendError}</p>
        )}
      </main>

      <footer className="mt-12 py-6 border-t border-gray-100 text-center text-xs text-slate-400 no-print">
        Valauni S.L. · Carpintería PVC &amp; Aluminio en Mallorca · +34 600 000 000 · info@valauni.com
      </footer>
    </>
  );
}

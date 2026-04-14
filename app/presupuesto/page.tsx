"use client";

import { useState, useId } from "react";
import Link from "next/link";

// ─── Pricing catalogue ────────────────────────────────────────────────────────

type Unit = "m2" | "ud";

interface Product {
  label: string;
  unit: Unit;
  pricePerUnit: number; // € per m² or per unit
  minArea?: number;     // minimum billable m² (only for m2 products)
}

const PRODUCTS: Record<string, Product> = {
  ventana_pvc_basica:    { label: "Ventana PVC básica (doble vidrio)",         unit: "m2", pricePerUnit: 320,  minArea: 0.5  },
  ventana_pvc_premium:   { label: "Ventana PVC premium (triple vidrio)",        unit: "m2", pricePerUnit: 420,  minArea: 0.5  },
  ventana_alu_rpt:       { label: "Ventana aluminio RPT",                       unit: "m2", pricePerUnit: 390,  minArea: 0.5  },
  ventana_alu_premium:   { label: "Ventana aluminio premium",                   unit: "m2", pricePerUnit: 490,  minArea: 0.5  },
  puerta_entrada_alu:    { label: "Puerta de entrada aluminio",                 unit: "ud", pricePerUnit: 1200             },
  puerta_corredera_alu:  { label: "Puerta corredera aluminio",                  unit: "m2", pricePerUnit: 680,  minArea: 1.0  },
  cerramiento_pvc:       { label: "Cerramiento terraza PVC",                    unit: "m2", pricePerUnit: 260,  minArea: 1.0  },
  cerramiento_alu:       { label: "Cerramiento terraza aluminio",               unit: "m2", pricePerUnit: 330,  minArea: 1.0  },
  persiana_enrollable:   { label: "Persiana enrollable PVC/aluminio",           unit: "m2", pricePerUnit: 95,   minArea: 0.3  },
  persiana_motorizada:   { label: "Persiana motorizada",                        unit: "m2", pricePerUnit: 165,  minArea: 0.3  },
  mosquitera_enrollable: { label: "Mosquitera enrollable",                      unit: "m2", pricePerUnit: 75,   minArea: 0.2  },
  mosquitera_fija:       { label: "Mosquitera fija",                            unit: "m2", pricePerUnit: 48,   minArea: 0.2  },
  reparacion:            { label: "Reparación / Mantenimiento",                 unit: "ud", pricePerUnit: 80               },
  otro:                  { label: "Otro (precio manual)",                       unit: "ud", pricePerUnit: 0                },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  productKey: string;
  description: string;
  widthCm: string;
  heightCm: string;
  qty: string;
  manualPrice: string; // used when productKey === "otro"
}

interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcLineTotal(item: LineItem): number {
  const product = PRODUCTS[item.productKey];
  if (!product) return 0;
  const qty = Math.max(1, parseFloat(item.qty) || 1);

  if (product.unit === "ud") {
    if (item.productKey === "otro") {
      return (parseFloat(item.manualPrice) || 0) * qty;
    }
    return product.pricePerUnit * qty;
  }

  // m2 product
  const w = parseFloat(item.widthCm) || 0;
  const h = parseFloat(item.heightCm) || 0;
  const rawArea = (w * h) / 10000; // cm² → m²
  const area = Math.max(rawArea, product.minArea ?? 0);
  return product.pricePerUnit * area * qty;
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function quoteNumber() {
  const now = new Date();
  return `VAL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
}

function newItem(id: string): LineItem {
  return { id, productKey: "ventana_pvc_basica", description: "", widthCm: "", heightCm: "", qty: "1", manualPrice: "" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PresupuestoPage() {
  const uid = useId();

  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "", address: "" });
  const [items, setItems] = useState<LineItem[]>([newItem(`${uid}-0`)]);
  const [notes, setNotes] = useState("");
  const [sendState, setSendState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const [quoteId] = useState(quoteNumber);
  const [dateStr] = useState(today);

  // ─── Totals ───────────────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, item) => acc + calcLineTotal(item), 0);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  // ─── Item handlers ────────────────────────────────────────────────────────
  function addItem() {
    setItems((prev) => [...prev, newItem(`${uid}-${Date.now()}`)]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  // ─── Send quote ───────────────────────────────────────────────────────────
  async function handleSend() {
    setSendState("loading");
    setSendError("");

    const lines = items.map((item) => {
      const product = PRODUCTS[item.productKey];
      const lineTotal = calcLineTotal(item);
      const desc = item.description || product?.label || "";
      const dims = product?.unit === "m2" && item.widthCm && item.heightCm
        ? ` (${item.widthCm}×${item.heightCm} cm × ${item.qty} ud)`
        : ` × ${item.qty}`;
      return `• ${desc}${dims}: ${fmt(lineTotal)} €`;
    }).join("\n");

    const message = [
      `Presupuesto ${quoteId} — ${dateStr}`,
      "",
      lines,
      "",
      `Subtotal: ${fmt(subtotal)} €`,
      `IVA 21%: ${fmt(iva)} €`,
      `TOTAL: ${fmt(total)} €`,
      notes ? `\nNotas: ${notes}` : "",
    ].join("\n");

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
      setSendError("No se pudo enviar. Imprime el presupuesto manualmente.");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Print-only header ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-size: 12px; }
        }
      `}</style>

      {/* ── Screen nav ── */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-amber-400">Valauni</span>
            <span className="text-xs text-slate-400 hidden sm:block">Carpintería PVC &amp; Aluminio · Mallorca</span>
          </Link>
          <span className="text-sm font-semibold text-amber-400">Calculadora de presupuestos</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Quote header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Presupuesto</h1>
            <p className="text-sm text-slate-500 mt-1">Ref: <span className="font-mono font-semibold">{quoteId}</span></p>
            <p className="text-sm text-slate-500">Fecha: {dateStr}</p>
          </div>
          <div className="text-sm text-slate-600 sm:text-right">
            <p className="font-bold text-slate-900">Valauni S.L.</p>
            <p>Carpintería PVC &amp; Aluminio</p>
            <p>Mallorca, Islas Baleares</p>
            <p>Tel: +34 600 000 000</p>
            <p>info@valauni.com</p>
          </div>
        </div>

        {/* ── Customer info ── */}
        <section className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Datos del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                { name: "name",    label: "Nombre",    type: "text",  placeholder: "Nombre completo"    },
                { name: "phone",   label: "Teléfono",  type: "tel",   placeholder: "+34 600 000 000"    },
                { name: "email",   label: "Email",     type: "email", placeholder: "cliente@email.com"  },
                { name: "address", label: "Dirección", type: "text",  placeholder: "Calle, nº, localidad" },
              ] as const
            ).map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={customer[name]}
                  onChange={(e) => setCustomer((c) => ({ ...c, [name]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Line items ── */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Partidas</h2>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const product = PRODUCTS[item.productKey];
              const lineTotal = calcLineTotal(item);
              const isM2 = product?.unit === "m2";
              const isOtro = item.productKey === "otro";

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  {/* Row 1: index + product selector + delete */}
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-slate-400 mt-2.5 w-5 shrink-0">{idx + 1}</span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                      {/* Product type */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de producto</label>
                        <select
                          value={item.productKey}
                          onChange={(e) => updateItem(item.id, { productKey: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          {Object.entries(PRODUCTS).map(([key, p]) => (
                            <option key={key} value={key}>{p.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Dimensions or quantity */}
                      {isM2 ? (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Ancho (cm)</label>
                            <input
                              type="number" min="1" placeholder="120"
                              value={item.widthCm}
                              onChange={(e) => updateItem(item.id, { widthCm: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Alto (cm)</label>
                            <input
                              type="number" min="1" placeholder="120"
                              value={item.heightCm}
                              onChange={(e) => updateItem(item.id, { heightCm: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Uds.</label>
                            <input
                              type="number" min="1" placeholder="1"
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
                            <input
                              type="number" min="1" placeholder="1"
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          {isOtro && (
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Precio ud. (€)</label>
                              <input
                                type="number" min="0" placeholder="0.00"
                                value={item.manualPrice}
                                onChange={(e) => updateItem(item.id, { manualPrice: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="mt-6 text-slate-300 hover:text-red-400 disabled:opacity-20 transition-colors no-print"
                      title="Eliminar partida"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Row 2: description + price */}
                  <div className="mt-3 flex items-end gap-3 pl-8">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Descripción / referencia (opcional)</label>
                      <input
                        type="text" placeholder="Ej: Dormitorio principal, fachada norte…"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400 mb-1">
                        {isM2 && item.widthCm && item.heightCm
                          ? `${fmt(Math.max((parseFloat(item.widthCm) * parseFloat(item.heightCm)) / 10000, product?.minArea ?? 0))} m²`
                          : product?.unit === "m2" ? "— m²" : ""}
                      </p>
                      <p className="text-base font-bold text-slate-900">{fmt(lineTotal)} €</p>
                    </div>
                  </div>

                  {/* Price hint */}
                  {!isOtro && (
                    <p className="text-xs text-slate-400 mt-2 pl-8">
                      Precio base: {fmt(product?.pricePerUnit ?? 0)} €/{product?.unit === "m2" ? "m²" : "ud"}
                      {isM2 && product?.minArea ? ` · mín. ${product.minArea} m²` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={addItem}
            className="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-amber-400 text-slate-500 hover:text-amber-600 rounded-xl py-3 text-sm font-medium transition-colors no-print"
          >
            + Añadir partida
          </button>
        </section>

        {/* ── Notes ── */}
        <section>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notas / condiciones</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Plazo de entrega, condiciones de pago, observaciones…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </section>

        {/* ── Totals ── */}
        <section className="bg-slate-50 rounded-2xl border border-gray-200 p-5">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (sin IVA)</span>
              <span className="font-medium">{fmt(subtotal)} €</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (21%)</span>
              <span className="font-medium">{fmt(iva)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-gray-300 pt-2 mt-2">
              <span>TOTAL</span>
              <span>{fmt(total)} €</span>
            </div>
          </div>
        </section>

        {/* ── Validity note ── */}
        <p className="text-xs text-slate-400 text-center">
          Presupuesto orientativo válido 30 días · Precios incluyen mano de obra e instalación en Mallorca · Sujeto a revisión en visita técnica
        </p>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
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

      {/* ── Footer ── */}
      <footer className="mt-12 py-6 border-t border-gray-100 text-center text-xs text-slate-400 no-print">
        Valauni S.L. · Carpintería PVC &amp; Aluminio en Mallorca · +34 600 000 000
      </footer>
    </>
  );
}

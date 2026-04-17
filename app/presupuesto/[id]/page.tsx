"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Project, ProjectStatus, STATUS_FLOW, LineItem, WindowCalc,
  CATALOGUE, CATEGORIES, CLIENT_TYPE_META, ClientType,
  getProject, saveProject, deleteProject,
  calcLineTotal, calcArea, calcTotals, optionsDelta,
  fmt,
} from "@/lib/presupuesto";
import {
  WINDOW_SYSTEMS, COLOR_OPTIONS, GLASS_OPTIONS, MOUNT_OPTIONS, APERTURA_OPTIONS,
  calcWindowCost, getItemCuts, buildMaterialGroups, BAR_LENGTH_MM, Bar,
} from "@/lib/windows";

// ─── Status display ───────────────────────────────────────────────────────────

const STATUS_DISPLAY: Record<ProjectStatus, { label: string; bg: string; text: string }> = {
  borrador:   { label: "Borrador",   bg: "bg-stone-100", text: "text-stone-500"  },
  enviado:    { label: "Enviado",    bg: "bg-blue-50",   text: "text-blue-600"   },
  aceptado:   { label: "Aceptado",  bg: "bg-green-50",  text: "text-green-700"  },
  en_obra:    { label: "En obra",   bg: "bg-orange-50", text: "text-orange-600" },
  finalizado: { label: "Finalizado",bg: "bg-stone-100", text: "text-stone-900"  },
  cancelado:  { label: "Cancelado", bg: "bg-red-50",    text: "text-red-600"    },
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({
  label, name, type = "text", value, onChange, placeholder, span2 = false,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
      <input
        type={type} name={name} value={value} placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}

// Window SVG diagram
function WindowSVG({ apertura, w = 40, h = 48 }: { apertura: string; w?: number; h?: number }) {
  const stroke = "#374151";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x={2} y={2} width={w - 4} height={h - 4} stroke={stroke} strokeWidth={2.5} fill="white" />
      {apertura === "fija" && (
        <>
          <line x1={2} y1={2} x2={w - 2} y2={h - 2} stroke={stroke} strokeWidth={1} />
          <line x1={w - 2} y1={2} x2={2} y2={h - 2} stroke={stroke} strokeWidth={1} />
        </>
      )}
      {(apertura === "corredera_2h" || apertura === "corredera_4h") && (
        <>
          <line x1={w / 2} y1={2} x2={w / 2} y2={h - 2} stroke={stroke} strokeWidth={1.5} />
          <path d={`M${w / 2 + 3} ${h / 2 - 6} L${w / 2 + 8} ${h / 2} L${w / 2 + 3} ${h / 2 + 6}`} stroke={stroke} strokeWidth={1} fill="none" />
          <path d={`M${w / 2 - 3} ${h / 2 - 6} L${w / 2 - 8} ${h / 2} L${w / 2 - 3} ${h / 2 + 6}`} stroke={stroke} strokeWidth={1} fill="none" />
        </>
      )}
      {(apertura === "oscilobatiente" || apertura === "abatible") && (
        <>
          <line x1={2} y1={h - 2} x2={w - 2} y2={2} stroke={stroke} strokeWidth={1} strokeDasharray="3,2" />
          <path d={`M${w - 12} ${8} L${w - 2} ${2} L${w - 2} ${12}`} stroke={stroke} strokeWidth={1} fill="none" />
        </>
      )}
      {apertura === "elevable" && (
        <>
          <line x1={w / 2} y1={2} x2={w / 2} y2={h - 2} stroke={stroke} strokeWidth={1.5} />
          <path d={`M${w / 2 - 5} ${10} L${w / 2} ${2} L${w / 2 + 5} ${10}`} stroke={stroke} strokeWidth={1.5} fill="none" />
        </>
      )}
    </svg>
  );
}

// Bar visualization
function BarViz({ bar, barLengthMm }: { bar: Bar; barLengthMm: number }) {
  const colors = ["#FCD34D", "#6EE7B7", "#93C5FD", "#F9A8D4", "#A5B4FC", "#FCA5A5", "#86EFAC", "#67E8F9"];
  let offset = 0;
  return (
    <div className="flex h-6 rounded overflow-hidden border border-stone-200 text-[9px]">
      {bar.cuts.map((cut, i) => {
        const pct = (cut / barLengthMm) * 100;
        const color = colors[i % colors.length];
        const el = (
          <div
            key={i}
            style={{ width: `${pct}%`, backgroundColor: color }}
            className="flex items-center justify-center overflow-hidden text-stone-700 font-medium shrink-0"
            title={`${cut} mm`}
          >
            {cut >= 300 ? `${cut}` : ""}
          </div>
        );
        offset += cut;
        return el;
      })}
      {bar.remaining > 0 && (
        <div
          style={{ width: `${(bar.remaining / barLengthMm) * 100}%` }}
          className="bg-stone-100 flex items-center justify-center text-stone-400 shrink-0"
          title={`Retal: ${bar.remaining} mm`}
        >
          {bar.remaining >= 400 ? `${bar.remaining}↗` : ""}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proj, setProj] = useState<Project | null>(null);
  const [tab, setTab] = useState<"datos" | "presupuesto" | "material">("datos");
  const [saved, setSaved] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { setNotFound(true); return; }
    setProj(p);
  }, [id]);

  const save = useCallback((p: Project) => {
    saveProject(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function update(patch: Partial<Project>) {
    setProj((prev) => prev ? { ...prev, ...patch } : prev);
  }

  function handleSave() { if (proj) save(proj); }
  function handleDelete() {
    if (!proj || !confirm("¿Eliminar este proyecto?")) return;
    deleteProject(proj.id);
    router.push("/presupuesto");
  }
  function handleStatusChange(status: ProjectStatus) {
    if (!proj) return;
    const next = { ...proj, status };
    setProj(next);
    save(next);
  }

  // ── Item handlers ──
  function addItem() {
    if (!proj) return;
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      productKey: "ventana_win",
      description: "", widthCm: "", heightCm: "", qty: "1",
      selectedOptions: {}, manualPrice: "", manualLabel: "",
      windowCalc: { systemKey: "ALBA_PROS_70_RPT", aperturaType: "oscilobatiente", colorKey: "LB", glassKey: "climalit_4124", mountKey: "sin_retirada" },
    };
    update({ items: [...proj.items, newItem] });
  }

  function removeItem(itemId: string) {
    if (!proj || proj.items.length <= 1) return;
    update({ items: proj.items.filter((i) => i.id !== itemId) });
  }

  function updateItem(itemId: string, patch: Partial<LineItem>) {
    if (!proj) return;
    update({
      items: proj.items.map((i) => {
        if (i.id !== itemId) return i;
        const updated = { ...i, ...patch };
        if (patch.productKey && patch.productKey !== i.productKey) {
          if (patch.productKey === "ventana_win") {
            updated.windowCalc = { systemKey: "ALBA_PROS_70_RPT", aperturaType: "oscilobatiente", colorKey: "LB", glassKey: "climalit_4124", mountKey: "sin_retirada" };
            updated.selectedOptions = {};
          } else {
            updated.windowCalc = undefined;
            const def = CATALOGUE[patch.productKey];
            const selectedOptions: Record<string, string> = {};
            if (def) Object.entries(def.options).forEach(([k, opt]) => {
              selectedOptions[k] = opt.choices[1]?.value ?? opt.choices[0].value;
            });
            updated.selectedOptions = selectedOptions;
          }
        }
        return updated;
      }),
    });
  }

  function updateWC(itemId: string, patch: Partial<WindowCalc>) {
    if (!proj) return;
    update({
      items: proj.items.map((i) =>
        i.id === itemId && i.windowCalc
          ? { ...i, windowCalc: { ...i.windowCalc, ...patch } }
          : i
      ),
    });
  }

  function updateOption(itemId: string, optKey: string, val: string) {
    if (!proj) return;
    update({
      items: proj.items.map((i) =>
        i.id === itemId ? { ...i, selectedOptions: { ...i.selectedOptions, [optKey]: val } } : i
      ),
    });
  }

  // ── Send ──
  async function handleSend() {
    if (!proj) return;
    setSendState("loading");
    const totals = calcTotals(proj.items, proj.discount, proj.clientType, proj.beneficioPct);
    const lines = proj.items.map((item, idx) => {
      const isWin = item.productKey === "ventana_win" && item.windowCalc;
      const label = isWin
        ? `${WINDOW_SYSTEMS[item.windowCalc!.systemKey]?.label ?? "Ventana"} ${APERTURA_OPTIONS.find(a => a.key === item.windowCalc!.aperturaType)?.label ?? ""}`
        : (item.productKey === "otro" ? (item.manualLabel || "Partida libre") : CATALOGUE[item.productKey]?.label ?? "");
      const desc = item.description ? ` — ${item.description}` : "";
      const dims = item.widthCm && item.heightCm ? ` (${item.widthCm}×${item.heightCm} cm × ${item.qty})` : ` × ${item.qty}`;
      return `${idx + 1}. ${label}${desc}${dims}: ${fmt(calcLineTotal(item))} €`;
    }).join("\n");

    const body = [
      `Presupuesto ${proj.number} — Estado: ${STATUS_DISPLAY[proj.status].label}`,
      `Validez: ${proj.validityDays} días`, "",
      lines, "",
      `Base: ${fmt(totals.base)} € | IVA 21%: ${fmt(totals.iva)} € | TOTAL: ${fmt(totals.total)} €`,
      proj.notes ? `\nNotas: ${proj.notes}` : "",
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: proj.clientName || "Sin nombre", phone: proj.clientPhone || "—", email: proj.clientEmail, service: `Presupuesto ${proj.number}`, message: body }),
      });
      if (!res.ok) throw new Error();
      setSendState("ok");
      if (proj.status === "borrador") handleStatusChange("enviado");
    } catch { setSendState("error"); }
  }

  // ── PDF ──
  async function handlePDF() {
    if (!proj) return;
    const { generatePresupuestoPDF } = await import("@/lib/pdf");
    await generatePresupuestoPDF(proj);
  }

  // ─── Material tab data ────────────────────────────────────────────────────
  const materialGroups = (() => {
    if (!proj) return [];
    const allCuts = proj.items.flatMap((item) => {
      if (item.productKey !== "ventana_win" || !item.windowCalc) return [];
      const wc = item.windowCalc;
      return getItemCuts(wc.systemKey, wc.aperturaType, wc.colorKey,
        parseFloat(item.widthCm) || 0, parseFloat(item.heightCm) || 0,
        Math.max(1, parseInt(item.qty) || 1));
    });
    return buildMaterialGroups(allCuts);
  })();

  const materialTotalCost = materialGroups.reduce((a, g) => a + g.cost, 0);
  const totalBars = materialGroups.reduce((a, g) => a + g.barsNeeded, 0);
  const totalUsedMm = materialGroups.reduce((a, g) => a + g.totalMm, 0);
  const totalWasteMm = materialGroups.reduce((a, g) => a + g.wasteMm, 0);
  const efficiency = totalBars > 0 ? ((totalUsedMm / (totalBars * BAR_LENGTH_MM)) * 100).toFixed(1) : "—";

  // ─── Render ───────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-stone-500 font-medium mb-4">Proyecto no encontrado</p>
          <Link href="/presupuesto" className="bg-[#1C1917] text-white font-bold px-6 py-2 rounded-full text-sm">Volver</Link>
        </div>
      </div>
    );
  }
  if (!proj) {
    return <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center"><p className="text-stone-400">Cargando…</p></div>;
  }

  const totals = calcTotals(proj.items, proj.discount, proj.clientType, proj.beneficioPct);
  const disp = STATUS_DISPLAY[proj.status];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; color: #111; background: white; }
        }
        @page { margin: 1.5cm; }
      `}</style>

      {/* Nav */}
      <header className="bg-[#1C1917] text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/presupuesto" className="text-stone-400 hover:text-white text-sm transition-colors">← Proyectos</Link>
            <span className="text-stone-600">|</span>
            <span className="font-mono font-bold text-yellow-400">{proj.number}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${disp.bg} ${disp.text}`}>{disp.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-400">Guardado ✓</span>}
            <button onClick={handleSave} className="bg-stone-700 hover:bg-stone-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">Guardar</button>
            <button onClick={handlePDF} className="border border-stone-500 text-stone-200 hover:bg-stone-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">Generar PDF</button>
            <button onClick={handleDelete} className="text-stone-500 hover:text-red-400 text-sm px-2 py-1.5 transition-colors">Eliminar</button>
          </div>
        </div>
      </header>

      {/* Print header */}
      <div className="hidden print:flex justify-between items-start border-b border-gray-300 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Presupuesto {proj.number}</h1>
          <p className="text-sm text-gray-500">Fecha: {new Date(proj.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })} · Validez: {proj.validityDays} días</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-bold text-gray-900">Valauni S.L.</p>
          <p>Carpintería PVC &amp; Aluminio · Mallorca</p>
          <p>+34 600 000 000 · info@valauni.com</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4 bg-[#F5F4F1] min-h-[calc(100vh-52px)]">

        {/* Status bar */}
        <div className="no-print bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Estado</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => {
              const m = STATUS_DISPLAY[s];
              return (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    proj.status === s ? `${m.bg} ${m.text} ring-2 ring-offset-1 ring-yellow-400` : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="no-print flex gap-0 border-b border-stone-200">
          {(["datos", "presupuesto", "material"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 capitalize ${
                tab === t ? "border-yellow-400 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700"
              }`}>
              {t === "datos" ? "Datos del cliente" : t === "presupuesto" ? "Presupuesto" : "Material"}
              {t === "material" && materialGroups.length > 0 && (
                <span className="ml-1.5 text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">{totalBars} barras</span>
              )}
            </button>
          ))}
        </div>

        {/* ── DATOS TAB ── */}
        <div className={tab === "datos" ? "" : "hidden print:block"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombre / Empresa" name="clientName" value={proj.clientName} onChange={(v) => update({ clientName: v })} span2 />
                <Field label="NIF / CIF" name="clientNif" value={proj.clientNif} onChange={(v) => update({ clientNif: v })} />
                <Field label="Teléfono" name="clientPhone" type="tel" value={proj.clientPhone} onChange={(v) => update({ clientPhone: v })} />
                <Field label="Email" name="clientEmail" type="email" value={proj.clientEmail} onChange={(v) => update({ clientEmail: v })} />
                <Field label="Dirección" name="clientAddress" value={proj.clientAddress} onChange={(v) => update({ clientAddress: v })} span2 />
                {/* Tipo de cliente + beneficio */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-stone-500 mb-2">Tipo de cliente / Beneficio</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Object.entries(CLIENT_TYPE_META) as [ClientType, { label: string; beneficioPct: number }][]).map(([key, meta]) => (
                      <button key={key} type="button"
                        onClick={() => update({ clientType: key, beneficioPct: "" })}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          (proj.clientType ?? "particular") === key
                            ? "bg-[#1C1917] text-white border-[#1C1917]"
                            : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                        }`}>
                        {meta.label} · {meta.beneficioPct}%
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-500 whitespace-nowrap">% beneficio aplicado:</label>
                    <input type="number" min="0" max="100"
                      value={proj.beneficioPct !== "" ? proj.beneficioPct : CLIENT_TYPE_META[proj.clientType ?? "particular"].beneficioPct}
                      onChange={(e) => update({ beneficioPct: e.target.value })}
                      className="w-20 border border-stone-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    <span className="text-xs text-stone-400">%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Proyecto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Descripción / Obra" name="projectDescription" value={proj.projectDescription} onChange={(v) => update({ projectDescription: v })} span2 />
                <Field label="Ubicación" name="location" value={proj.location} onChange={(v) => update({ location: v })} span2 />
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Validez</label>
                  <select value={proj.validityDays} onChange={(e) => update({ validityDays: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    {["15","30","60","90"].map((d) => <option key={d} value={d}>{d} días</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Plazo de entrega</label>
                  <select value={proj.deliveryWeeks ?? "4-6"} onChange={(e) => update({ deliveryWeeks: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                    {["2-3","3-4","4-6","6-8","8-10","10-12"].map((w) => <option key={w} value={w}>{w} semanas</option>)}
                  </select>
                </div>
                <Field label="Descuento global (%)" name="discount" type="number" value={proj.discount} onChange={(v) => update({ discount: v })} placeholder="0" />
              </div>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Condiciones de pago</label>
            <input type="text" value={proj.paymentTerms ?? ""} onChange={(e) => update({ paymentTerms: e.target.value })}
              placeholder="50% a la firma del contrato, 50% a la entrega e instalación."
              className="w-full border border-stone-300 rounded-xl px-4 py-2 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-3" />
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Notas y condiciones</label>
            <textarea rows={3} value={proj.notes} onChange={(e) => update({ notes: e.target.value })}
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
          </div>
        </div>

        {/* ── PRESUPUESTO TAB ── */}
        <div className={tab === "presupuesto" ? "" : "hidden print:block"}>
          <div className="space-y-3">
            {proj.items.map((item, idx) => {
              const isWin = item.productKey === "ventana_win";
              const wc = item.windowCalc;
              const def = CATALOGUE[item.productKey];
              const isM2 = def?.unit === "m2";
              const isOtro = item.productKey === "otro";
              const lineTotal = calcLineTotal(item);
              const area = isWin ? null : calcArea(item);

              // Window breakdown
              const winBreakdown = isWin && wc && item.widthCm && item.heightCm
                ? calcWindowCost(wc.systemKey, wc.aperturaType, wc.colorKey, wc.glassKey, wc.mountKey,
                    (parseFloat(item.widthCm) || 0) / 100, (parseFloat(item.heightCm) || 0) / 100)
                : null;

              // Compatible apertura options for selected system
              const sysInfo = isWin && wc ? WINDOW_SYSTEMS[wc.systemKey] : null;
              const compatAperturas = sysInfo
                ? APERTURA_OPTIONS.filter((a) => a.types.includes(sysInfo.systemType))
                : APERTURA_OPTIONS;

              return (
                <div key={item.id} className="bg-white border border-stone-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                  {/* Header */}
                  <div className="bg-stone-50 px-4 py-2 flex items-center justify-between border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-400">Partida {idx + 1}</span>
                      {isWin && wc && <WindowSVG apertura={wc.aperturaType} />}
                    </div>
                    <button onClick={() => removeItem(item.id)} disabled={proj.items.length === 1}
                      className="text-stone-300 hover:text-red-400 disabled:opacity-20 text-xs no-print transition-colors">
                      Eliminar
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Category pills */}
                    <div className="no-print flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => {
                        const isActive = isWin ? cat === "Ventanas" : def?.category === cat;
                        return (
                          <button key={cat}
                            onClick={() => {
                              if (cat === "Ventanas") {
                                updateItem(item.id, { productKey: "ventana_win" });
                              } else {
                                const first = Object.entries(CATALOGUE).find(([, d]) => d.category === cat);
                                if (first) updateItem(item.id, { productKey: first[0] });
                              }
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              isActive
                                ? "bg-[#1C1917] border-[#1C1917] text-white font-semibold"
                                : "border-stone-200 text-stone-500 hover:border-stone-400"
                            }`}>
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Window calculator */}
                    {isWin && wc ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Sistema */}
                          <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-medium text-stone-500 mb-1">Sistema</label>
                            <select value={wc.systemKey} onChange={(e) => {
                                const newSys = WINDOW_SYSTEMS[e.target.value];
                                const firstAp = APERTURA_OPTIONS.find(a => a.types.includes(newSys?.systemType ?? ""));
                                updateWC(item.id, { systemKey: e.target.value, aperturaType: firstAp?.key ?? "fija" });
                              }}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                              {Object.entries(WINDOW_SYSTEMS).map(([k, s]) => (
                                <option key={k} value={k}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                          {/* Apertura */}
                          <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Apertura</label>
                            <select value={wc.aperturaType} onChange={(e) => updateWC(item.id, { aperturaType: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                              {compatAperturas.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                            </select>
                          </div>
                          {/* Color */}
                          <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Color</label>
                            <select value={wc.colorKey} onChange={(e) => updateWC(item.id, { colorKey: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                              {COLOR_OPTIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                          </div>
                          {/* Vidrio */}
                          <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Vidrio</label>
                            <select value={wc.glassKey} onChange={(e) => updateWC(item.id, { glassKey: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                              {GLASS_OPTIONS.map((g) => <option key={g.key} value={g.key}>{g.label} — {g.pricePerM2} €/m²</option>)}
                            </select>
                          </div>
                          {/* Montaje */}
                          <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Montaje</label>
                            <select value={wc.mountKey} onChange={(e) => updateWC(item.id, { mountKey: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                              {MOUNT_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}{m.pricePerM2 > 0 ? ` — ${m.pricePerM2} €/m²` : ""}</option>)}
                            </select>
                          </div>
                          {/* Dims + qty */}
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Ancho cm</label>
                              <input type="number" min="1" placeholder="120" value={item.widthCm}
                                onChange={(e) => updateItem(item.id, { widthCm: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Alto cm</label>
                              <input type="number" min="1" placeholder="120" value={item.heightCm}
                                onChange={(e) => updateItem(item.id, { heightCm: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            </div>
                            <div className="w-16">
                              <label className="block text-xs font-medium text-stone-500 mb-1">Uds.</label>
                              <input type="number" min="1" placeholder="1" value={item.qty}
                                onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-2 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            </div>
                          </div>
                        </div>

                        {/* Cost breakdown + description */}
                        <div className="flex items-start gap-4 mt-1">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-stone-500 mb-1">Referencia / ubicación</label>
                            <input type="text" placeholder="Ej: Dormitorio principal…" value={item.description}
                              onChange={(e) => updateItem(item.id, { description: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                          </div>
                          <div className="text-right shrink-0 min-w-[130px]">
                            {winBreakdown ? (
                              <div className="text-xs text-stone-400 space-y-0.5">
                                <div className="flex justify-between gap-3"><span>Material</span><span>{fmt(winBreakdown.profileCost)} €</span></div>
                                <div className="flex justify-between gap-3"><span>Fabricación</span><span>{fmt(winBreakdown.fabricacionCost)} €</span></div>
                                <div className="flex justify-between gap-3"><span>Vidrio</span><span>{fmt(winBreakdown.glassCost)} €</span></div>
                                <div className="flex justify-between gap-3"><span>Herrajes</span><span>{fmt(winBreakdown.herrajes)} €</span></div>
                                <div className="flex justify-between gap-3"><span>Montaje</span><span>{fmt(winBreakdown.mountCost)} €</span></div>
                                <div className="flex justify-between gap-3 font-semibold text-stone-700 border-t border-stone-200 pt-0.5 mt-0.5">
                                  <span>× {item.qty || 1} ud.</span>
                                  <span className="text-base text-stone-900">{fmt(lineTotal)} €</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-stone-400 text-sm">Introduce medidas</p>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Non-window item */
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto] gap-4 items-end">
                          <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1">Producto</label>
                            <select value={item.productKey} onChange={(e) => updateItem(item.id, { productKey: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                              {CATEGORIES.filter(c => c !== "Ventanas").map((cat) => (
                                <optgroup key={cat} label={cat}>
                                  {Object.entries(CATALOGUE).filter(([, d]) => d.category === cat).map(([k, d]) => (
                                    <option key={k} value={k}>{d.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            {isM2 && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-stone-500 mb-1">Ancho cm</label>
                                  <input type="number" min="1" placeholder="120" value={item.widthCm}
                                    onChange={(e) => updateItem(item.id, { widthCm: e.target.value })}
                                    className="w-20 border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-stone-500 mb-1">Alto cm</label>
                                  <input type="number" min="1" placeholder="120" value={item.heightCm}
                                    onChange={(e) => updateItem(item.id, { heightCm: e.target.value })}
                                    className="w-20 border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                                </div>
                              </>
                            )}
                            <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1">Uds.</label>
                              <input type="number" min="1" placeholder="1" value={item.qty}
                                onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                                className="w-16 border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                            </div>
                            {isOtro && (
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1">Precio €</label>
                                <input type="number" min="0" placeholder="0" value={item.manualPrice}
                                  onChange={(e) => updateItem(item.id, { manualPrice: e.target.value })}
                                  className="w-24 border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                              </div>
                            )}
                          </div>
                        </div>

                        {def && Object.keys(def.options).length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(def.options).map(([optKey, opt]) => (
                              <div key={optKey}>
                                <label className="block text-xs font-medium text-stone-500 mb-1">{opt.label}</label>
                                <select value={item.selectedOptions[optKey] ?? opt.choices[0].value}
                                  onChange={(e) => updateOption(item.id, optKey, e.target.value)}
                                  className="w-full border border-stone-300 rounded-lg px-2 py-2 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400">
                                  {opt.choices.map((c) => (
                                    <option key={c.value} value={c.value}>
                                      {c.label}{c.delta !== 0 ? ` (${c.delta > 0 ? "+" : ""}${c.delta} €)` : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-end gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-stone-500 mb-1">
                              {isOtro ? "Descripción *" : "Referencia / ubicación"}
                            </label>
                            <input type="text"
                              placeholder={isOtro ? "Descripción" : "Ej: Terraza sur…"}
                              value={isOtro ? item.manualLabel : item.description}
                              onChange={(e) => isOtro
                                ? updateItem(item.id, { manualLabel: e.target.value })
                                : updateItem(item.id, { description: e.target.value })}
                              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                          </div>
                          <div className="text-right shrink-0 min-w-[90px]">
                            {area != null && <p className="text-xs text-stone-400">{fmt(area)} m²</p>}
                            {!isOtro && def && (
                              <p className="text-xs text-stone-400">
                                {fmt((def.basePrice) + optionsDelta(item.productKey, item.selectedOptions))} €/{def.unit === "m2" ? "m²" : "ud"}
                              </p>
                            )}
                            <p className="text-lg font-bold text-stone-900">{fmt(lineTotal)} €</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={addItem}
            className="no-print mt-3 w-full border-2 border-dashed border-stone-300 hover:border-yellow-400 text-stone-500 hover:text-yellow-600 rounded-xl py-3 text-sm font-medium transition-colors">
            + Añadir partida
          </button>

          {/* Totals */}
          <div className="mt-4 bg-white rounded-2xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5">
            <div className="max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal (coste)</span><span className="font-medium">{fmt(totals.subtotal)} €</span>
              </div>
              {totals.discountPct > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento {totals.discountPct}%</span><span className="font-medium">-{fmt(totals.discountAmt)} €</span>
                </div>
              )}
              {totals.beneficioPct > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Beneficio {totals.beneficioPct}% ({CLIENT_TYPE_META[proj.clientType ?? "particular"].label})</span>
                  <span className="font-medium">+{fmt(totals.beneficioAmt)} €</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500">
                <span>Base imponible</span><span className="font-medium">{fmt(totals.base)} €</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>IVA 21%</span><span className="font-medium">{fmt(totals.iva)} €</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-stone-900 border-t border-stone-200 pt-3">
                <span>TOTAL</span><span>{fmt(totals.total)} €</span>
              </div>
            </div>
          </div>

          {/* Print signature */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-10">
            <div>
              <p className="text-xs text-gray-500 mb-8">Firma y sello Valauni S.L.</p>
              <div className="border-b border-gray-400 w-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-8">Firma y conformidad del cliente</p>
              <div className="border-b border-gray-400 w-full" />
              <p className="text-xs text-gray-400 mt-1">{proj.clientName}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="no-print flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={handleSave}
              className="flex-1 bg-[#1C1917] hover:bg-[#292524] text-white font-semibold py-3 rounded-full text-sm transition-colors">
              Guardar cambios
            </button>
            {sendState === "ok" ? (
              <div className="flex-1 bg-green-50 border border-green-300 text-green-700 font-semibold py-3 rounded-full text-sm text-center">
                ✓ Enviado al equipo
              </div>
            ) : (
              <button onClick={handleSend} disabled={sendState === "loading"}
                className="flex-1 border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-60 text-stone-900 font-semibold py-3 rounded-full text-sm transition-colors">
                {sendState === "loading" ? "Enviando…" : "Enviar por email al equipo"}
              </button>
            )}
            <button onClick={handlePDF}
              className="flex-1 border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-semibold py-3 rounded-full text-sm transition-colors">
              Generar PDF
            </button>
          </div>
          {sendState === "error" && <p className="text-red-500 text-sm text-center no-print">Error al enviar. Usa «Generar PDF» para guardar.</p>}
        </div>

        {/* ── MATERIAL TAB ── */}
        {tab === "material" && (
          <div className="space-y-4 no-print">
            {materialGroups.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <p className="text-stone-400">No hay partidas de ventanas con medidas en este presupuesto.</p>
                <p className="text-stone-400 text-sm mt-1">Añade partidas de ventana con ancho y alto para ver el análisis de material.</p>
              </div>
            ) : (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total barras",       value: String(totalBars) },
                    { label: "Metros usados",      value: `${(totalUsedMm / 1000).toFixed(2)} m` },
                    { label: "Metros retal",       value: `${(totalWasteMm / 1000).toFixed(2)} m` },
                    { label: "Aprovechamiento",    value: `${efficiency}%` },
                  ].map((m) => (
                    <div key={m.label} className="bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4">
                      <p className="text-xs text-stone-400 uppercase tracking-wide">{m.label}</p>
                      <p className="text-xl font-bold text-stone-900 mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Per-profile groups */}
                {materialGroups.map((group) => (
                  <div key={group.groupKey} className="bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-stone-900">{group.systemLabel} — {group.ref}</p>
                        <p className="text-xs text-stone-400">Color: {group.colorKey} · ×{group.colorMultiplier.toFixed(2)} · {fmt(group.pricePerBarLB)} €/m → {fmt(group.pricePerBarLB * 6.5 * group.colorMultiplier)} €/barra</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-900">{group.barsNeeded} barras</p>
                        <p className="text-xs text-stone-500">{fmt(group.cost)} €</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {group.bars.map((bar, bi) => (
                        <div key={bi} className="flex items-center gap-3">
                          <span className="text-xs text-stone-400 w-14 shrink-0">Barra {bi + 1}</span>
                          <div className="flex-1">
                            <BarViz bar={bar} barLengthMm={BAR_LENGTH_MM} />
                          </div>
                          <span className="text-xs text-stone-400 w-20 text-right shrink-0">
                            retal: {bar.remaining} mm
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Summary table */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Sistema</th>
                        <th className="text-left px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Referencia</th>
                        <th className="text-center px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Barras</th>
                        <th className="text-right px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">€/barra</th>
                        <th className="text-right px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {materialGroups.map((g) => (
                        <tr key={g.groupKey} className="hover:bg-stone-50">
                          <td className="px-4 py-2 text-stone-700">{g.systemLabel}</td>
                          <td className="px-4 py-2 text-stone-500 text-xs">{g.ref}</td>
                          <td className="px-4 py-2 text-center text-stone-700 font-medium">{g.barsNeeded}</td>
                          <td className="px-4 py-2 text-right text-stone-500 text-xs">
                            <span className="text-stone-400">{fmt(g.pricePerBarLB)} €/m × 6,5</span>
                            <br /><span className="font-medium text-stone-700">{fmt(g.pricePerBarLB * 6.5 * g.colorMultiplier)} €/barra</span>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-stone-900">{fmt(g.cost)} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-stone-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 font-bold text-stone-900">Total material perfiles</td>
                        <td className="px-4 py-3 text-right font-bold text-stone-900 text-base">{fmt(materialTotalCost)} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Herrajes y artículos */}
                {(() => {
                  const herrajesItems = proj.items
                    .filter((i) => i.productKey === "ventana_win" && i.windowCalc && parseFloat(i.widthCm) > 0 && parseFloat(i.heightCm) > 0)
                    .map((i) => {
                      const sys = WINDOW_SYSTEMS[i.windowCalc!.systemKey];
                      const qty = Math.max(1, parseInt(i.qty) || 1);
                      const herrajes = (sys?.herrajes ?? 0) * qty;
                      return { label: sys?.label ?? i.windowCalc!.systemKey, desc: i.description, dims: `${i.widthCm}×${i.heightCm} cm`, qty, herrajes };
                    });
                  const totalHerrajes = herrajesItems.reduce((a, i) => a + i.herrajes, 0);
                  if (herrajesItems.length === 0) return null;
                  return (
                    <div className="bg-white rounded-xl border border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
                      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
                        <p className="text-sm font-bold text-stone-900">Herrajes y artículos</p>
                        <p className="text-xs text-stone-400">Coste fijo por unidad según sistema de perfiles</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="border-b border-stone-100">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Sistema</th>
                            <th className="text-left px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Descripción</th>
                            <th className="text-center px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Uds</th>
                            <th className="text-right px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">€/ud</th>
                            <th className="text-right px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-wide">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {herrajesItems.map((h, i) => (
                            <tr key={i} className="hover:bg-stone-50">
                              <td className="px-4 py-2 text-stone-700">{h.label}</td>
                              <td className="px-4 py-2 text-stone-500 text-xs">{h.desc || h.dims}</td>
                              <td className="px-4 py-2 text-center text-stone-700 font-medium">{h.qty}</td>
                              <td className="px-4 py-2 text-right text-stone-500">{fmt(h.herrajes / h.qty)} €</td>
                              <td className="px-4 py-2 text-right font-semibold text-stone-900">{fmt(h.herrajes)} €</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-stone-200">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 font-bold text-stone-900">Total herrajes y artículos</td>
                            <td className="px-4 py-3 text-right font-bold text-stone-900 text-base">{fmt(totalHerrajes)} €</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}

                {/* Coste total material */}
                {(() => {
                  const totalHerrajes = proj.items
                    .filter((i) => i.productKey === "ventana_win" && i.windowCalc)
                    .reduce((a, i) => {
                      const sys = WINDOW_SYSTEMS[i.windowCalc!.systemKey];
                      return a + (sys?.herrajes ?? 0) * Math.max(1, parseInt(i.qty) || 1);
                    }, 0);
                  const grandTotal = materialTotalCost + totalHerrajes;
                  return (
                    <div className="bg-[#1C1917] text-white rounded-xl p-4 flex justify-between items-center">
                      <span className="font-bold">Coste total material (perfiles + herrajes)</span>
                      <span className="text-xl font-bold text-yellow-400">{fmt(grandTotal)} €</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

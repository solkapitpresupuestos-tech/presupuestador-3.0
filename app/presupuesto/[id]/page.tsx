"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Project, ProjectStatus, STATUS_META, STATUS_FLOW, LineItem,
  CATALOGUE, CATEGORIES,
  getProject, saveProject, deleteProject,
  calcLineTotal, calcArea, calcTotals, optionsDelta,
  makeItem, fmt,
} from "@/lib/presupuesto";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, name, type = "text", value, onChange, placeholder, span2 = false,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type} name={name} value={value} placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = STATUS_META[status];
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${m.bg} ${m.color}`}>{m.label}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proj, setProj] = useState<Project | null>(null);
  const [tab, setTab] = useState<"datos" | "presupuesto">("datos");
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
    setProj((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      return next;
    });
  }

  function handleSave() {
    if (proj) save(proj);
  }

  function handleDelete() {
    if (!proj) return;
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    deleteProject(proj.id);
    router.push("/presupuesto");
  }

  function handleStatusChange(status: ProjectStatus) {
    if (!proj) return;
    const next = { ...proj, status };
    setProj(next);
    save(next);
  }

  // ── Quote item handlers ──
  function addItem() {
    if (!proj) return;
    update({ items: [...proj.items, makeItem(crypto.randomUUID())] });
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
          const def = CATALOGUE[patch.productKey];
          const selectedOptions: Record<string, string> = {};
          if (def) Object.entries(def.options).forEach(([k, opt]) => {
            selectedOptions[k] = opt.choices[1]?.value ?? opt.choices[0].value;
          });
          updated.selectedOptions = selectedOptions;
        }
        return updated;
      }),
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

  // ── Send quote ──
  async function handleSend() {
    if (!proj) return;
    setSendState("loading");
    const { total, subtotal, discountAmt, discountPct, base, iva } = calcTotals(proj.items, proj.discount);
    const lines = proj.items.map((item, idx) => {
      const def = CATALOGUE[item.productKey];
      const label = item.productKey === "otro" ? (item.manualLabel || "Partida libre") : def?.label ?? "";
      const desc = item.description ? ` — ${item.description}` : "";
      const area = calcArea(item);
      const dims = area != null ? ` (${item.widthCm}×${item.heightCm} cm, ${fmt(area)} m² × ${item.qty})` : ` × ${item.qty}`;
      return `${idx + 1}. ${label}${desc}${dims}: ${fmt(calcLineTotal(item))} €`;
    }).join("\n");

    const message = [
      `Presupuesto ${proj.number} — ${new Date(proj.createdAt).toLocaleDateString("es-ES")}`,
      `Validez: ${proj.validityDays} días`,
      `Estado: ${STATUS_META[proj.status].label}`,
      ``,
      lines,
      ``,
      `Subtotal: ${fmt(subtotal)} €`,
      discountPct > 0 ? `Descuento ${discountPct}%: -${fmt(discountAmt)} €` : "",
      `Base imponible: ${fmt(base)} €`,
      `IVA 21%: ${fmt(iva)} €`,
      `TOTAL: ${fmt(total)} €`,
      proj.notes ? `\nNotas: ${proj.notes}` : "",
    ].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: proj.clientName || "Sin nombre",
          phone: proj.clientPhone || "Sin teléfono",
          email: proj.clientEmail,
          service: `Presupuesto ${proj.number}`,
          message,
        }),
      });
      if (!res.ok) throw new Error();
      setSendState("ok");
      if (proj.status === "borrador") handleStatusChange("enviado");
    } catch {
      setSendState("error");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-slate-600 font-medium mb-4">Proyecto no encontrado</p>
          <Link href="/presupuesto" className="bg-amber-400 text-slate-900 font-bold px-6 py-2 rounded-full text-sm">
            Volver a proyectos
          </Link>
        </div>
      </div>
    );
  }

  if (!proj) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-slate-400">Cargando…</p></div>;
  }

  const totals = calcTotals(proj.items, proj.discount);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; color: #111; background: white; }
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
        @page { margin: 1.5cm; }
      `}</style>

      {/* ── Top bar ── */}
      <header className="bg-slate-900 text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/presupuesto" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← Proyectos
            </Link>
            <span className="text-slate-700">|</span>
            <span className="font-mono font-bold text-amber-400">{proj.number}</span>
            <StatusBadge status={proj.status} />
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-400">Guardado ✓</span>}
            <button onClick={handleSave} className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              Guardar
            </button>
            <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              Imprimir
            </button>
            <button onClick={handleDelete} className="text-slate-400 hover:text-red-400 text-sm px-2 py-1.5 rounded-lg transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      </header>

      {/* ── Print header ── */}
      <div className="hidden print:flex justify-between items-start border-b border-gray-300 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuesto {proj.number}</h1>
          <p className="text-sm text-slate-500 font-mono">{proj.number}</p>
          <p className="text-sm text-slate-500">Fecha: {new Date(proj.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p className="text-sm text-slate-500">Validez: {proj.validityDays} días</p>
        </div>
        <div className="text-right text-sm text-slate-600">
          <p className="font-bold text-slate-900">Valauni S.L.</p>
          <p>Carpintería PVC &amp; Aluminio · Mallorca</p>
          <p>+34 600 000 000 · info@valauni.com</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Status workflow ── */}
        <div className="no-print bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Estado del proyecto</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => {
              const m = STATUS_META[s];
              const active = proj.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    active ? `${m.bg} ${m.color} ring-2 ring-offset-1 ring-amber-400` : "bg-gray-100 text-slate-500 hover:bg-gray-200"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tabs (screen only) ── */}
        <div className="no-print flex gap-1 border-b border-gray-200">
          {(["datos", "presupuesto"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 ${
                tab === t ? "border-amber-400 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "datos" ? "Datos del cliente" : "Presupuesto"}
            </button>
          ))}
        </div>

        {/* ── Datos tab ── */}
        <div className={tab === "datos" ? "" : "hidden print:block"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Client */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 print-card">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Datos del cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombre / Empresa" name="clientName" value={proj.clientName} onChange={(v) => update({ clientName: v })} span2 />
                <Field label="NIF / CIF" name="clientNif" value={proj.clientNif} onChange={(v) => update({ clientNif: v })} />
                <Field label="Teléfono" name="clientPhone" type="tel" value={proj.clientPhone} onChange={(v) => update({ clientPhone: v })} />
                <Field label="Email" name="clientEmail" type="email" value={proj.clientEmail} onChange={(v) => update({ clientEmail: v })} />
                <Field label="Dirección" name="clientAddress" value={proj.clientAddress} onChange={(v) => update({ clientAddress: v })} span2 />
              </div>
            </div>

            {/* Project info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 print-card">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Datos del proyecto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Descripción / Obra" name="projectDescription" value={proj.projectDescription} onChange={(v) => update({ projectDescription: v })} span2 />
                <Field label="Ubicación / Dirección de obra" name="location" value={proj.location} onChange={(v) => update({ location: v })} span2 />
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Validez</label>
                  <select value={proj.validityDays} onChange={(e) => update({ validityDays: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                  </select>
                </div>
                <Field label="Descuento global (%)" name="discount" type="number" value={proj.discount} onChange={(v) => update({ discount: v })} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-5 bg-white rounded-xl border border-gray-200 shadow-sm p-5 print-card">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notas y condiciones</label>
            <textarea
              rows={3} value={proj.notes} onChange={(e) => update({ notes: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
        </div>

        {/* ── Presupuesto tab ── */}
        <div className={tab === "presupuesto" ? "" : "hidden print:block"}>
          <div className="space-y-3">
            {proj.items.map((item, idx) => {
              const def = CATALOGUE[item.productKey];
              const isM2 = def?.unit === "m2";
              const isOtro = item.productKey === "otro";
              const lineTotal = calcLineTotal(item);
              const area = calcArea(item);
              const effectivePrice = isOtro ? null : (def?.basePrice ?? 0) + optionsDelta(item.productKey, item.selectedOptions);

              return (
                <div key={item.id} className="print-card bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
                    <span className="text-xs font-bold text-slate-500">Partida {idx + 1}</span>
                    <button onClick={() => removeItem(item.id)} disabled={proj.items.length === 1}
                      className="text-slate-300 hover:text-red-400 disabled:opacity-20 text-xs no-print transition-colors">
                      Eliminar
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Product + dims */}
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_auto] gap-4 items-end">
                      <div>
                        {/* Category pills */}
                        <div className="flex flex-wrap gap-1.5 mb-2 no-print">
                          {CATEGORIES.map((cat) => (
                            <button key={cat}
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
                        <select value={item.productKey} onChange={(e) => updateItem(item.id, { productKey: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                          {CATEGORIES.map((cat) => (
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
                              <label className="block text-xs font-medium text-slate-600 mb-1">Ancho cm</label>
                              <input type="number" min="1" placeholder="120" value={item.widthCm}
                                onChange={(e) => updateItem(item.id, { widthCm: e.target.value })}
                                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">Alto cm</label>
                              <input type="number" min="1" placeholder="120" value={item.heightCm}
                                onChange={(e) => updateItem(item.id, { heightCm: e.target.value })}
                                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Uds.</label>
                          <input type="number" min="1" placeholder="1" value={item.qty}
                            onChange={(e) => updateItem(item.id, { qty: e.target.value })}
                            className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                        </div>
                        {isOtro && (
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Precio €</label>
                            <input type="number" min="0" placeholder="0" value={item.manualPrice}
                              onChange={(e) => updateItem(item.id, { manualPrice: e.target.value })}
                              className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    {!isOtro && Object.keys(def?.options ?? {}).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(def.options).map(([optKey, opt]) => (
                          <div key={optKey}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{opt.label}</label>
                            <select value={item.selectedOptions[optKey] ?? opt.choices[0].value}
                              onChange={(e) => updateOption(item.id, optKey, e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
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

                    {/* Description + total */}
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {isOtro ? "Descripción *" : "Referencia / ubicación"}
                        </label>
                        <input type="text"
                          placeholder={isOtro ? "Descripción de la partida" : "Ej: Dormitorio principal…"}
                          value={isOtro ? item.manualLabel : item.description}
                          onChange={(e) => isOtro
                            ? updateItem(item.id, { manualLabel: e.target.value })
                            : updateItem(item.id, { description: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </div>
                      <div className="text-right shrink-0 min-w-[90px]">
                        {area != null && <p className="text-xs text-slate-400">{fmt(area)} m²</p>}
                        {effectivePrice != null && <p className="text-xs text-slate-400">{fmt(effectivePrice)} €/{def?.unit === "m2" ? "m²" : "ud"}</p>}
                        <p className="text-lg font-bold text-slate-900">{fmt(lineTotal)} €</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={addItem}
            className="no-print mt-3 w-full border-2 border-dashed border-gray-300 hover:border-amber-400 text-slate-500 hover:text-amber-600 rounded-xl py-3 text-sm font-medium transition-colors">
            + Añadir partida
          </button>

          {/* Totals */}
          <div className="mt-5 bg-slate-50 rounded-2xl border border-gray-200 p-5 print-card">
            <div className="max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (sin IVA)</span>
                <span className="font-medium">{fmt(totals.subtotal)} €</span>
              </div>
              {totals.discountPct > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento {totals.discountPct}%</span>
                  <span className="font-medium">-{fmt(totals.discountAmt)} €</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Base imponible</span>
                <span className="font-medium">{fmt(totals.base)} €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA 21%</span>
                <span className="font-medium">{fmt(totals.iva)} €</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-gray-300 pt-3">
                <span>TOTAL</span>
                <span>{fmt(totals.total)} €</span>
              </div>
            </div>
          </div>

          {/* Print signature block */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-10">
            <div>
              <p className="text-xs text-slate-500 mb-8">Firma y sello Valauni S.L.</p>
              <div className="border-b border-gray-400 w-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-8">Firma y conformidad del cliente</p>
              <div className="border-b border-gray-400 w-full" />
              <p className="text-xs text-slate-400 mt-1">{proj.clientName}</p>
            </div>
          </div>

          {/* Notes (print) */}
          {proj.notes && (
            <div className="hidden print:block mt-6 text-xs text-slate-500 border-t border-gray-200 pt-4">
              <p className="font-semibold mb-1">Condiciones:</p>
              <p>{proj.notes}</p>
            </div>
          )}
        </div>

        {/* ── Send action (screen only) ── */}
        <div className="no-print flex flex-col sm:flex-row gap-3 pt-2">
          <button onClick={handleSave}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-full text-sm transition-colors">
            Guardar cambios
          </button>
          {sendState === "ok" ? (
            <div className="flex-1 bg-emerald-50 border border-emerald-400 text-emerald-700 font-semibold py-3 rounded-full text-sm text-center">
              ✓ Enviado al equipo
            </div>
          ) : (
            <button onClick={handleSend} disabled={sendState === "loading"}
              className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-3 rounded-full text-sm transition-colors">
              {sendState === "loading" ? "Enviando…" : "Enviar por email al equipo"}
            </button>
          )}
          {sendState === "error" && <p className="text-red-600 text-sm text-center">Error al enviar. Usa «Imprimir» para guardar el PDF.</p>}
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Project, ProjectStatus, STATUS_META, STATUS_FLOW,
  getProjects, deleteProject, createBlankProject, saveProject,
  calcTotals, fmt,
} from "@/lib/presupuesto";

const ALL_STATUSES: (ProjectStatus | "todos")[] = ["todos", ...STATUS_FLOW];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function PresupuestosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectStatus | "todos">("todos");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "number" | "total">("updatedAt");

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  function handleNew() {
    const p = createBlankProject();
    saveProject(p);
    window.location.href = `/presupuesto/${p.id}`;
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    deleteProject(id);
    setProjects(getProjects());
  }

  function handleDuplicate(proj: Project, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { getProjects: _g, ..._ } = { getProjects: null };
    void _;
    const newP: Project = {
      ...proj,
      id: crypto.randomUUID(),
      number: `${proj.number}-COPIA`,
      status: "borrador",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(newP);
    setProjects(getProjects());
  }

  // Stats
  const activeProjects = projects.filter((p) => !["cancelado", "finalizado"].includes(p.status));
  const totalPending = activeProjects.reduce((a, p) => a + calcTotals(p.items, p.discount).total, 0);
  const acceptedProjects = projects.filter((p) => p.status === "aceptado" || p.status === "en_obra");
  const totalAccepted = acceptedProjects.reduce((a, p) => a + calcTotals(p.items, p.discount).total, 0);

  // Filter + search + sort
  const visible = projects
    .filter((p) => filter === "todos" || p.status === filter)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.number.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.projectDescription.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "number") return a.number.localeCompare(b.number);
      if (sortBy === "total") return calcTotals(b.items, b.discount).total - calcTotals(a.items, a.discount).total;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top bar ── */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div>
              <span className="text-lg font-bold tracking-tight text-amber-400">Valauni</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline">Carpintería PVC &amp; Aluminio · Mallorca</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors hidden sm:block">Web</Link>
            <span className="text-amber-400 font-semibold">Presupuestos</span>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* ── Sidebar ── */}
        <aside className="w-48 shrink-0 hidden md:flex flex-col gap-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Estado</p>
          {ALL_STATUSES.map((s) => {
            const count = s === "todos" ? projects.length : projects.filter((p) => p.status === s).length;
            const meta = s !== "todos" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === s
                    ? "bg-amber-400 text-slate-900"
                    : "text-slate-600 hover:bg-gray-200"
                }`}
              >
                <span>{meta?.label ?? "Todos"}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === s ? "bg-slate-900/20 text-slate-900" : "bg-gray-200 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total proyectos" value={String(projects.length)} />
            <StatCard label="Activos" value={String(activeProjects.length)} sub="en curso" />
            <StatCard label="Pendiente cobro" value={`${fmt(totalPending)} €`} sub="activos sin cerrar" />
            <StatCard label="En obra / aceptados" value={`${fmt(totalAccepted)} €`} />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por cliente, nº, descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="updatedAt">Más reciente</option>
              <option value="number">Nº proyecto</option>
              <option value="total">Importe</option>
            </select>
            {/* Mobile status filter */}
            <select
              className="md:hidden border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s === "todos" ? "Todos" : STATUS_META[s].label}</option>
              ))}
            </select>
            <button
              onClick={handleNew}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              + Nuevo proyecto
            </button>
          </div>

          {/* Table */}
          {visible.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-slate-500 font-medium">
                {projects.length === 0 ? "No hay proyectos aún" : "No hay resultados para este filtro"}
              </p>
              {projects.length === 0 && (
                <button onClick={handleNew} className="mt-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold px-6 py-2 rounded-full text-sm transition-colors">
                  Crear primer proyecto
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[90px_1fr_1fr_110px_100px_90px] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <span>Nº</span>
                <span>Cliente</span>
                <span>Descripción / Ubicación</span>
                <span className="text-right">Importe</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>

              <div className="divide-y divide-gray-100">
                {visible.map((proj) => {
                  const { total } = calcTotals(proj.items, proj.discount);
                  const meta = STATUS_META[proj.status];
                  const date = new Date(proj.updatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });

                  return (
                    <Link
                      key={proj.id}
                      href={`/presupuesto/${proj.id}`}
                      className="flex sm:grid sm:grid-cols-[90px_1fr_1fr_110px_100px_90px] gap-2 sm:gap-4 px-4 py-3 hover:bg-amber-50 transition-colors items-center"
                    >
                      {/* Nº */}
                      <div>
                        <span className="font-mono text-sm font-bold text-slate-700">{proj.number}</span>
                        <p className="text-xs text-slate-400 mt-0.5 sm:hidden">{date}</p>
                      </div>
                      {/* Client */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{proj.clientName || <span className="text-slate-400 font-normal italic">Sin cliente</span>}</p>
                        <p className="text-xs text-slate-400 truncate hidden sm:block">{date}</p>
                      </div>
                      {/* Description */}
                      <div className="min-w-0 hidden sm:block">
                        <p className="text-sm text-slate-600 truncate">{proj.projectDescription || proj.location || <span className="italic text-slate-400">Sin descripción</span>}</p>
                        <p className="text-xs text-slate-400">{proj.items.length} partida{proj.items.length !== 1 ? "s" : ""}</p>
                      </div>
                      {/* Total */}
                      <div className="sm:text-right ml-auto sm:ml-0">
                        <span className="text-sm font-bold text-slate-900">{fmt(total)} €</span>
                      </div>
                      {/* Status */}
                      <div>
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        <button
                          onClick={(e) => handleDuplicate(proj, e)}
                          title="Duplicar"
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors text-xs"
                        >
                          ⧉
                        </button>
                        <button
                          onClick={(e) => handleDelete(proj.id, e)}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

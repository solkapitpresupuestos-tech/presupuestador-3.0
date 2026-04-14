export default function Header() {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-tight text-amber-400">
            Valauni
          </span>
          <span className="text-xs text-slate-400 hidden sm:block">
            Carpintería PVC &amp; Aluminio · Mallorca
          </span>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <a
            href="#servicios"
            className="text-slate-300 hover:text-amber-400 transition-colors"
          >
            Servicios
          </a>
          <a
            href="#contacto"
            className="bg-amber-400 text-slate-900 px-4 py-1.5 rounded-full hover:bg-amber-300 transition-colors font-semibold"
          >
            Presupuesto
          </a>
        </nav>
      </div>
    </header>
  );
}

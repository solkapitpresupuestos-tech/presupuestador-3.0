export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div>
          <span className="text-amber-400 font-bold text-base">Valauni</span>
          <span className="ml-2 text-slate-500">
            Carpintería PVC &amp; Aluminio · Mallorca
          </span>
        </div>
        <div className="flex gap-6">
          <a href="tel:+34600000000" className="hover:text-amber-400 transition-colors">
            +34 600 000 000
          </a>
          <a
            href="mailto:info@valauni.com"
            className="hover:text-amber-400 transition-colors"
          >
            info@valauni.com
          </a>
        </div>
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} Valauni. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

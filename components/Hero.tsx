export default function Hero() {
  return (
    <section className="bg-slate-900 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-4">
          Carpintería de aluminio y PVC · Mallorca
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
          Ventanas y puertas de calidad superior
        </h1>
        <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
          Fabricación e instalación de carpintería de PVC y aluminio en
          Mallorca. Más de 15 años de experiencia, garantía de calidad y
          presupuesto sin compromiso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contacto"
            className="bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-amber-300 transition-colors"
          >
            Pedir presupuesto gratis
          </a>
          <a
            href="#servicios"
            className="border border-slate-500 text-slate-300 font-semibold px-8 py-4 rounded-full text-lg hover:border-amber-400 hover:text-amber-400 transition-colors"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}

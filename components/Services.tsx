const services = [
  {
    icon: "🪟",
    title: "Ventanas PVC",
    description:
      "Ventanas de alta eficiencia energética en PVC. Aislamiento térmico y acústico superior, disponibles en múltiples colores y acabados.",
    features: ["Doble o triple acristalamiento", "Alta eficiencia energética", "Bajo mantenimiento"],
  },
  {
    icon: "🚪",
    title: "Puertas de Aluminio",
    description:
      "Puertas de entrada, correderas y plegables en aluminio. Diseño moderno con máxima seguridad y durabilidad.",
    features: ["Perfiles de alta resistencia", "Cierre multipalanca", "Opciones de seguridad"],
  },
  {
    icon: "🔲",
    title: "Persianas y Contraventanas",
    description:
      "Persianas enrollables, venecianas y contraventanas. Control total de la luz y privacidad con operación manual o motorizada.",
    features: ["Motorización opcional", "Aislamiento térmico", "Múltiples materiales"],
  },
  {
    icon: "🏗️",
    title: "Cerramientos",
    description:
      "Cerramientos de terrazas y porches en aluminio y PVC. Ampliamos tu espacio habitable aprovechando el clima de Mallorca.",
    features: ["Diseño a medida", "Cristal templado", "Ventilación controlada"],
  },
  {
    icon: "🦟",
    title: "Mosquiteras",
    description:
      "Mosquiteras enrollables, plisadas y fijas para ventanas y puertas. Protección total contra insectos sin perder visibilidad.",
    features: ["Enrollable o fija", "Varios colores", "Fácil instalación"],
  },
  {
    icon: "🔧",
    title: "Reparación y Mantenimiento",
    description:
      "Servicio de reparación y mantenimiento de ventanas, puertas y cerramientos. Cambio de gomas, regulación y ajuste de herrajes.",
    features: ["Servicio rápido", "Garantía en reparaciones", "Presupuesto sin cargo"],
  },
];

export default function Services() {
  return (
    <section id="servicios" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-3">
            Lo que hacemos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Nuestros servicios
          </h2>
          <p className="text-slate-600 mt-4 max-w-xl mx-auto">
            Soluciones completas de carpintería en PVC y aluminio, fabricadas a
            medida para tu hogar o negocio en Mallorca.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {service.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {service.description}
              </p>
              <ul className="space-y-1">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-amber-500 font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

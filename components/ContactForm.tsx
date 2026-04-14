"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const services = [
  "Ventanas PVC",
  "Puertas de Aluminio",
  "Persianas / Contraventanas",
  "Cerramientos",
  "Mosquiteras",
  "Reparación / Mantenimiento",
  "Otro",
];

export default function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setError("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      service: (form.elements.namedItem("service") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al enviar el formulario");
      setState("success");
      form.reset();
    } catch {
      setState("error");
      setError("No se pudo enviar el mensaje. Por favor, llámanos directamente.");
    }
  }

  return (
    <section id="contacto" className="py-20 px-4 bg-slate-900">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Contacto
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Pide tu presupuesto gratis
          </h2>
          <p className="text-slate-400 mt-4">
            Cuéntanos qué necesitas y te llamamos en menos de 24 horas.
          </p>
        </div>

        {state === "success" ? (
          <div className="bg-emerald-800/40 border border-emerald-500 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-white text-xl font-bold mb-2">
              ¡Mensaje enviado!
            </h3>
            <p className="text-slate-300">
              Nos pondremos en contacto contigo en menos de 24 horas.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nombre *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Tu nombre"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Teléfono *
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder="+34 600 000 000"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Servicio de interés *
              </label>
              <select
                name="service"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Selecciona un servicio...</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Describe tu proyecto
              </label>
              <textarea
                name="message"
                rows={4}
                placeholder="Cuéntanos qué necesitas: tipo de ventana, medidas aproximadas, urgencia..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            {state === "error" && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-900 font-bold py-4 rounded-full text-base transition-colors"
            >
              {state === "loading" ? "Enviando..." : "Solicitar presupuesto gratis"}
            </button>

            <p className="text-center text-xs text-slate-400">
              También puedes llamarnos directamente:{" "}
              <a
                href="tel:+34600000000"
                className="text-slate-600 font-semibold hover:text-amber-500"
              >
                +34 600 000 000
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

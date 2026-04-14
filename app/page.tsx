import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

const whyUs = [
  { icon: "🏆", label: "+15 años de experiencia en Mallorca" },
  { icon: "📐", label: "Fabricación a medida" },
  { icon: "🛡️", label: "Garantía de 10 años en materiales" },
  { icon: "📞", label: "Presupuesto gratis en 24h" },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />

        {/* Why us bar */}
        <section className="bg-amber-400 py-6 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
            {whyUs.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-slate-900">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-semibold leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <Services />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}

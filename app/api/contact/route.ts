import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");

    const body = await request.json();
    const { name, phone, email, service, message } = body as {
      name: string;
      phone: string;
      email?: string;
      service: string;
      message?: string;
    };

    if (!name || !phone || !service) {
      return Response.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const toEmail = process.env.CONTACT_EMAIL ?? "info@valauni.com";

    await resend.emails.send({
      from: "Valauni Web <noreply@valauni.com>",
      to: toEmail,
      subject: `Nueva solicitud de presupuesto — ${service}`,
      text: [
        `Nuevo contacto desde la web de Valauni`,
        ``,
        `Nombre: ${name}`,
        `Teléfono: ${phone}`,
        `Email: ${email || "No proporcionado"}`,
        `Servicio: ${service}`,
        ``,
        `Mensaje:`,
        message || "(Sin mensaje adicional)",
      ].join("\n"),
      html: `
        <h2>Nueva solicitud de presupuesto</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px">
          <tr><td style="padding:8px;font-weight:bold;width:120px">Nombre</td><td style="padding:8px">${escapeHtml(name)}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Teléfono</td><td style="padding:8px">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${escapeHtml(email ?? "No proporcionado")}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Servicio</td><td style="padding:8px">${escapeHtml(service)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;vertical-align:top">Mensaje</td><td style="padding:8px">${escapeHtml(message ?? "(Sin mensaje adicional)")}</td></tr>
        </table>
      `,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

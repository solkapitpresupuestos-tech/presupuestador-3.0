import jsPDF from "jspdf";
import {
  Project, LineItem, CATALOGUE, CLIENT_TYPE_META,
  calcLineTotal, fmt,
} from "./presupuesto";
import {
  WINDOW_SYSTEMS, APERTURA_OPTIONS, COLOR_OPTIONS, GLASS_OPTIONS, MOUNT_OPTIONS,
  calcWindowCost,
} from "./windows";

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANY = {
  name: "Valauni S.L.",
  tagline: "Carpintería PVC y Aluminio · Mallorca",
  address: "C/ Example 123, 07001 Palma de Mallorca",
  phone: "+34 971 000 000",
  email: "info@valauni.com",
  web: "valauni.com",
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const COL_W = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function itemLabel(item: LineItem): string {
  if (item.productKey === "ventana_win" && item.windowCalc) {
    const sys = WINDOW_SYSTEMS[item.windowCalc.systemKey]?.label ?? item.windowCalc.systemKey;
    const apt = APERTURA_OPTIONS.find((a) => a.key === item.windowCalc!.aperturaType)?.label ?? item.windowCalc.aperturaType;
    const color = COLOR_OPTIONS.find((c) => c.key === item.windowCalc!.colorKey)?.label ?? item.windowCalc.colorKey;
    const glass = GLASS_OPTIONS.find((g) => g.key === item.windowCalc!.glassKey)?.label ?? item.windowCalc.glassKey;
    const mount = MOUNT_OPTIONS.find((m) => m.key === item.windowCalc!.mountKey)?.label ?? item.windowCalc.mountKey;
    return `${sys} · ${apt} · ${color} · ${glass} · ${mount}`;
  }
  if (item.productKey === "otro") return item.manualLabel || "Partida libre";
  return CATALOGUE[item.productKey]?.label ?? item.productKey;
}

// ─── Image loader ─────────────────────────────────────────────────────────────

const APERTURA_IMAGES: Record<string, string> = {
  corredera_2h:    "/ventana_corredera_2h.png",
  corredera_4h:    "/ventana_corredera_2h.png",
  fija:            "/ventana_fijo.png",
  oscilobatiente:  "/ventana_ob_1h.png",
  abatible:        "/ventana_practicable_1h.png",
  practicable_1h:  "/ventana_practicable_1h.png",
  practicable_2h:  "/ventana_practicable_2h.png",
  puerta_1h:       "/puerta_practicable_1h.png",
  puerta_2h:       "/puerta_practicable_2h.png",
  elevable:        "/ventana_corredera_2h.png",
};

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ─── PDF generator ─────────────────────────────────────────────────────────

export async function generatePresupuestoPDF(proj: Project): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.setFont("helvetica");

  // Pre-load images
  const [logoB64, ...aperturaB64s] = await Promise.all([
    loadImageAsBase64("/logo_valauni.png"),
    ...Object.values(APERTURA_IMAGES).filter((v, i, a) => a.indexOf(v) === i).map(loadImageAsBase64),
  ]);
  const aperturaKeys = Object.values(APERTURA_IMAGES).filter((v, i, a) => a.indexOf(v) === i);
  const imageCache: Record<string, string> = {};
  aperturaKeys.forEach((path, i) => { if (aperturaB64s[i]) imageCache[path] = aperturaB64s[i]!; });

  let y = MARGIN;

  // ── Header ──
  // Left: logo or company name + tagline
  if (logoB64) {
    doc.addImage(logoB64, "PNG", MARGIN, y, 35, 12, undefined, "FAST");
    y += 2;
  } else {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text(COMPANY.name, MARGIN, y + 6);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 113, 108); // stone-500
  doc.text(COMPANY.tagline, MARGIN, y + 14);

  // Right: company contact
  doc.setFontSize(8);
  doc.setTextColor(120, 113, 108);
  const contactLines = [
    COMPANY.address,
    `Tel: ${COMPANY.phone}`,
    COMPANY.email,
    COMPANY.web,
  ];
  contactLines.forEach((line, i) => {
    doc.text(line, PAGE_W - MARGIN, y + 4 + i * 4.5, { align: "right" });
  });

  y += 22;

  // Yellow separator bar
  doc.setFillColor(252, 211, 77); // yellow-300
  doc.rect(MARGIN, y, COL_W, 1, "F");
  y += 5;

  // ── Quote info row ──
  const issuedDate = new Date(proj.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const docTitle = `PRESUPUESTO ${proj.number}`;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text(docTitle, MARGIN, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 113, 108);
  doc.text(`Fecha: ${issuedDate}`, PAGE_W - MARGIN, y + 3, { align: "right" });
  doc.text(`Validez: ${proj.validityDays || "30"} días`, PAGE_W - MARGIN, y + 8, { align: "right" });

  y += 14;

  // ── Client box ──
  if (proj.clientName || proj.clientEmail || proj.clientPhone) {
    doc.setFillColor(250, 250, 249); // stone-50
    doc.setDrawColor(214, 211, 209); // stone-300
    doc.roundedRect(MARGIN, y, COL_W, 22, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 113, 108);
    doc.text("CLIENTE", MARGIN + 4, y + 5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text(proj.clientName || "—", MARGIN + 4, y + 11);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(87, 83, 78); // stone-600
    const clientInfo = [proj.clientPhone, proj.clientEmail, proj.clientAddress, proj.clientNif ? `NIF: ${proj.clientNif}` : ""]
      .filter(Boolean).join("  ·  ");
    if (clientInfo) doc.text(clientInfo, MARGIN + 4, y + 16.5);

    if (proj.projectDescription || proj.location) {
      const descStr = [proj.projectDescription, proj.location].filter(Boolean).join(" — ");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 113, 108);
      const descLines = splitText(doc, descStr, COL_W - 8);
      doc.text(descLines[0] ?? "", MARGIN + 4, y + 21);
    }
    y += 26;
  }

  // ── Items table ──
  y += 2;

  // Table header
  const COL = {
    num:   { x: MARGIN, w: 7 },
    desc:  { x: MARGIN + 7, w: 90 },
    dims:  { x: MARGIN + 97, w: 30 },
    qty:   { x: MARGIN + 127, w: 15 },
    unit:  { x: MARGIN + 142, w: 22 },
    total: { x: MARGIN + 164, w: COL_W - 164 },
  };

  doc.setFillColor(28, 25, 23);
  doc.rect(MARGIN, y, COL_W, 6, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("#", COL.num.x + 1.5, y + 4);
  doc.text("DESCRIPCIÓN", COL.desc.x + 1, y + 4);
  doc.text("DIMENSIONES", COL.dims.x + 1, y + 4);
  doc.text("UDS", COL.qty.x + 1, y + 4);
  doc.text("PRECIO UNIT.", COL.unit.x + 1, y + 4);
  doc.text("TOTAL", COL.total.x + COL.total.w - 1, y + 4, { align: "right" });

  y += 6;

  // Effective beneficio factor (baked into each line item price)
  const rawBenPct = proj.beneficioPct && parseFloat(proj.beneficioPct) >= 0
    ? parseFloat(proj.beneficioPct)
    : proj.clientType ? CLIENT_TYPE_META[proj.clientType].beneficioPct : 0;
  const beneficioFactor = 1 + rawBenPct / 100;

  // Rows
  proj.items.forEach((item, idx) => {
    const baseCost = calcLineTotal(item);
    const lineTotal = baseCost * beneficioFactor; // inclusive: material+fab+cristal+montaje+beneficio
    const qty = parseFloat(item.qty) || 1;
    const unitPrice = qty > 0 ? lineTotal / qty : 0;
    const label = itemLabel(item);
    const dims = item.widthCm && item.heightCm
      ? `${item.widthCm} × ${item.heightCm} cm`
      : "—";
    const isWin = item.productKey === "ventana_win" && item.windowCalc;
    const IMG_W = isWin ? 22 : 0; // space reserved for window image (bigger)
    const IMG_H = 24;
    const descX = COL.desc.x + 1 + IMG_W;
    const descAvailW = COL.desc.w - 2 - IMG_W;

    const labelLines = splitText(doc, label, descAvailW);
    const descLines = item.description ? splitText(doc, item.description, descAvailW) : [];
    const rowLines = labelLines.length + (descLines.length > 0 ? descLines.length + 0.3 : 0);
    const rowH = Math.max(isWin ? IMG_H + 4 : 8, rowLines * 5.2 + 4);

    // Page break
    if (y + rowH > PAGE_H - 30) {
      doc.addPage();
      y = MARGIN;
    }

    // Row bg (alternating)
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 249); // stone-50
      doc.rect(MARGIN, y, COL_W, rowH, "F");
    }

    doc.setDrawColor(231, 229, 228); // stone-200
    doc.line(MARGIN, y + rowH, MARGIN + COL_W, y + rowH);

    // Row index
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 113, 108);
    doc.text(String(idx + 1), COL.num.x + 1.5, y + 4.5);

    // Window PNG icon
    if (isWin && item.windowCalc) {
      const imgPath = APERTURA_IMAGES[item.windowCalc.aperturaType];
      const imgB64 = imgPath ? imageCache[imgPath] : null;
      if (imgB64) {
        doc.addImage(imgB64, "PNG", COL.desc.x + 1, y + 2, IMG_W - 1, IMG_H, undefined, "FAST");
      }
    }

    // Label
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text(labelLines, descX, y + 5.5);

    // Description sub-line
    if (descLines.length > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(120, 113, 108);
      doc.text(descLines, descX, y + 5.5 + labelLines.length * 4.5);
    }

    // Dims
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(87, 83, 78);
    doc.text(dims, COL.dims.x + 1, y + 4.5);

    // Qty
    doc.text(item.qty || "1", COL.qty.x + COL.qty.w - 1, y + 4.5, { align: "right" });

    // Unit price (all-inclusive: cost already includes fabricación)
    doc.text(`${fmt(unitPrice)} €`, COL.unit.x + COL.unit.w - 1, y + 4.5, { align: "right" });

    // Total
    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text(`${fmt(lineTotal)} €`, COL.total.x + COL.total.w - 1, y + 4.5, { align: "right" });

    y += rowH;
  });

  // ── Totals ──
  y += 4;
  if (y > PAGE_H - 50) {
    doc.addPage();
    y = MARGIN;
  }

  // Totals: unit prices already include beneficio, so compute from inclusive lineTotals
  const inclusiveSubtotal = proj.items.reduce((s, i) => s + calcLineTotal(i) * beneficioFactor, 0);
  const discountPct = Math.min(100, Math.max(0, parseFloat(proj.discount) || 0));
  const discountAmt = (inclusiveSubtotal * discountPct) / 100;
  const base = inclusiveSubtotal - discountAmt;
  const iva = base * 0.21;
  const total = base + iva;

  const totalsX = MARGIN + COL_W - 80;
  const totalsW = 80;

  function totRow(label: string, value: string, bold = false, color?: [number, number, number]) {
    if (y > PAGE_H - 20) { doc.addPage(); y = MARGIN; }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 8.5);
    const c = color ?? (bold ? [28, 25, 23] as [number,number,number] : [87, 83, 78] as [number,number,number]);
    doc.setTextColor(c[0], c[1], c[2]);
    doc.text(label, totalsX, y);
    doc.text(value, totalsX + totalsW, y, { align: "right" });
    y += bold ? 6 : 5;
  }

  totRow("Subtotal:", `${fmt(inclusiveSubtotal)} €`);
  if (discountPct > 0) {
    totRow(`Descuento (${discountPct}%):`, `−${fmt(discountAmt)} €`, false, [21, 128, 61]);
  }
  totRow("Base imponible:", `${fmt(base)} €`);
  totRow("IVA 21%:", `${fmt(iva)} €`);

  doc.setDrawColor(252, 211, 77);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, totalsX + totalsW, y);
  y += 2;

  totRow("TOTAL:", `${fmt(total)} €`, true);

  // ── Conditions row (delivery + payment) ──
  y += 6;
  if (y > PAGE_H - 50) { doc.addPage(); y = MARGIN; }

  const thirdW = (COL_W - 8) / 3;
  // Delivery box
  doc.setFillColor(250, 250, 249);
  doc.setDrawColor(214, 211, 209);
  doc.roundedRect(MARGIN, y, thirdW, 14, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 113, 108);
  doc.text("PLAZO DE ENTREGA", MARGIN + 3, y + 4.5);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text(`${proj.deliveryWeeks || "4-6"} semanas`, MARGIN + 3, y + 10.5);

  // Payment box
  const px = MARGIN + thirdW + 4;
  doc.roundedRect(px, y, thirdW, 14, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 113, 108);
  doc.text("CONDICIONES DE PAGO", px + 3, y + 4.5);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(28, 25, 23);
  const payLines = splitText(doc, proj.paymentTerms || "50% firma, 50% entrega", thirdW - 6);
  doc.text(payLines[0] ?? "", px + 3, y + 10.5);

  // Guarantee box
  const gx = MARGIN + (thirdW + 4) * 2;
  doc.roundedRect(gx, y, thirdW, 14, 1.5, 1.5, "FD");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 113, 108);
  doc.text("GARANTÍA", gx + 3, y + 4.5);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(28, 25, 23);
  doc.text("2 años", gx + 3, y + 10.5);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 113, 108);
  doc.text("materiales e instalación", gx + 3, y + 14);

  y += 18;

  // ── Notes ──
  if (proj.notes) {
    y += 2;
    if (y > PAGE_H - 40) { doc.addPage(); y = MARGIN; }

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 113, 108);
    doc.text("NOTAS Y CONDICIONES", MARGIN, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(87, 83, 78);
    const noteLines = splitText(doc, proj.notes, COL_W);
    noteLines.forEach((line: string) => {
      if (y > PAGE_H - 20) { doc.addPage(); y = MARGIN; }
      doc.text(line, MARGIN, y);
      y += 3.8;
    });
  }

  // ── Signature block ──
  y += 10;
  if (y > PAGE_H - 35) { doc.addPage(); y = MARGIN; }

  doc.setDrawColor(214, 211, 209);
  doc.setLineWidth(0.3);

  const sigW = 60;
  // Company sign
  doc.line(MARGIN, y + 18, MARGIN + sigW, y + 18);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 113, 108);
  doc.text("Firma y sello empresa", MARGIN, y + 22);
  doc.text(COMPANY.name, MARGIN, y + 26);

  // Client sign
  doc.line(MARGIN + COL_W - sigW, y + 18, MARGIN + COL_W, y + 18);
  doc.text("Firma y conformidad cliente", MARGIN + COL_W - sigW, y + 22);
  if (proj.clientName) doc.text(proj.clientName, MARGIN + COL_W - sigW, y + 26);

  // ── Footer on each page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(163, 155, 153); // stone-400
    doc.text(`${COMPANY.name} · ${COMPANY.web} · ${COMPANY.phone}`, MARGIN, PAGE_H - 6);
    doc.text(`Pág. ${i} / ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 6, { align: "right" });
    doc.setDrawColor(214, 211, 209);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 10, PAGE_W - MARGIN, PAGE_H - 10);
  }

  // ── Save ──
  const filename = `Presupuesto_${proj.number}_${proj.clientName.replace(/\s+/g, "_") || "cliente"}.pdf`;
  doc.save(filename);
}

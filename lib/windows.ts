// Window profile systems, calculation engine, FFD bar optimization

export const BAR_LENGTH_MM = 6500;

// ─── Profile systems ──────────────────────────────────────────────────────────

export interface ProfileSpec {
  ref: string;
  label: string;
  pricePerBarLB: number; // € per LINEAR METER, white lacquered (LB). Bar cost = pricePerBarLB × 6.5 × colorMultiplier
}

export interface WindowSystem {
  label: string;
  systemType: "corredera" | "practicable" | "elevable" | "oculta";
  compatibleAperturas: string[];
  profiles: {
    marco: ProfileSpec;
    hoja?: ProfileSpec;
    cruce?: ProfileSpec;
    carril?: ProfileSpec;
    tapeta?: ProfileSpec; // cover strip (tapajuntas) perimetral — practicable/oculta
  };
  herrajes: number; // fixed hardware cost per unit €
}

export const WINDOW_SYSTEMS: Record<string, WindowSystem> = {
  ALBA_PROS_60: {
    label: "ALBA PROS 60",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h"],
    profiles: {
      marco: { ref: "Marco 50 corredera", label: "Marco",  pricePerBarLB: 5.09 },
      hoja:  { ref: "Hoja corredera",     label: "Hoja",   pricePerBarLB: 4.66 },
      cruce: { ref: "Cruce panorámico",   label: "Cruce",  pricePerBarLB: 3.12 },
    },
    herrajes: 55, // carriles, rodamientos, pestillo seguridad
  },
  ALBA_PROS_70: {
    label: "ALBA PROS 70",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h", "corredera_4h"],
    profiles: {
      marco: { ref: "Marco corredera",    label: "Marco",  pricePerBarLB: 6.89 },
      hoja:  { ref: "Hoja corredera",     label: "Hoja",   pricePerBarLB: 7.13 },
      cruce: { ref: "Cruce panorámico",   label: "Cruce",  pricePerBarLB: 4.82 },
    },
    herrajes: 65,
  },
  ALBA_PROS_70_RPT: {
    label: "ALBA PROS 70 RPT",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h", "corredera_4h"],
    profiles: {
      marco: { ref: "RT865 Marco cerrado", label: "Marco", pricePerBarLB: 8.77 },
      hoja:  { ref: "RT861 Hoja",          label: "Hoja",  pricePerBarLB: 9.59 },
      cruce: { ref: "Cruce panorámico",    label: "Cruce", pricePerBarLB: 4.15 },
    },
    herrajes: 75,
  },
  ALBA_PROS_75_RPT: {
    label: "ALBA PROS 75 RPT",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h", "corredera_4h"],
    profiles: {
      marco: { ref: "Marco 75 RPT", label: "Marco", pricePerBarLB: 10.20 },
      hoja:  { ref: "Hoja 75 RPT",  label: "Hoja",  pricePerBarLB: 10.50 },
      cruce: { ref: "Cruce 75 RPT", label: "Cruce", pricePerBarLB: 5.00  },
    },
    herrajes: 85,
  },
  ALBA_PROS_85_RPT: {
    label: "ALBA PROS 85 RPT",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h", "corredera_4h"],
    profiles: {
      marco: { ref: "RT890 Marco nuevo", label: "Marco", pricePerBarLB: 12.93 },
      hoja:  { ref: "RT881 Hoja",        label: "Hoja",  pricePerBarLB: 11.50 },
      cruce: { ref: "Cruce 85",          label: "Cruce", pricePerBarLB: 5.80  },
    },
    herrajes: 95,
  },
  ELEVABLE_120_RPT: {
    label: "ELEVABLE 120 RPT",
    systemType: "elevable",
    compatibleAperturas: ["elevable"],
    profiles: {
      marco:  { ref: "RT120 Marco",  label: "Marco",  pricePerBarLB: 19.83 },
      hoja:   { ref: "RT124 Hoja",   label: "Hoja",   pricePerBarLB: 13.67 },
      carril: { ref: "Carril rod.",  label: "Carril", pricePerBarLB: 1.01  },
    },
    herrajes: 220, // mecanismo elevación, rodamientos de carga, cierre multipunto
  },
  PROSYSTEM_ELITE_100: {
    label: "PROSYSTEM ELITE 100",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h", "corredera_4h"],
    profiles: {
      marco: { ref: "RT54600 Marco",  label: "Marco", pricePerBarLB: 12.92 },
      hoja:  { ref: "RT54602 Hoja V", label: "Hoja",  pricePerBarLB: 8.39  },
      cruce: { ref: "Cruce Elite",    label: "Cruce", pricePerBarLB: 6.00  },
    },
    herrajes: 90,
  },
  PROSYSTEM_ELITE_140: {
    label: "PROSYSTEM ELITE 140",
    systemType: "corredera",
    compatibleAperturas: ["fija", "corredera_2h", "corredera_4h"],
    profiles: {
      marco: { ref: "RT54400 Marco",    label: "Marco", pricePerBarLB: 15.46 },
      hoja:  { ref: "RT54421 Hoja V",   label: "Hoja",  pricePerBarLB: 10.41 },
      cruce: { ref: "Cruce Elite 140",  label: "Cruce", pricePerBarLB: 7.00  },
    },
    herrajes: 110,
  },
  ALBA_40_ABISAGRADA: {
    label: "ALBA 40 ABISAGRADA",
    systemType: "practicable",
    compatibleAperturas: ["fija", "oscilobatiente", "abatible", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"],
    profiles: {
      marco:  { ref: "Marco 40",        label: "Marco",  pricePerBarLB: 4.50 },
      hoja:   { ref: "Hoja 40",         label: "Hoja",   pricePerBarLB: 4.20 },
      tapeta: { ref: "Tapajuntas 40",   label: "Tapeta", pricePerBarLB: 1.80 },
    },
    herrajes: 65, // cremona multipunto, bisagras europeas, manilla
  },
  ALFIL_45_RPT: {
    label: "ALFIL 45 RPT",
    systemType: "practicable",
    compatibleAperturas: ["fija", "oscilobatiente", "abatible", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"],
    profiles: {
      marco:  { ref: "Marco Alfil 45",    label: "Marco",  pricePerBarLB: 7.10 },
      hoja:   { ref: "Hoja Alfil 45",     label: "Hoja",   pricePerBarLB: 7.40 },
      tapeta: { ref: "Tapajuntas Alfil",  label: "Tapeta", pricePerBarLB: 2.60 },
    },
    herrajes: 80,
  },
  ALBA_65_RPT: {
    label: "ALBA 65 RPT",
    systemType: "practicable",
    compatibleAperturas: ["fija", "oscilobatiente", "abatible", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"],
    profiles: {
      marco:  { ref: "RT650 Marco",      label: "Marco",  pricePerBarLB: 9.17 },
      hoja:   { ref: "RT651 Hoja",       label: "Hoja",   pricePerBarLB: 9.87 },
      tapeta: { ref: "Tapajuntas RT650", label: "Tapeta", pricePerBarLB: 3.20 },
    },
    herrajes: 90,
  },
  ALBA_75_RPT: {
    label: "ALBA 75 RPT",
    systemType: "practicable",
    compatibleAperturas: ["fija", "oscilobatiente", "abatible", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"],
    profiles: {
      marco:  { ref: "RT750 Marco",      label: "Marco",  pricePerBarLB: 10.16 },
      hoja:   { ref: "RT761 Hoja",       label: "Hoja",   pricePerBarLB: 11.52 },
      tapeta: { ref: "Tapajuntas RT750", label: "Tapeta", pricePerBarLB: 3.80  },
    },
    herrajes: 100,
  },
  HO50_RPT: {
    label: "HOJA OCULTA HO50 RPT",
    systemType: "oculta",
    compatibleAperturas: ["fija", "oscilobatiente", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"],
    profiles: {
      marco:  { ref: "Marco HO50",      label: "Marco",  pricePerBarLB: 8.50 },
      hoja:   { ref: "Hoja HO50",       label: "Hoja",   pricePerBarLB: 8.80 },
      tapeta: { ref: "Tapajuntas HO50", label: "Tapeta", pricePerBarLB: 2.90 },
    },
    herrajes: 105, // bisagras ocultas, cremona, manilla invisible
  },
  HO70_RPT: {
    label: "HOJA OCULTA HO70 RPT",
    systemType: "oculta",
    compatibleAperturas: ["fija", "oscilobatiente", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"],
    profiles: {
      marco:  { ref: "Marco HO70",      label: "Marco",  pricePerBarLB: 10.30 },
      hoja:   { ref: "Hoja HO70",       label: "Hoja",   pricePerBarLB: 10.80 },
      tapeta: { ref: "Tapajuntas HO70", label: "Tapeta", pricePerBarLB: 3.40  },
    },
    herrajes: 125,
  },
};

// ─── Options catalogues ───────────────────────────────────────────────────────

export const COLOR_OPTIONS = [
  { key: "LB",  label: "Blanco lacado (LB)",         multiplier: 1.00 },
  { key: "LC",  label: "Laca color estándar (LC)",    multiplier: 1.11 },
  { key: "LT",  label: "Laca color texturizada (LT)", multiplier: 1.14 },
  { key: "BC",  label: "Bicapa color/blanco (BC)",    multiplier: 1.17 },
  { key: "BR",  label: "Bicapa color/color (BR)",     multiplier: 1.20 },
  { key: "ANM", label: "Anodizado natural mate (ANM)",multiplier: 1.29 },
  { key: "NR",  label: "Negro RAL 9005 (NR)",         multiplier: 1.31 },
  { key: "OM",  label: "Madera roble (OM)",           multiplier: 1.22 },
  { key: "OR",  label: "Madera nogal (OR)",           multiplier: 1.42 },
];

export const GLASS_OPTIONS = [
  { key: "simple_4",         label: "Float 4 mm",                       pricePerM2: 18  },
  { key: "climalit_446",     label: "Climalit 4+6+4",                   pricePerM2: 32  },
  { key: "climalit_4124",    label: "Climalit 4+12+4",                  pricePerM2: 38  },
  { key: "climalit_4164",    label: "Climalit 4+16+4",                  pricePerM2: 45  },
  { key: "climalit_be_4124", label: "Climalit b.e. 4+12+4 (low-e)",    pricePerM2: 56  },
  { key: "climalit_be_4164", label: "Climalit b.e. 4+16+4 (low-e)",    pricePerM2: 65  },
  { key: "solar_4164",       label: "Control solar 4+16+4 SCn",         pricePerM2: 78  },
  { key: "triple_4124124",   label: "Triple 4+12+4+12+4",               pricePerM2: 105 },
  { key: "laminado_331",     label: "Laminado 3+3+1",                   pricePerM2: 42  },
  { key: "laminado_441",     label: "Laminado 4+4+1",                   pricePerM2: 52  },
  { key: "lam_be_4164",      label: "Laminado + b.e. 4+16+4.1",        pricePerM2: 88  },
  { key: "templado_6",       label: "Templado 6 mm",                    pricePerM2: 48  },
];

export const MOUNT_OPTIONS = [
  { key: "sin_montaje",       label: "Sin montaje",                 pricePerM2: 0   },
  { key: "sin_retirada",      label: "Montaje s/ retirada",         pricePerM2: 75  },
  { key: "retirada_aluminio", label: "Retirada aluminio + montaje", pricePerM2: 88  },
  { key: "retirada_madera",   label: "Retirada madera + montaje",   pricePerM2: 100 },
  { key: "obra_nueva",        label: "Obra nueva (con premarco)",   pricePerM2: 65  },
];

export const APERTURA_OPTIONS = [
  { key: "fija",            label: "Fija",                 types: ["corredera","practicable","elevable","oculta"] },
  { key: "corredera_2h",    label: "Corredera 2 hojas",    types: ["corredera"] },
  { key: "corredera_4h",    label: "Corredera 4 hojas",    types: ["corredera"] },
  { key: "oscilobatiente",  label: "Oscilobatiente",       types: ["practicable","oculta"] },
  { key: "abatible",        label: "Abatible",             types: ["practicable"] },
  { key: "practicable_1h",  label: "Practicable 1 hoja",   types: ["practicable","oculta"] },
  { key: "practicable_2h",  label: "Practicable 2 hojas",  types: ["practicable","oculta"] },
  { key: "puerta_1h",       label: "Puerta 1 hoja",        types: ["practicable","oculta"] },
  { key: "puerta_2h",       label: "Puerta 2 hojas",       types: ["practicable","oculta"] },
  { key: "elevable",        label: "Elevable",             types: ["elevable"] },
];

// ─── Profile meter consumption ────────────────────────────────────────────────

export interface ProfileMeters {
  marco: number;
  hoja?: number;
  cruce?: number;
  carril?: number;
  tapeta?: number; // perimeter cover strip
}

export function getProfileMeters(aperturaType: string, wM: number, hM: number): ProfileMeters {
  const w = wM, h = hM;
  const marco = (w + h) * 2;
  if (aperturaType === "fija") {
    return { marco };
  }
  if (aperturaType === "corredera_2h") {
    // 2 hojas: each leaf = 2*(w/2+h) → total = 4*(w/2+h). Bug was *2 (only 1 leaf).
    return { marco, hoja: (w / 2 + h) * 4, cruce: h };
  }
  if (aperturaType === "corredera_4h") {
    // 4 hojas: each leaf = 2*(w/4+h) → total = 8*(w/4+h). Bug was *4 (only 2 leaves).
    return { marco, hoja: (w / 4 + h) * 8, cruce: h * 3 };
  }
  if (aperturaType === "oscilobatiente" || aperturaType === "abatible" || aperturaType === "practicable_1h" || aperturaType === "puerta_1h") {
    return { marco, hoja: marco, tapeta: marco };
  }
  if (aperturaType === "practicable_2h" || aperturaType === "puerta_2h") {
    // 2 hojas: each leaf is half the width → 4*(w/2+h)
    return { marco, hoja: (w / 2 + h) * 4, tapeta: marco };
  }
  if (aperturaType === "elevable") {
    return { marco, hoja: marco, carril: w };
  }
  return { marco };
}

// ─── Window cost breakdown ────────────────────────────────────────────────────

export interface WindowCostBreakdown {
  profileCost: number;
  glassCost: number;
  herrajes: number;
  mountCost: number;
  fabricacionCost: number; // = profileCost (mano de obra fabricación)
  selladoCost: number;     // silicona, sellado perimetral y burletes — fixed per unit
  total: number;           // sum of all above (before beneficio)
}

export function calcWindowCost(
  systemKey: string,
  aperturaType: string,
  colorKey: string,
  glassKey: string,
  mountKey: string,
  wM: number,
  hM: number,
): WindowCostBreakdown {
  const system = WINDOW_SYSTEMS[systemKey];
  if (!system || !wM || !hM) {
    return { profileCost: 0, glassCost: 0, herrajes: 0, mountCost: 0, fabricacionCost: 0, selladoCost: 0, total: 0 };
  }

  const colorMult = COLOR_OPTIONS.find((c) => c.key === colorKey)?.multiplier ?? 1.0;
  const glassPrice = GLASS_OPTIONS.find((g) => g.key === glassKey)?.pricePerM2 ?? 38;
  const mountPrice = MOUNT_OPTIONS.find((m) => m.key === mountKey)?.pricePerM2 ?? 0;

  const meters = getProfileMeters(aperturaType, wM, hM);
  let profileCost = 0;

  // Charge per FULL bar: ceil(meters / 6.5) bars × (pricePerM × 6.5) = bars × barCost
  const apply = (key: keyof typeof system.profiles, m: number | undefined, colorized = true) => {
    const p = system.profiles[key];
    if (p && m) {
      const barsNeeded = Math.ceil(m / 6.5);
      const barCost = p.pricePerBarLB * 6.5 * (colorized ? colorMult : 1);
      profileCost += barsNeeded * barCost;
    }
  };
  apply("marco", meters.marco);
  apply("hoja", meters.hoja);
  apply("cruce", meters.cruce, false);
  apply("carril", meters.carril, false);
  apply("tapeta", meters.tapeta, true); // tapeta lacquered same color as frame

  const area = wM * hM;
  const glassCost = area * glassPrice;
  const mountCost = area * mountPrice;
  const herrajes = system.herrajes;

  const fabricacionCost = profileCost; // fabricación = mismo coste que el material de perfiles
  const selladoCost = 18; // silicona neutra, sellado perimetral y burletes de EPDM
  return { profileCost, glassCost, herrajes, mountCost, fabricacionCost, selladoCost, total: profileCost + glassCost + herrajes + mountCost + fabricacionCost + selladoCost };
}

// ─── Cut generation for Material tab ─────────────────────────────────────────

export interface ProfileCut {
  groupKey: string;   // systemKey_profileType_colorKey
  systemKey: string;
  profileType: "marco" | "hoja" | "cruce" | "carril" | "tapeta";
  ref: string;
  systemLabel: string;
  colorKey: string;
  pricePerBarLB: number;
  colorMultiplier: number;
  lengthMm: number;
}

export function getItemCuts(
  systemKey: string,
  aperturaType: string,
  colorKey: string,
  widthCm: number,
  heightCm: number,
  qty: number,
): ProfileCut[] {
  const system = WINDOW_SYSTEMS[systemKey];
  if (!system || !widthCm || !heightCm) return [];

  const wMm = Math.round(widthCm * 10);
  const hMm = Math.round(heightCm * 10);
  const colorMult = COLOR_OPTIONS.find((c) => c.key === colorKey)?.multiplier ?? 1.0;

  const cuts: ProfileCut[] = [];
  type PType = "marco" | "hoja" | "cruce" | "carril" | "tapeta";

  const addCuts = (profileType: PType, lengths: number[]) => {
    const p = system.profiles[profileType];
    if (!p) return;
    for (let q = 0; q < qty; q++) {
      for (const l of lengths) {
        cuts.push({
          groupKey: `${systemKey}_${profileType}_${colorKey}`,
          systemKey,
          profileType,
          ref: p.ref,
          systemLabel: system.label,
          colorKey,
          pricePerBarLB: p.pricePerBarLB,
          colorMultiplier: ["marco", "hoja"].includes(profileType) ? colorMult : 1,
          lengthMm: l,
        });
      }
    }
  };

  // Marco: always 4 pieces (2× width + 2× height)
  addCuts("marco", [wMm, wMm, hMm, hMm]);

  if (aperturaType !== "fija") {
    if (aperturaType === "corredera_2h") {
      const hw = Math.round(wMm / 2);
      addCuts("hoja", [hw, hw, hMm, hMm, hw, hw, hMm, hMm]); // 2 hojas
      addCuts("cruce", [hMm]);
    } else if (aperturaType === "corredera_4h") {
      const hw = Math.round(wMm / 4);
      const hojaLengths: number[] = [];
      for (let i = 0; i < 4; i++) hojaLengths.push(hw, hw, hMm, hMm);
      addCuts("hoja", hojaLengths);
      addCuts("cruce", [hMm, hMm, hMm]);
    } else if (aperturaType === "practicable_2h" || aperturaType === "puerta_2h") {
      const hw = Math.round(wMm / 2);
      addCuts("hoja", [hw, hw, hMm, hMm, hw, hw, hMm, hMm]); // 2 hojas
    } else if (aperturaType === "elevable") {
      addCuts("hoja", [wMm, wMm, hMm, hMm]);
      addCuts("carril", [wMm]);
    } else {
      // oscilobatiente, abatible, practicable_1h, puerta_1h
      addCuts("hoja", [wMm, wMm, hMm, hMm]);
    }
  }

  // Tapeta (cover strip): 4 pieces around outer frame perimeter for practicable/oculta
  const practicableTypes = ["oscilobatiente", "abatible", "practicable_1h", "practicable_2h", "puerta_1h", "puerta_2h"];
  if (practicableTypes.includes(aperturaType)) {
    addCuts("tapeta", [wMm, wMm, hMm, hMm]);
  }

  return cuts;
}

// ─── FFD bin packing ──────────────────────────────────────────────────────────

export interface Bar {
  cuts: number[];     // mm lengths (sorted descending when packed)
  remaining: number;  // mm waste
}

export function optimizeBars(cuts: number[], barLength = BAR_LENGTH_MM): Bar[] {
  const sorted = [...cuts].sort((a, b) => b - a);
  const bars: Bar[] = [];
  for (const cut of sorted) {
    let placed = false;
    for (const bar of bars) {
      if (bar.remaining >= cut) {
        bar.cuts.push(cut);
        bar.remaining -= cut;
        placed = true;
        break;
      }
    }
    if (!placed) bars.push({ cuts: [cut], remaining: barLength - cut });
  }
  return bars;
}

// ─── Material summary ─────────────────────────────────────────────────────────

export interface MaterialGroup {
  groupKey: string;
  systemLabel: string;
  ref: string;
  colorKey: string;
  pricePerBarLB: number;
  colorMultiplier: number;
  cuts: number[];
  bars: Bar[];
  totalMm: number;
  wasteMm: number;
  barsNeeded: number;
  cost: number;
}

export function buildMaterialGroups(cuts: ProfileCut[]): MaterialGroup[] {
  const grouped = new Map<string, ProfileCut[]>();
  for (const c of cuts) {
    const arr = grouped.get(c.groupKey) ?? [];
    arr.push(c);
    grouped.set(c.groupKey, arr);
  }

  return Array.from(grouped.entries()).map(([groupKey, items]) => {
    const first = items[0];
    const lengths = items.map((i) => i.lengthMm);
    const bars = optimizeBars(lengths);
    const totalUsedMm = lengths.reduce((a, b) => a + b, 0);
    const totalBarMm = bars.length * BAR_LENGTH_MM;
    const wasteMm = totalBarMm - totalUsedMm;
    // pricePerBarLB is €/m → bar cost = pricePerBarLB × 6.5 × colorMult
    const pricePerBar = first.pricePerBarLB * 6.5 * first.colorMultiplier;
    return {
      groupKey,
      systemLabel: first.systemLabel,
      ref: first.ref,
      colorKey: first.colorKey,
      pricePerBarLB: first.pricePerBarLB,
      colorMultiplier: first.colorMultiplier,
      cuts: lengths,
      bars,
      totalMm: totalUsedMm,
      wasteMm,
      barsNeeded: bars.length,
      cost: bars.length * pricePerBar,
    };
  });
}

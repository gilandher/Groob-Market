"use client";

import { useState, useEffect } from "react";

// ─── Colombia — Departamentos y ciudades principales ──────────────────────────
export const COLOMBIA_DATA: Record<string, string[]> = {
  "Antioquia": [
    "Medellín","Bello","Itagüí","Envigado","Sabaneta","La Estrella",
    "Copacabana","Girardota","Barbosa","Caldas","Rionegro","Apartadó",
    "Turbo","Caucasia","Chigorodó","El Bagre","Montería","Santa Fe de Antioquia",
  ],
  "Bogotá D.C.": ["Bogotá"],
  "Valle del Cauca": [
    "Cali","Buenaventura","Palmira","Tuluá","Buga","Cartago","Jamundí",
    "Yumbo","Candelaria","Pradera",
  ],
  "Cundinamarca": [
    "Soacha","Facatativá","Zipaquirá","Chía","Fusagasugá","Mosquera",
    "Madrid","Funza","Girardot","La Mesa",
  ],
  "Atlántico": ["Barranquilla","Soledad","Malambo","Sabanalarga","Galapa"],
  "Bolívar": ["Cartagena","Magangué","El Carmen de Bolívar","Turbaco"],
  "Santander": ["Bucaramanga","Floridablanca","Girón","Piedecuesta","Barrancabermeja"],
  "Córdoba": ["Montería","Cereté","Lorica","Sahagún","Montelíbano"],
  "Nariño": ["Pasto","Ipiales","Tumaco","Túquerres"],
  "Norte de Santander": ["Cúcuta","Ocaña","Pamplona","Villa del Rosario","Los Patios"],
  "Huila": ["Neiva","Pitalito","Garzón","La Plata"],
  "Tolima": ["Ibagué","Espinal","Melgar","Honda","Líbano"],
  "Cauca": ["Popayán","Santander de Quilichao","Puerto Tejada"],
  "Risaralda": ["Pereira","Dosquebradas","Santa Rosa de Cabal","La Virginia"],
  "Caldas": ["Manizales","La Dorada","Chinchiná","Villamaría"],
  "Quindío": ["Armenia","Calarcá","Montenegro","La Tebaida"],
  "Meta": ["Villavicencio","Acacías","Granada","Puerto López"],
  "Cesar": ["Valledupar","Aguachica","Codazzi"],
  "Magdalena": ["Santa Marta","Ciénaga","Fundación"],
  "Sucre": ["Sincelejo","Corozal","San Marcos"],
  "Chocó": ["Quibdó","Istmina","Riosucio"],
  "La Guajira": ["Riohacha","Maicao","Uribia"],
  "Boyacá": ["Tunja","Sogamoso","Duitama","Chiquinquirá"],
  "Casanare": ["Yopal","Aguazul","Villanueva"],
  "Putumayo": ["Mocoa","Puerto Asís","Orito"],
  "Arauca": ["Arauca","Saravena","Tame"],
  "Amazonas": ["Leticia","Puerto Nariño"],
  "Guainía": ["Inírida"],
  "Guaviare": ["San José del Guaviare"],
  "Vaupés": ["Mitú"],
  "Vichada": ["Puerto Carreño"],
  "San Andrés y Providencia": ["San Andrés","Providencia"],
};

export const VALLE_ABURRA = new Set([
  "medellín","medellin","bello","itagüí","itagui",
  "envigado","sabaneta","la estrella","caldas",
  "copacabana","girardota","barbosa",
]);

export const LOGISTICS_BY_CITY = (city: string): string => {
  return VALLE_ABURRA.has(city.toLowerCase())
    ? "🛵 Entrega el mismo día (servicio propio)"
    : "📦 Coordinadora / Envía / Servientrega (1-3 días hábiles)";
};

// ─── Shipping cost estimator ──────────────────────────────────────────────────
export function estimateShipping(city: string): { cost: number; label: string; sameDay: boolean } {
  if (VALLE_ABURRA.has(city.toLowerCase())) {
    return { cost: 0, label: "🎁 Gratis — Entrega mismo día", sameDay: true };
  }
  return { cost: 0, label: "📦 Costo por confirmar vía WhatsApp", sameDay: false };
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  department: string;
  city: string;
  onDepartmentChange: (d: string) => void;
  onCityChange: (c: string) => void;
  error?: string;
}

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
  fontFamily: "'Inter', sans-serif", outline: "none", background: "#fff",
  transition: "border-color 0.2s", appearance: "none",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c4dff' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  paddingRight: 36,
};

export function ColombiaShipping({ department, city, onDepartmentChange, onCityChange, error }: Props) {
  const departments = Object.keys(COLOMBIA_DATA).sort();
  const cities = department ? COLOMBIA_DATA[department] || [] : [];
  const shipping = city ? estimateShipping(city) : null;

  function handleDeptChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDept = e.target.value;
    onDepartmentChange(newDept);
    // Auto-select first city of department
    const firstCity = COLOMBIA_DATA[newDept]?.[0] || "";
    onCityChange(firstCity);
  }

  return (
    <div>
      {/* Departamento */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5 }}>
          🗺️ Departamento *
        </label>
        <select value={department} onChange={handleDeptChange} style={selectStyle}>
          <option value="">— Selecciona departamento —</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Ciudad */}
      {department && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5 }}>
            🏙️ Ciudad / Municipio *
          </label>
          <select value={city} onChange={e => onCityChange(e.target.value)} style={selectStyle}>
            <option value="">— Selecciona ciudad —</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Shipping preview */}
      {shipping && city && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: shipping.sameDay ? "#f0fdf4" : "#f0f9ff",
          border: `1px solid ${shipping.sameDay ? "#86efac" : "#93c5fd"}`,
          fontSize: 13, fontWeight: 600, marginBottom: 4,
          color: shipping.sameDay ? "#166534" : "#1e40af",
        }}>
          {shipping.label}
          {!shipping.sameDay && (
            <p style={{ fontWeight: 400, fontSize: 11, marginTop: 3, color: "#64748b" }}>
              Empresas: Coordinadora · Envía · Servientrega
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: "#dc2626", fontSize: 12, fontWeight: 600, marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

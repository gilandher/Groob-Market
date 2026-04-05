"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #f8fafc 100%)" }}>

      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #4f37cc 0%, #6c4dff 50%, #9b8cff 100%)",
        padding: "56px 20px 48px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📜</div>
          <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 900, margin: "0 0 10px", lineHeight: 1.2 }}>
            Términos y Condiciones
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 20 }}>
            Groob Market · Protección de Datos y Garantías de Producto
          </p>
          <div style={{
            display: "inline-block", background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 20, padding: "6px 18px", fontSize: 12,
            color: "rgba(255,255,255,0.9)", fontWeight: 600,
          }}>
            📅 Versión: Abril 2026 · Aplica legislación colombiana vigente
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
          <Link href="/" style={{ color: "#6c4dff", textDecoration: "none", fontWeight: 600 }}>Inicio</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span>Términos y Condiciones</span>
        </div>

        {/* === A. GARANTÍAS === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
            paddingBottom: 20, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6c4dff, #9b8cff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔧</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>A. Política General de Garantías</h2>
          </div>

          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Groob Market atenderá las solicitudes de garantía conforme a la naturaleza del producto, la información ofrecida al consumidor, la factura de compra y la legislación colombiana aplicable. Toda garantía está sujeta a evaluación técnica cuando sea necesaria para verificar el origen de la falla.
          </p>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 20 }}>
            Para hacer efectiva una garantía, el cliente deberá presentar el producto junto con la factura o comprobante de compra. La recepción del producto para revisión no implica aceptación automática de la garantía hasta que se complete el diagnóstico correspondiente.
          </p>

          {/* Tabla de garantías */}
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #6c4dff, #9b8cff)" }}>
                  {["Tipo de Producto", "Período de Garantía", "Condición General", "Nota Adicional"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    tipo: "Celulares nuevos", periodo: "1 año",
                    condicion: "Defectos de fábrica en hardware y software bajo uso normal.",
                    nota: "Ante silencio del productor, el término general para productos nuevos es de 1 año.",
                  },
                  {
                    tipo: "Accesorios", periodo: "3 meses",
                    condicion: "Defectos de fabricación o fallas de funcionamiento de origen.",
                    nota: "Aplica a cargadores, cables, audífonos, adaptadores y similares.",
                  },
                  {
                    tipo: "Usados / outlet / reacondicionados", periodo: "3 meses",
                    condicion: "Fallas funcionales atribuibles al equipo bajo uso normal.",
                    nota: "Debe informarse claramente al comprador la condición del producto.",
                  },
                  {
                    tipo: "Tecnología general", periodo: "45 días*",
                    condicion: "Periféricos, gadgets y electrónicos no cubiertos por término superior.",
                    nota: "*Solo cuando no exista término legal o comercial mayor anunciado.",
                  },
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: "#374151", borderBottom: "1px solid #f1f5f9" }}>{row.tipo}</td>
                    <td style={{ padding: "11px 14px", color: "#6c4dff", fontWeight: 800, borderBottom: "1px solid #f1f5f9" }}>{row.periodo}</td>
                    <td style={{ padding: "11px 14px", color: "#374151", borderBottom: "1px solid #f1f5f9" }}>{row.condicion}</td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}>{row.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Cobertura y Exclusiones</h3>
          <div style={{
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", borderRadius: 12,
            padding: "16px 20px", marginBottom: 16, border: "1px solid #86efac",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8 }}>✅ La garantía SÍ cubre:</p>
            <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.7 }}>
              Fallas de funcionamiento, defectos de fabricación y problemas de idoneidad o calidad presentados bajo condiciones normales de uso, siempre que no provengan de una causa externa atribuible al consumidor o a terceros no autorizados.
            </p>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)", borderRadius: 12,
            padding: "16px 20px", border: "1px solid #fecaca",
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>❌ La garantía NO cubre:</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#7f1d1d", lineHeight: 2 }}>
              {[
                "Golpes, caídas, rayones severos o cualquier daño físico accidental.",
                "Humedad, ingreso de líquidos, exposición a fuego, calor extremo o agentes externos.",
                "Sobrecargas eléctricas, conexiones inadecuadas o uso de accesorios no certificados.",
                "Manipulación, apertura, modificación o reparación por personal no autorizado.",
                "Desgaste normal por uso y daños estéticos que no afecten la funcionalidad del producto.",
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 20, marginBottom: 12 }}>Procedimiento de Atención de Garantías</h3>
          <ol style={{ paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 2.2 }}>
            <li>Recepción del producto con validación de datos del cliente y comprobante de compra.</li>
            <li>Revisión técnica inicial para confirmar la falla y determinar si la garantía es procedente.</li>
            <li>Respuesta con una de las siguientes alternativas según corresponda: reparación sin costo, cambio del producto, reposición por uno equivalente o devolución del dinero cuando legalmente proceda.</li>
            <li>Comunicación del resultado por los canales de atención definidos por Groob Market.</li>
          </ol>
        </section>

        {/* === B. TRATAMIENTO DE DATOS === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
            paddingBottom: 20, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>B. Tratamiento de Datos Personales</h2>
          </div>

          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Al registrarse, comprar, solicitar soporte, participar en promociones o contactar a Groob Market, el titular autoriza de manera previa, expresa e informada el tratamiento de sus datos personales para las finalidades descritas en este documento y en la política de privacidad publicada por la marca.
          </p>

          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Datos que tratamos</h3>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Nombre completo, número de identificación, correo electrónico, teléfono, dirección de entrega, ciudad, historial de compras, información de facturación, registros de servicio al cliente y demás datos necesarios para la prestación del servicio.
          </p>

          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Finalidades del Tratamiento</h3>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 2 }}>
            {[
              "Crear y administrar cuentas de usuario o registros de clientes.",
              "Procesar pedidos, pagos, facturación, despachos, garantías, cambios, devoluciones y soporte posventa.",
              "Validar identidad, prevenir fraude y proteger la seguridad de las operaciones.",
              "Atender consultas, solicitudes, quejas, reclamos y requerimientos de autoridades competentes.",
              "Enviar comunicaciones transaccionales relacionadas con compras, soporte, seguridad y actualizaciones.",
              "Enviar información comercial y promociones cuando exista autorización para ello.",
            ].map((item, i) => <li key={i}>{item}</li>)}
          </ul>

          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginTop: 16, marginBottom: 10 }}>Derechos del Titular</h3>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 2 }}>
            {[
              "Conocer, actualizar y rectificar sus datos personales.",
              "Solicitar prueba de la autorización otorgada, salvo en los casos exceptuados por la ley.",
              "Ser informado sobre el uso dado a sus datos personales.",
              "Presentar quejas y reclamos, y solicitar la supresión de datos o la revocatoria de la autorización cuando proceda.",
              "Acceder de forma gratuita a sus datos personales que hayan sido objeto de tratamiento.",
            ].map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        {/* === C. AUTORIZACIÓN === */}
        <section style={{
          borderRadius: 20, padding: 32, marginBottom: 24,
          background: "linear-gradient(135deg, #fef3c7, #fffbeb)",
          border: "2px solid #f59e0b",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#92400e", margin: 0 }}>C. Autorización de Tratamiento de Datos</h2>
          </div>
          <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.7, marginBottom: 16 }}>
            El siguiente texto está previsto para su uso en formularios de registro, checkout o cualquier punto de recolección de datos de la plataforma Groob Market:
          </p>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "20px 24px",
            border: "2px solid #f59e0b",
            boxShadow: "0 4px 16px rgba(245,158,11,0.1)",
          }}>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, fontStyle: "italic", fontWeight: 500 }}>
              "Autorizo a Groob Market para recolectar y tratar mis datos personales con el fin de gestionar mi registro, compras, facturación, envíos, garantías, soporte y comunicaciones relacionadas, conforme a la Política de Tratamiento de Datos Personales y a la normativa colombiana vigente."
            </p>
          </div>
        </section>

        {/* === D. MARCO NORMATIVO === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #0f172a, #1e293b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚖️</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>D. Marco Normativo de Referencia</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {[
              { ley: "Ley 1480 de 2011", desc: "Estatuto del Consumidor" },
              { ley: "Decreto 735 de 2013", desc: "Reglamenta sobre efectividad de la garantía legal" },
              { ley: "Ley 1581 de 2012", desc: "Régimen general de protección de datos personales" },
              { ley: "Decreto 1074 de 2015", desc: "Decreto Único Reglamentario del Sector Comercio" },
              { ley: "SIC", desc: "Lineamientos y orientaciones vigentes de la Superintendencia de Industria y Comercio" },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#f8fafc", borderRadius: 12, padding: "14px 16px",
                border: "1px solid #e2e8f0",
              }}>
                <p style={{ fontWeight: 800, fontSize: 13, color: "#6c4dff" }}>{item.ley}</p>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          borderRadius: 20, padding: "28px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0 }}>¿Tienes alguna pregunta?</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Nuestro equipo está disponible para ayudarte</p>
          </div>
          <a href="https://wa.me/573011963515" target="_blank" rel="noreferrer" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#25d366", color: "#fff", padding: "12px 24px",
            borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            💬 Escribir por WhatsApp
          </a>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 32 }}>
          © 2026 Groob Market · Medellín, Colombia · Todos los derechos reservados
        </p>
      </div>
    </main>
  );
}

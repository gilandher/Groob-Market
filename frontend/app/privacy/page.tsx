"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #f8fafc 100%)" }}>

      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #4f37cc 0%, #6c4dff 50%, #9b8cff 100%)",
        padding: "56px 20px 48px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🛡️</div>
          <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 900, margin: "0 0 10px", lineHeight: 1.2 }}>
            Política de Tratamiento de Datos
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 20 }}>
            Groob Market · Compromiso de Privacidad y Habeas Data (Ley 1581 de 2012)
          </p>
          <div style={{
            display: "inline-block", background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 20, padding: "6px 18px", fontSize: 12,
            color: "rgba(255,255,255,0.9)", fontWeight: 600,
          }}>
            📅 Versión: Abril 2026 · Conforme a la legislación de la República de Colombia
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 32, fontSize: 13, color: "#64748b" }}>
          <Link href="/" style={{ color: "#6c4dff", textDecoration: "none", fontWeight: 600 }}>Inicio</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span>Política de Tratamiento de Datos Personales</span>
        </div>

        {/* === 1. IDENTIFICACIÓN === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6c4dff, #9b8cff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>1. Responsable del Tratamiento</h2>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            El responsable del tratamiento de sus datos personales recolectados a través de esta plataforma digital es la marca <strong>Groob Market</strong>, con domicilio principal en la ciudad de <strong>Medellín, Colombia</strong>.
          </p>
          <div style={{
            background: "#f8fafc", borderRadius: 12, padding: "16px 20px",
            border: "1px solid #e2e8f0", fontSize: 13, color: "#475569",
          }}>
            <p style={{ marginBottom: 6 }}><strong>📍 Dirección:</strong> Medellín, Colombia</p>
            <p style={{ marginBottom: 6 }}><strong>✉️ Correo de Contacto:</strong> soporte@groob.la</p>
            <p style={{ marginBottom: 0 }}><strong>💬 WhatsApp de Soporte:</strong> (+57) 300 180 5448</p>
          </div>
        </section>

        {/* === 2. MARCO LEGAL === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚖️</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>2. Marco Legal Aplicable</h2>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Esta Política de Tratamiento de Datos Personales ha sido elaborada de acuerdo con las disposiciones contenidas en la Constitución Política de Colombia (Artículo 15), la <strong>Ley 1581 de 2012</strong> (Régimen General de Protección de Datos Personales), el <strong>Decreto Reglamentario 1074 de 2015</strong> (Capítulo 25) y demás normas que las modifiquen, adicionen o complementen.
          </p>
        </section>

        {/* === 3. FINALIDADES === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #10b981, #34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎯</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>3. Finalidades del Tratamiento</h2>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Groob Market recolecta, almacena y trata los datos personales de los usuarios de la plataforma digital para el desarrollo de las siguientes actividades:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 2.2 }}>
            <li><strong>Gestión de Cuentas:</strong> Procesar el registro, habilitar la sesión, personalizar el perfil y gestionar los avatares juveniles elegidos por el usuario.</li>
            <li><strong>Procesamiento de Compras:</strong> Validar el pago, facturar las transacciones y despachar los productos tecnológicos a la dirección física indicada.</li>
            <li><strong>Soporte y Garantías:</strong> Atender consultas técnicas, solicitudes posventa y procesar reclamos de garantía.</li>
            <li><strong>Identificación Única (Cédula de Ciudadanía):</strong> Almacenar el número de identificación del usuario con carácter inmutable. Dicho identificador es estrictamente necesario para registrar de forma unívoca a los clientes en nuestra base de datos, asociar sus compras a su identidad real y hacer efectivas las garantías posventa, protegiendo así al consumidor de fraudes o suplantaciones.</li>
            <li><strong>Comunicaciones Transaccionales:</strong> Notificar el estado de las compras, enviar guías de transporte e informar actualizaciones de seguridad o cambios en los términos.</li>
            <li><strong>Fines Comerciales y Publicitarios:</strong> Remitir promociones, ofertas de temporada o encuestas de satisfacción, siempre y cuando el usuario lo haya autorizado voluntaria y explícitamente en su perfil.</li>
          </ul>
        </section>

        {/* === 4. DERECHOS DEL TITULAR === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>4. Derechos de los Titulares</h2>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            De acuerdo con lo establecido por la Ley 1581 de 2012, el Titular de los datos personales cuenta con los siguientes derechos constitucionales:
          </p>
          <ol style={{ paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 2.2 }}>
            <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales frente a los Responsables o Encargados del tratamiento. Este derecho se podrá ejercer frente a datos parciales, inexactos, incompletos, fraccionados, que induzcan a error o aquellos cuyo tratamiento esté expresamente prohibido o no haya sido autorizado.</li>
            <li><strong>Solicitar prueba</strong> de la autorización otorgada al Responsable del Tratamiento, salvo excepciones expresas en la ley (Art. 10 Ley 1581 de 2012).</li>
            <li><strong>Ser informado</strong> por el Responsable o Encargado del Tratamiento, previa solicitud, respecto del uso que le ha dado a sus datos personales.</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a lo dispuesto en la ley de protección de datos.</li>
            <li><strong>Revocar la autorización y/o solicitar la supresión del dato</strong> cuando en el Tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</li>
            <li><strong>Acceder en forma gratuita</strong> a sus datos personales que hayan sido objeto de Tratamiento de manera periódica.</li>
          </ol>
        </section>

        {/* === 5. PROCEDIMIENTOS === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #ec4899, #f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📬</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>5. Procedimiento para Consultas y Reclamos</h2>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Para ejercer sus derechos constitucionales de Habeas Data, actualizar sus datos, revocar la autorización o solicitar la supresión de la base de datos, el Titular puede comunicarse mediante el correo <strong>soporte@groob.la</strong> o escribir a nuestro canal de soporte de WhatsApp.
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 20
          }}>
            <div style={{
              background: "#faf5ff", borderRadius: 12, padding: "20px 24px",
              border: "1px solid #e9d5ff",
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#6b21a8", marginBottom: 8 }}>📌 Consultas</h3>
              <p style={{ fontSize: 12, color: "#581c87", lineHeight: 1.6 }}>
                Las consultas sobre los datos personales del titular serán atendidas por Groob Market en un plazo máximo de <strong>diez (10) días hábiles</strong> contados a partir de la fecha de recibo. Si no es posible responder en este plazo, se informará al usuario y se dará respuesta en un período adicional máximo de cinco (5) días hábiles.
              </p>
            </div>
            <div style={{
              background: "#faf5ff", borderRadius: 12, padding: "20px 24px",
              border: "1px solid #e9d5ff",
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#6b21a8", marginBottom: 8 }}>📌 Reclamos</h3>
              <p style={{ fontSize: 12, color: "#581c87", lineHeight: 1.6 }}>
                Los reclamos relacionados con correcciones, actualizaciones o supresiones se resolverán en un plazo máximo de <strong>quince (15) días hábiles</strong>. Si el reclamo está incompleto, se le solicitará subsanarlo en los cinco (5) días siguientes a la recepción. Tras dos (2) meses sin respuesta del usuario, se entenderá desistido.
              </p>
            </div>
          </div>
        </section>

        {/* === 6. SEGURIDAD Y VIGENCIA === */}
        <section style={{ background: "#fff", borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
            paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6b7280, #9ca3af)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🛡️</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>6. Seguridad de la Información y Vigencia</h2>
          </div>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
            Groob Market adopta medidas tecnológicas, físicas y administrativas de seguridad para salvaguardar la integridad de la base de datos de usuarios de acuerdo con los estándares de la industria, evitando accesos no autorizados, pérdidas, destrucción involuntaria, alteración o interceptación ilegal.
          </p>
          <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 0 }}>
            La base de datos administrada por Groob Market permanecerá activa durante el tiempo que sea necesario para cumplir con las finalidades descritas, resolver reclamaciones de garantías, gestionar la facturación legal y cumplir con las normativas comerciales y contables correspondientes de la República de Colombia.
          </p>
        </section>

        {/* CTA */}
        <div style={{
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          borderRadius: 20, padding: "28px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <h3 style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: 0 }}>¿Tienes alguna duda sobre tus datos?</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>Contáctanos y responderemos de inmediato a tu solicitud</p>
          </div>
          <a href="https://wa.me/573001805448" target="_blank" rel="noreferrer" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#25d366", color: "#fff", padding: "12px 24px",
            borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none",
          }}>
            💬 WhatsApp de Soporte
          </a>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 32 }}>
          © 2026 Groob Market · Medellín, Colombia · Todos los derechos reservados
        </p>
      </div>
    </main>
  );
}

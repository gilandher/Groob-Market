"use client";

export default function Footer() {
  return (
    <footer style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      color: "#94a3b8", padding: "48px 20px 24px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 32, marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
                <path d="M18 22 L8 40 L18 58" stroke="#2ec27e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M62 22 L72 40 L62 58" stroke="#2ec27e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M52 20 A22 22 0 1 0 52 60" stroke="#1565d8" strokeWidth="7" strokeLinecap="round" fill="none"/>
                <line x1="40" y1="10" x2="40" y2="26" stroke="#2ec27e" strokeWidth="6" strokeLinecap="round"/>
                <line x1="40" y1="40" x2="52" y2="40" stroke="#1565d8" strokeWidth="6" strokeLinecap="round"/>
                <rect x="46" y="38" width="8" height="8" rx="2" fill="#2ec27e"/>
              </svg>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
                  Groob <span style={{ color: "#9b8cff" }}>Market</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Vitrina Virtual</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#64748b" }}>
              Tu tienda de tecnología con entrega el mismo día en Medellín y Área Metropolitana.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {/* Social icons */}
              {[
                { label: "Facebook", icon: "f" },
                { label: "Instagram", icon: "📸" },
                { label: "WhatsApp", icon: "💬" },
              ].map(s => (
                <a key={s.label} href="#" title={s.label}
                  style={{
                    width: 36, height: 36, borderRadius: 8, background: "#1e293b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#94a3b8", fontSize: 14, textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#6c4dff";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "#1e293b";
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column links */}
          {[
            {
              title: "Categorías",
              links: [
                { label: "Tecnología", href: "/?cat=tecnologia" },
                { label: "Celulares", href: "/?cat=celulares" },
                { label: "Hogar", href: "/?cat=hogar" },
                { label: "Moda", href: "/?cat=moda" },
                { label: "Belleza", href: "/?cat=belleza" },
              ],
            },
            {
              title: "Empresa",
              links: [
                { label: "Sobre nosotros", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Trabaja con nosotros", href: "#" },
                { label: "Contacto", href: "#" },
              ],
            },
            {
              title: "Soporte",
              links: [
                { label: "FAQ", href: "#" },
                { label: "Envíos y entregas", href: "#" },
                { label: "Devoluciones", href: "#" },
                { label: "WhatsApp", href: "https://wa.me/573011963515" },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href}
                      style={{ color: "#64748b", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#9b8cff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid #1e293b", paddingTop: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontSize: 12 }}>© 2025 Groob Market. Todos los derechos reservados.</p>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>Términos</a>
            <a href="#" style={{ color: "#64748b", textDecoration: "none" }}>Privacidad</a>
            <span>Hecho con ❤️ por <span style={{ color: "#9b8cff" }}>Groob Code Technology</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

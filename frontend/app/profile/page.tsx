"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COLOMBIA_DATA } from "../components/ColombiaShipping";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  address2?: string;
  city?: string;
  department?: string;
  cedula?: string;
  avatar?: string;
  data_policy_accepted?: boolean;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  status_emoji: string;
  created_at: string;
  total: number;
  items: { product_name: string; qty: number }[];
}

type Tab = "info" | "orders" | "security";

function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
}

function Avatar({ name, avatar, size = 72 }: { name: string; avatar?: string; size?: number }) {
  if (avatar && avatar.startsWith("avatar_")) {
    return (
      <img
        src={`/avatars/${avatar}.svg`}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          boxShadow: "0 4px 16px rgba(108,77,255,0.35)",
          flexShrink: 0,
          border: "2px solid #fff",
        }}
      />
    );
  }
  if (avatar && (avatar.startsWith("http://") || avatar.startsWith("https://"))) {
    return (
      <img
        src={avatar}
        alt={name}
        referrerPolicy="no-referrer"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          boxShadow: "0 4px 16px rgba(108,77,255,0.35)",
          flexShrink: 0,
          border: "2px solid #fff",
        }}
      />
    );
  }
  const initials = name?.slice(0, 2).toUpperCase() || "??";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 900, fontSize: size * 0.3,
      boxShadow: "0 4px 16px rgba(108,77,255,0.35)",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [originalExternalAvatar, setOriginalExternalAvatar] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", address: "", address2: "",
    city: "", department: "", cedula: "", avatar: "avatar_1",
    data_policy_accepted: false,
  });

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  const handleDepartmentChange = (dept: string) => {
    const firstCity = COLOMBIA_DATA[dept]?.[0] || "";
    setForm(f => ({
      ...f,
      department: dept,
      city: firstCity,
    }));
  };

  async function fetchProfile(token: string) {
    try {
      const res = await fetch(`${API}/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem("groob_user", JSON.stringify(data));
        if (data.avatar && (data.avatar.startsWith("http://") || data.avatar.startsWith("https://"))) {
          setOriginalExternalAvatar(data.avatar);
        }
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          address2: data.address2 || "",
          city: data.city || "",
          department: data.department || "",
          cedula: data.cedula || "",
          avatar: data.avatar || "avatar_1",
          data_policy_accepted: data.data_policy_accepted || false,
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("groob_token");
    if (!token) {
      router.push("/");
      return;
    }

    const raw = localStorage.getItem("groob_user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUser(u);
        if (u.avatar && (u.avatar.startsWith("http://") || u.avatar.startsWith("https://"))) {
          setOriginalExternalAvatar(u.avatar);
        }
        setForm({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          address2: u.address2 || "",
          city: u.city || "",
          department: u.department || "",
          cedula: u.cedula || "",
          avatar: u.avatar || "avatar_1",
          data_policy_accepted: u.data_policy_accepted || false,
        });
      } catch { /* ignore */ }
    }

    fetchProfile(token);
    loadOrders(token);
  }, []);

  useEffect(() => {
    function handleAuthUpdate() {
      const token = localStorage.getItem("groob_token");
      if (!token) {
        setUser(null);
        router.push("/");
      }
    }
    window.addEventListener("groob_auth_update", handleAuthUpdate);
    return () => window.removeEventListener("groob_auth_update", handleAuthUpdate);
  }, [router]);

  async function loadOrders(token: string) {
    try {
      const res = await fetch(`${API}/orders/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.results ?? data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.phone.trim() || !form.city.trim() || !form.department.trim() || !form.address.trim() || !form.cedula.trim()) {
      setMsg("❌ Todos los campos son obligatorios (excepto la segunda dirección)");
      setMsgType("err");
      return;
    }
    if (!form.data_policy_accepted) {
      setMsg("❌ Debe aceptar los términos y condiciones de tratamiento de datos");
      setMsgType("err");
      return;
    }
    setSaving(true); setMsg("");
    const token = localStorage.getItem("groob_token");
    try {
      const res = await fetch(`${API}/auth/profile/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        let errorMsg = "Error actualizando perfil. Intenta de nuevo.";
        if (errorData) {
          if (errorData.detail) {
            errorMsg = errorData.detail;
          } else {
            const messages = Object.entries(errorData).map(([key, val]) => {
              const fieldLabel = {
                first_name: "Nombres",
                last_name: "Apellidos",
                email: "Correo electrónico",
                phone: "Teléfono",
                address: "Dirección principal",
                city: "Ciudad",
                department: "Departamento",
                cedula: "Cédula",
                data_policy_accepted: "Tratamiento de datos"
              }[key] || key;
              const errors = Array.isArray(val) ? val.join(" ") : String(val);
              return `${fieldLabel}: ${errors}`;
            });
            if (messages.length > 0) {
              errorMsg = "Errores de validación:\n" + messages.join("\n");
            }
          }
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      const updatedUser = data.user;
      setUser(updatedUser);
      localStorage.setItem("groob_user", JSON.stringify(updatedUser));
      if (updatedUser.avatar && (updatedUser.avatar.startsWith("http://") || updatedUser.avatar.startsWith("https://"))) {
        setOriginalExternalAvatar(updatedUser.avatar);
      }
      window.dispatchEvent(new Event("groob_auth_update"));
      setMsg("✅ Perfil actualizado correctamente");
      setMsgType("ok");
    } catch (err: any) {
      setMsg(err.message || "❌ Error actualizando perfil. Intenta de nuevo.");
      setMsgType("err");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg("❌ Las contraseñas no coinciden");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg("❌ La contraseña debe tener al menos 6 caracteres");
      return;
    }
    const token = localStorage.getItem("groob_token");
    try {
      const res = await fetch(`${API}/auth/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Error");
      setPwMsg("✅ Contraseña actualizada");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err: any) {
      setPwMsg(`❌ ${err.message || "Error cambiando contraseña"}`);
    }
  }

  function logout() {
    localStorage.removeItem("groob_token");
    localStorage.removeItem("groob_refresh");
    localStorage.removeItem("groob_user");
    window.dispatchEvent(new Event("groob_auth_update"));
    router.push("/");
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--groob-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #ede9fe", borderTop: "4px solid #6c4dff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    );
  }

  if (!user) return null;

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: "info", icon: "👤", label: "Mi Información" },
    { key: "orders", icon: "📋", label: "Mis Compras" },
    { key: "security", icon: "🔒", label: "Seguridad" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", background: "#fff",
    color: "#0f172a", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "#64748b",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c4dff' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 36,
    cursor: "pointer",
  };

  // Dynamically build department options ensuring current form value is included if not in COLOMBIA_DATA
  const deptOptions = Object.keys(COLOMBIA_DATA).sort();
  if (form.department && !deptOptions.includes(form.department)) {
    deptOptions.push(form.department);
  }

  // Dynamically build city options based on selected department, ensuring current city is included
  const cityOptions = form.department ? [...(COLOMBIA_DATA[form.department] || [])] : [];
  if (form.city && !cityOptions.includes(form.city)) {
    cityOptions.push(form.city);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--groob-bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>

        <Link href="/" style={{ color: "var(--groob-purple)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          ← Volver a la tienda
        </Link>

        {/* ── Profile Hero ── */}
        <div style={{
          margin: "20px 0 28px",
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          borderRadius: 24, padding: "28px 28px",
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
          boxShadow: "0 8px 32px rgba(108,77,255,0.25)",
        }}>
          <Avatar name={user.name} avatar={user.avatar} size={80} />
          <div style={{ flex: 1 }}>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: 0 }}>{user.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 }}>{user.email}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#fff" }}>
                📋 {orders.length} pedido{orders.length !== 1 ? "s" : ""}
              </div>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#fff" }}>
                🛍️ Cliente Groob Market
              </div>
            </div>
          </div>
          <button onClick={logout} style={{
            background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
            padding: "8px 16px", borderRadius: 10, cursor: "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: "'Inter', sans-serif",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            🚪 Cerrar sesión
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", gap: 4, background: "#fff",
          borderRadius: 16, padding: 6, marginBottom: 24,
          border: "1px solid #f1f5f9",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 12, border: "none",
                background: tab === t.key ? "linear-gradient(135deg, #6c4dff, #9b8cff)" : "transparent",
                color: tab === t.key ? "#fff" : "#64748b", cursor: "pointer",
                fontWeight: 700, fontSize: 13, fontFamily: "'Inter', sans-serif",
                transition: "all 0.2s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
              }}
            >
              <span>{t.icon}</span>
              <span style={{ display: "inline" }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: MI INFORMACIÓN ── */}
        {tab === "info" && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: "#0f172a" }}>
              👤 Información Personal
            </h2>

            <form onSubmit={handleSave}>
              {/* ── Avatar Grid Selection ── */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Elige tu Avatar</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 12, marginTop: 8 }}>
                  {originalExternalAvatar && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, avatar: originalExternalAvatar }))}
                      style={{
                        background: "none",
                        border: form.avatar === originalExternalAvatar ? "3px solid #6c4dff" : "3px solid transparent",
                        borderRadius: "50%",
                        padding: 3,
                        cursor: "pointer",
                        outline: "none",
                        transition: "transform 0.25s, border-color 0.25s",
                        transform: form.avatar === originalExternalAvatar ? "scale(1.08)" : "scale(1)",
                        boxShadow: form.avatar === originalExternalAvatar ? "0 4px 12px rgba(108,77,255,0.3)" : "none",
                      }}
                    >
                      <img
                        src={originalExternalAvatar}
                        alt="Avatar Google"
                        referrerPolicy="no-referrer"
                        style={{ width: 60, height: 60, borderRadius: "50%", display: "block", objectFit: "cover" }}
                      />
                    </button>
                  )}
                  {[
                    { id: "avatar_1", label: "Monstera 🌿" },
                    { id: "avatar_2", label: "Cactus 🌵" },
                    { id: "avatar_3", label: "Gato 🐱" },
                    { id: "avatar_4", label: "Perro 🐶" },
                    { id: "avatar_5", label: "Zorro 🦊" },
                    { id: "avatar_6", label: "Galaxia 🌌" },
                    { id: "avatar_7", label: "Montaña 🏔️" },
                    { id: "avatar_8", label: "Chico 👦" },
                    { id: "avatar_9", label: "Chica 👧" },
                  ].map(av => {
                    const isSelected = form.avatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, avatar: av.id }))}
                        style={{
                          background: "none",
                          border: isSelected ? "3px solid #6c4dff" : "3px solid transparent",
                          borderRadius: "50%",
                          padding: 3,
                          cursor: "pointer",
                          outline: "none",
                          transition: "transform 0.25s, border-color 0.25s",
                          transform: isSelected ? "scale(1.08)" : "scale(1)",
                          boxShadow: isSelected ? "0 4px 12px rgba(108,77,255,0.3)" : "none",
                        }}
                      >
                        <img
                          src={`/avatars/${av.id}.svg`}
                          alt={av.label}
                          style={{ width: 60, height: 60, borderRadius: "50%", display: "block" }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="responsive-grid-2cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nombres <span style={{ color: "#f43f5e" }}>*</span></label>
                  <input
                    style={inputStyle} value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="Tus nombres"
                    required
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Apellidos <span style={{ color: "#f43f5e" }}>*</span></label>
                  <input
                    style={inputStyle} value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Tus apellidos"
                    required
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Correo electrónico <span style={{ color: "#f43f5e" }}>*</span></label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="tu@email.com"
                    required
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>💡 El correo electrónico se puede modificar una vez por semana (cada 7 días).</p>
                </div>

                <div>
                  <label style={labelStyle}>Cédula / ID de Cliente <span style={{ color: "#f43f5e" }}>*</span></label>
                  <input
                    style={{ ...inputStyle, ...(!!user.cedula ? { background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" } : {}) }}
                    value={form.cedula}
                    onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
                    placeholder="12345678"
                    required
                    disabled={!!user.cedula}
                    onFocus={e => { if (!user.cedula) { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; } }}
                    onBlur={e => { if (!user.cedula) { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; } }}
                  />
                  {!!user.cedula && (
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>🔒 La cédula no se puede modificar por motivos de seguridad y garantía.</p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Teléfono / WhatsApp <span style={{ color: "#f43f5e" }}>*</span></label>
                  <input
                    style={inputStyle} value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="300 123 4567"
                    required
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Departamento <span style={{ color: "#f43f5e" }}>*</span></label>
                  <select
                    style={selectStyle}
                    value={form.department}
                    onChange={e => handleDepartmentChange(e.target.value)}
                    required
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="" disabled>— Selecciona departamento —</option>
                    {deptOptions.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Ciudad <span style={{ color: "#f43f5e" }}>*</span></label>
                  <select
                    style={selectStyle}
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    required
                    disabled={!form.department}
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  >
                    <option value="" disabled>— Selecciona ciudad —</option>
                    {cityOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address section */}
              <div style={{ marginTop: 28, padding: "20px", background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", borderRadius: 14, border: "1px solid rgba(108,77,255,0.15)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#6c4dff", marginBottom: 16 }}>
                  📍 Direcciones de Entrega
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Dirección principal <span style={{ color: "#f43f5e" }}>*</span></label>
                    <input
                      style={inputStyle} value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Calle 123 # 45-67, Apto 8"
                      required
                      onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Segunda dirección <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
                    <input
                      style={inputStyle} value={form.address2}
                      onChange={e => setForm(f => ({ ...f, address2: e.target.value }))}
                      placeholder="Oficina, bodega u otra dirección de entrega"
                      onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>
              </div>

              {/* Habeas Data Consent */}
              {!user?.data_policy_accepted && (
                <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "flex-start", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    id="data_policy_accepted"
                    style={{ marginTop: 3, cursor: "pointer", width: 18, height: 18, accentColor: "#6c4dff" }}
                    checked={form.data_policy_accepted}
                    onChange={e => setForm(f => ({ ...f, data_policy_accepted: e.target.checked }))}
                  />
                  <label htmlFor="data_policy_accepted" style={{ fontSize: 13, color: "#475569", cursor: "pointer", lineHeight: 1.4, userSelect: "none" }}>
                    Acepto la <Link href="/privacy" target="_blank" style={{ color: "#6c4dff", textDecoration: "underline", fontWeight: "600" }}>política de tratamiento de datos personales</Link> de <strong>Groob Market</strong> y autorizo el almacenamiento de mi número de cédula para identificación única de cliente conforme a la ley de Habeas Data. <span style={{ color: "#f43f5e" }}>*</span>
                  </label>
                </div>
              )}

              {msg && (
                <div style={{
                  marginTop: 16, padding: "12px 16px", borderRadius: 10,
                  background: msgType === "ok" ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${msgType === "ok" ? "#86efac" : "#fecaca"}`,
                  color: msgType === "ok" ? "#166534" : "#dc2626",
                  fontSize: 13, fontWeight: 600,
                  whiteSpace: "pre-line",
                }}>
                  {msg}
                </div>
              )}

              {/* Validate fields to enable button */}
              {(() => {
                const isFormValid =
                  form.first_name.trim() !== "" &&
                  form.last_name.trim() !== "" &&
                  form.email.trim() !== "" &&
                  form.phone.trim() !== "" &&
                  form.city.trim() !== "" &&
                  form.department.trim() !== "" &&
                  form.address.trim() !== "" &&
                  form.cedula.trim() !== "" &&
                  form.data_policy_accepted;

                return (
                  <button
                    type="submit"
                    disabled={saving || !isFormValid}
                    style={{
                      marginTop: 20, padding: "13px 28px",
                      background: isFormValid 
                        ? "linear-gradient(135deg, #6c4dff, #9b8cff)" 
                        : "#cbd5e1",
                      border: "none", borderRadius: 12, color: isFormValid ? "#fff" : "#94a3b8",
                      fontWeight: 700, fontSize: 15, 
                      cursor: isFormValid ? "pointer" : "not-allowed",
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: isFormValid ? "0 4px 16px rgba(108,77,255,0.3)" : "none",
                      opacity: saving ? 0.7 : 1,
                      transition: "all 0.25s",
                    }}
                  >
                    {saving ? "Guardando..." : "💾 Guardar cambios"}
                  </button>
                );
              })()}
            </form>
          </div>
        )}

        {/* ── TAB: MIS COMPRAS ── */}
        {tab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>📋 Historial de Compras</h2>
              <Link href="/orders" style={{
                color: "#6c4dff", fontWeight: 700, fontSize: 13,
                textDecoration: "none", padding: "6px 14px",
                background: "#f5f3ff", borderRadius: 8,
              }}>
                Ver todo →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 56 }}>📭</div>
                <h3 style={{ marginTop: 12, fontWeight: 800 }}>Sin compras aún</h3>
                <p style={{ color: "#64748b", marginTop: 4 }}>¡Explora nuestro catálogo y haz tu primera compra!</p>
                <Link href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 20, padding: "12px 28px", textDecoration: "none" }}>
                  Ir a comprar →
                </Link>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} style={{
                  background: "#fff", borderRadius: 16, padding: "16px 20px",
                  border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                }}>
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                      {new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    <p style={{ fontWeight: 900, fontSize: 16, color: "#0f172a", marginTop: 2 }}>{order.order_number}</p>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                      {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      display: "inline-block", padding: "4px 12px", borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      background: order.status === "DELIVERED" ? "#f0fdf4" : "#f5f3ff",
                      color: order.status === "DELIVERED" ? "#166534" : "#6c4dff",
                      border: `1px solid ${order.status === "DELIVERED" ? "#86efac" : "#ddd6fe"}`,
                    }}>
                      {order.status_emoji} {order.status_display}
                    </span>
                    <p style={{ fontWeight: 900, fontSize: 17, color: "#0f172a", marginTop: 4 }}>{formatCOP(order.total)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TAB: SEGURIDAD ── */}
        {tab === "security" && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#0f172a" }}>
              🔒 Cambiar Contraseña
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
              Usa una contraseña segura de al menos 6 caracteres.
            </p>

            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
              {[
                { key: "current", label: "Contraseña actual", placeholder: "••••••••" },
                { key: "newPw", label: "Nueva contraseña", placeholder: "Mínimo 6 caracteres" },
                { key: "confirm", label: "Confirmar nueva contraseña", placeholder: "Repite la contraseña" },
              ].map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={pwForm[field.key as keyof typeof pwForm]}
                    onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              ))}

              {pwMsg && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10,
                  background: pwMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${pwMsg.startsWith("✅") ? "#86efac" : "#fecaca"}`,
                  color: pwMsg.startsWith("✅") ? "#166534" : "#dc2626",
                  fontSize: 13, fontWeight: 600,
                }}>
                  {pwMsg}
                </div>
              )}

              <button type="submit" style={{
                padding: "13px 28px",
                background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
                border: "none", borderRadius: 12, color: "#fff",
                fontWeight: 700, fontSize: 15, cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 4px 16px rgba(108,77,255,0.3)",
                width: "fit-content",
              }}>
                🔑 Actualizar contraseña
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

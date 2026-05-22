"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GroobLogo from "./GroobLogo";

type Step = "choose" | "login-email" | "register-email" | "otp" | "social-sim";

interface Props {
  onClose: () => void;
  onSuccess?: (user: { name: string; email: string; avatar?: string }) => void;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [socialProvider, setSocialProvider] = useState<"Google" | "Facebook" | "Instagram" | null>(null);
  const [socialCustomMode, setSocialCustomMode] = useState(false);
  const [socialEmail, setSocialEmail] = useState("");
  const [socialName, setSocialName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [rName, setRName] = useState("");
  const [rLastName, setRLastName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rPass2, setRPass2] = useState("");
  const [rTerms, setRTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [pendingPass, setPendingPass] = useState("");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleOtpChange(i: number, val: string) {
    const clean = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = clean;
    setOtp(next);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
    if (!clean && i > 0) otpRefs.current[i - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginEmail, password: loginPass }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Credenciales incorrectas");
      }
      const data = await res.json();
      const token = data.access || "";
      localStorage.setItem("groob_token", token);
      localStorage.setItem("groob_refresh", data.refresh || "");

      // Fetch complete user profile from /auth/me/
      try {
        const meRes = await fetch(`${API}/auth/me/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          localStorage.setItem("groob_user", JSON.stringify(meData));
          window.dispatchEvent(new Event("groob_auth_update"));
          onSuccess?.({ email: meData.email, name: meData.name || meData.username, avatar: meData.avatar });
        } else {
          // Fallback if /auth/me/ fails
          const fallbackUser = { email: loginEmail, name: loginEmail.split("@")[0] };
          localStorage.setItem("groob_user", JSON.stringify(fallbackUser));
          window.dispatchEvent(new Event("groob_auth_update"));
          onSuccess?.({ email: loginEmail, name: loginEmail.split("@")[0], avatar: undefined });
        }
      } catch {
        // Fallback on network/other errors
        const fallbackUser = { email: loginEmail, name: loginEmail.split("@")[0] };
        localStorage.setItem("groob_user", JSON.stringify(fallbackUser));
        window.dispatchEvent(new Event("groob_auth_update"));
        onSuccess?.({ email: loginEmail, name: loginEmail.split("@")[0], avatar: undefined });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function sendOTP(email: string) {
    setSendingOtp(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Error enviando código");

      setOtpSent(true);
      setResendCooldown(60);

      // In DEBUG mode, backend returns the code directly
      if (data.debug_code) {
        setError(`⚙️ Modo desarrollo: tu código es ${data.debug_code}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error enviando código");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rName.trim()) { setError("El nombre es obligatorio"); return; }
    if (!rLastName.trim()) { setError("El apellido es obligatorio"); return; }
    if (rPass !== rPass2) { setError("Las contraseñas no coinciden"); return; }
    if (!rTerms) { setError("Debes aceptar los términos y condiciones"); return; }
    if (rPass.length < 6) { setError("La contraseña debe tener mínimo 6 caracteres"); return; }

    setPendingEmail(rEmail);
    setPendingName(`${rName.trim()} ${rLastName.trim()}`);
    setPendingPass(rPass);
    setStep("otp");
    await sendOTP(rEmail);
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Ingresa el código completo de 6 dígitos"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code,
          name: pendingName,
          password: pendingPass,
          data_policy_accepted: rTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Código inválido");

      localStorage.setItem("groob_token", data.access || "");
      localStorage.setItem("groob_refresh", data.refresh || "");
      localStorage.setItem("groob_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("groob_auth_update"));
      onSuccess?.({ email: pendingEmail, name: data.user?.name || pendingName, avatar: data.user?.avatar });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  async function resendOTP() {
    if (resendCooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    await sendOTP(pendingEmail);
  }

  async function handleSocialSubmit(email: string, name: string) {
    if (!email.trim()) { setError("El correo electrónico es obligatorio"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/social-login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          provider: socialProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Error en el inicio de sesión social");

      localStorage.setItem("groob_token", data.access || "");
      localStorage.setItem("groob_refresh", data.refresh || "");
      localStorage.setItem("groob_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("groob_auth_update"));
      onSuccess?.({ email: data.user.email, name: data.user.name, avatar: data.user.avatar });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }


  function SocialBtn({ provider, icon, color, bg }: {
    provider: "Google" | "Facebook" | "Instagram"; icon: React.ReactNode; color: string; bg: string;
  }) {
    const handleClick = () => {
      if (provider === "Google") {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const isConfigured = clientId && !clientId.includes("your-google-client-id");
        if (isConfigured) {
          const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google-callback`);
          const scope = encodeURIComponent("openid profile email");
          const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${nonce}`;
          window.location.href = authUrl;
          return;
        } else {
          setError("El inicio de sesión con Google no está disponible en este momento. Por favor, usa otra opción.");
          return;
        }
      }
      setSocialProvider(provider);
      setSocialCustomMode(false);
      setSocialEmail("");
      setSocialName("");
      setError("");
      setStep("social-sim");
    };
    return (
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "11px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0",
          background: bg, color: color, fontWeight: 600, fontSize: 14, cursor: "pointer",
          transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
        }}
      >
        {icon}
        Continuar con {provider}
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeInUp 0.25s ease",
      }}
    >
      {/* Botón de cerrar en la esquina superior derecha de la pantalla (fijo) */}
      <button
        onClick={onClose}
        id="auth-close"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(4px)",
          border: "1.5px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "50%",
          width: 40,
          height: 40,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 20,
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 10000,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.3)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.15)";
          (e.currentTarget as HTMLButtonElement).style.transform = "";
        }}
      >
        ✕
      </button>

      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 440,
        boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
        overflow: "hidden", position: "relative",
        maxHeight: "95vh", overflowY: "auto",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          padding: "24px 28px 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GroobLogo size={30} variant="white" />
        </div>

        <div style={{ padding: "24px 28px 28px" }}>

          {/* ── CHOOSE ── */}
          {step === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ marginBottom: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>¡Bienvenido!</h2>
                <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                  Inicia sesión o crea tu cuenta para comprar
                </p>
              </div>
              {error && <div style={errorStyle}>{error}</div>}
              <SocialBtn provider="Google" color="#1a1a1a" bg="#fff"
                icon={<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
              />
              <SocialBtn provider="Facebook" color="#fff" bg="#1877f2"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
              />
              <SocialBtn provider="Instagram" color="#fff" bg="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>o con tu correo</span>
                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              </div>
              <button type="button" onClick={() => { setStep("login-email"); setError(""); }}
                style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #6c4dff", background: "#f5f3ff", color: "#6c4dff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                📧 Iniciar sesión con email
              </button>
              <button type="button" onClick={() => { setStep("register-email"); setError(""); }}
                style={{ padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", color: "#0f172a", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                ✨ Crear cuenta nueva
              </button>
              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 4 }}>
                Al continuar aceptas nuestros{" "}
                <Link href="/terms" style={{ color: "#6c4dff" }}>Términos de Uso</Link>{" "}
                y <Link href="/privacy" style={{ color: "#6c4dff" }}>Política de Privacidad</Link>
              </p>
            </div>
          )}

          {/* ── LOGIN EMAIL ── */}
          {step === "login-email" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <button type="button" onClick={() => { setStep("choose"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#6c4dff", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 600 }}>
                  ← Volver
                </button>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Iniciar sesión</h2>
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="tu@email.com" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="••••••••" required style={{ ...inputStyle, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && <div style={errorStyle}>{error}</div>}
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? <SpinnerInline /> : null}
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
              <p style={{ textAlign: "center", fontSize: 13, color: "#64748b" }}>
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => { setStep("register-email"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#6c4dff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  Regístrate
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER EMAIL ── */}
          {step === "register-email" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <button type="button" onClick={() => { setStep("choose"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#6c4dff", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 600 }}>
                  ← Volver
                </button>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Crear cuenta</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nombres *</label>
                  <input type="text" value={rName} onChange={e => setRName(e.target.value)}
                    placeholder="Andrés" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Apellidos *</label>
                  <input type="text" value={rLastName} onChange={e => setRLastName(e.target.value)}
                    placeholder="García" required style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico *</label>
                <input type="email" value={rEmail} onChange={e => setREmail(e.target.value)}
                  placeholder="tu@email.com" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={rPass}
                    onChange={e => setRPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required style={{ ...inputStyle, paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirmar contraseña *</label>
                <input type={showPass ? "text" : "password"} value={rPass2}
                  onChange={e => setRPass2(e.target.value)}
                  placeholder="Repite tu contraseña" required style={inputStyle} />
              </div>
              {rPass && (
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4].map(i => {
                    const strength = (rPass.length >= 8 ? 2 : rPass.length >= 5 ? 1 : 0) + (/[!@#$%^&*]/.test(rPass) ? 1 : 0);
                    return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? (strength <= 1 ? "#ef4444" : strength <= 2 ? "#f59e0b" : "#22c55e") : "#e2e8f0", transition: "background 0.3s" }} />;
                  })}
                </div>
              )}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={rTerms} onChange={e => setRTerms(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "#6c4dff", width: 16, height: 16 }} />
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  Acepto los <Link href="/terms" style={{ color: "#6c4dff", fontWeight: 600 }}>Términos y Condiciones</Link> y la{" "}
                  <Link href="/privacy" style={{ color: "#6c4dff", fontWeight: 600 }}>Política de Privacidad</Link>
                </span>
              </label>
              {error && <div style={errorStyle}>{error}</div>}
              <button type="submit" disabled={loading || sendingOtp} style={primaryBtnStyle}>
                {(loading || sendingOtp) ? <SpinnerInline /> : "✉️"}
                {sendingOtp ? "Enviando código..." : loading ? "Creando..." : "Crear cuenta y recibir código"}
              </button>
            </form>
          )}

          {/* ── OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleOtpVerify} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{sendingOtp ? "📤" : "📬"}</div>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>Verifica tu correo</h2>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                  {sendingOtp ? "Enviando código..." : (
                    <>Enviamos un código de 6 dígitos a<br />
                      <strong style={{ color: "#6c4dff" }}>{pendingEmail}</strong></>
                  )}
                </p>
              </div>

              <div className="otp-inputs-container" style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }}
                    className="otp-input"
                    value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                    maxLength={1} inputMode="numeric"
                    style={{
                      width: 48, height: 56, textAlign: "center",
                      fontSize: 22, fontWeight: 800, color: "#0f172a",
                      border: `2px solid ${digit ? "#6c4dff" : "#e2e8f0"}`,
                      borderRadius: 12, outline: "none",
                      background: digit ? "#f5f3ff" : "#fff",
                      transition: "all 0.2s", fontFamily: "'Inter', sans-serif",
                    }}
                  />
                ))}
              </div>

              {error && (
                <div style={{
                  ...errorStyle,
                  background: error.startsWith("⚙️") ? "#f0f9ff" : "#fef2f2",
                  border: `1px solid ${error.startsWith("⚙️") ? "#93c5fd" : "#fecaca"}`,
                  color: error.startsWith("⚙️") ? "#1e40af" : "#dc2626",
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || sendingOtp} style={primaryBtnStyle}>
                {loading ? <SpinnerInline /> : "✅"}
                {loading ? "Verificando..." : "Verificar código"}
              </button>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  ¿No recibiste el código?{" "}
                  <button type="button"
                    disabled={resendCooldown > 0}
                    style={{
                      background: "none", border: "none",
                      color: resendCooldown > 0 ? "#94a3b8" : "#6c4dff",
                      fontWeight: 700, cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                      fontSize: 13,
                    }}
                    onClick={resendOTP}>
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── SOCIAL SIMULATOR ── */}
          {step === "social-sim" && socialProvider && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <button type="button" onClick={() => { setStep("choose"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#6c4dff", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  ← Volver a opciones
                </button>
                <div style={{
                  marginTop: 12, padding: "8px 12px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  color: "#166534",
                  fontSize: 12, display: "flex", alignItems: "center", gap: 6, fontWeight: 500
                }}>
                  <span>⚙️</span>
                  <span>
                    <strong>Simulador de Inicio de Sesión Social:</strong> Flujo rápido de desarrollo.
                  </span>
                </div>
              </div>

              {/* Box specific to Facebook */}
              {socialProvider === "Facebook" && (
                <div style={{ border: "1.5px solid #1877f2", borderRadius: 16, padding: "20px 16px", background: "#f0f2f5", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  {/* Facebook Header */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1c1e21", margin: 0 }}>Iniciar sesión con Facebook</h3>
                    <p style={{ fontSize: 11, color: "#606770", margin: 0, textAlign: "center", lineHeight: 1.4, maxWidth: 360 }}>
                      El proceso de registro o inicio de sesión con Facebook (conocido como Facebook Login) te permite acceder a aplicaciones de forma rápida y segura utilizando las credenciales de tu cuenta de Facebook, sin necesidad de crear una nueva contraseña.
                    </p>
                  </div>

                  {!socialCustomMode ? (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                      <button type="button" onClick={() => handleSocialSubmit("groobmarket@gmail.com", "Groob Market Support")}
                        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, borderRadius: 12, border: "1px solid #dddfe2", background: "#fff", cursor: "pointer", transition: "background 0.2s", textAlign: "left" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f4f6f8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1877f2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                          FB
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1e21" }}>Groob Market</div>
                          <div style={{ fontSize: 11, color: "#606770" }}>groobmarket@gmail.com</div>
                        </div>
                        <span style={{ fontSize: 10, background: "#e7f3ff", color: "#1877f2", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Perfil principal</span>
                      </button>

                      <button type="button" onClick={() => setSocialCustomMode(true)}
                        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, borderRadius: 12, border: "1px solid #dddfe2", background: "#fff", cursor: "pointer", transition: "background 0.2s", textAlign: "left" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#f4f6f8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e4e6eb", color: "#1c1e21", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>
                          ＋
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1877f2" }}>Usar otra cuenta de Facebook</div>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSocialSubmit(socialEmail, socialName); }} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Correo o Teléfono</label>
                        <input type="email" placeholder="tu_correo@facebook.com" required value={socialEmail} onChange={e => setSocialEmail(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Nombre en Facebook</label>
                        <input type="text" placeholder="Andrés Inciarte" required value={socialName} onChange={e => setSocialName(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <button type="button" onClick={() => setSocialCustomMode(false)} style={{ background: "none", border: "none", color: "#1877f2", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                          Volver
                        </button>
                        <button type="submit" disabled={loading} style={{ background: "#1877f2", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          {loading ? <SpinnerInline /> : "Iniciar sesión"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Box specific to Instagram */}
              {socialProvider === "Instagram" && (
                <div style={{ border: "1.5px solid #cc2366", borderRadius: 16, padding: "20px 16px", background: "linear-gradient(135deg, #fff5f5 0%, #fff 100%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  {/* Instagram Header */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", borderRadius: "50%", padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#262626", margin: 0, fontFamily: "'Inter', sans-serif" }}>Continuar con Instagram</h3>
                    <p style={{ fontSize: 11, color: "#8e8e8e", margin: 0, textAlign: "center", lineHeight: 1.4, maxWidth: 360 }}>
                      El proceso de registro o inicio de sesión con Instagram te permite acceder a aplicaciones de forma rápida y segura utilizando las credenciales de tu cuenta de Instagram, sin necesidad de crear una nueva contraseña.
                    </p>
                  </div>

                  {!socialCustomMode ? (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                      <button type="button" onClick={() => handleSocialSubmit("groobmarket@gmail.com", "Groob Market Support")}
                        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, borderRadius: 12, border: "1px solid #dbdbdb", background: "#fff", cursor: "pointer", transition: "background 0.2s", textAlign: "left" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                          IG
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#262626" }}>groob_market</div>
                          <div style={{ fontSize: 11, color: "#8e8e8e" }}>groobmarket@gmail.com</div>
                        </div>
                        <span style={{ fontSize: 10, background: "#fdf2f8", color: "#db2777", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Vinculado</span>
                      </button>

                      <button type="button" onClick={() => setSocialCustomMode(true)}
                        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: 12, borderRadius: 12, border: "1px solid #dbdbdb", background: "#fff", cursor: "pointer", transition: "background 0.2s", textAlign: "left" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#efefef", color: "#262626", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>
                          ＋
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0095f6" }}>Usar otra cuenta de Instagram</div>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSocialSubmit(socialEmail, socialName); }} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Usuario o Correo</label>
                        <input type="email" placeholder="ejemplo@instagram.com" required value={socialEmail} onChange={e => setSocialEmail(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Nombre Completo</label>
                        <input type="text" placeholder="Andrés Inciarte" required value={socialName} onChange={e => setSocialName(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <button type="button" onClick={() => setSocialCustomMode(false)} style={{ background: "none", border: "none", color: "#0095f6", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                          Volver
                        </button>
                        <button type="submit" disabled={loading} style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          {loading ? <SpinnerInline /> : "Continuar"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {error && <div style={errorStyle}>{error}</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SpinnerInline() {
  return (
    <span style={{
      width: 15, height: 15,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTop: "2px solid white", borderRadius: "50%",
      display: "inline-block", animation: "spin 0.8s linear infinite",
    }} />
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12,
  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
  fontFamily: "'Inter', sans-serif", outline: "none", background: "#fff",
  transition: "border-color 0.2s",
};
const primaryBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "13px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
  fontFamily: "'Inter', sans-serif", transition: "all 0.2s",
  boxShadow: "0 4px 16px rgba(108,77,255,0.3)",
};
const errorStyle: React.CSSProperties = {
  padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
  borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 500,
};

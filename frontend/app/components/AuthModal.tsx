"use client";

import { useEffect, useRef, useState } from "react";
import GroobLogo from "./GroobLogo";

type Step = "choose" | "login-email" | "register-email" | "otp";

interface Props {
  onClose: () => void;
  onSuccess?: (user: { name: string; email: string }) => void;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [rName, setRName] = useState("");
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
      localStorage.setItem("groob_token", data.access || "");
      localStorage.setItem("groob_refresh", data.refresh || "");
      localStorage.setItem("groob_user", JSON.stringify({ email: loginEmail, name: loginEmail.split("@")[0] }));
      window.dispatchEvent(new Event("groob_auth_update"));
      onSuccess?.({ email: loginEmail, name: loginEmail.split("@")[0] });
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
    if (rPass !== rPass2) { setError("Las contraseñas no coinciden"); return; }
    if (!rTerms) { setError("Debes aceptar los términos y condiciones"); return; }
    if (rPass.length < 6) { setError("La contraseña debe tener mínimo 6 caracteres"); return; }

    setPendingEmail(rEmail);
    setPendingName(rName);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Código inválido");

      localStorage.setItem("groob_token", data.access || "");
      localStorage.setItem("groob_refresh", data.refresh || "");
      localStorage.setItem("groob_user", JSON.stringify({
        email: pendingEmail,
        name: data.user?.name || pendingName,
      }));
      window.dispatchEvent(new Event("groob_auth_update"));
      onSuccess?.({ email: pendingEmail, name: data.user?.name || pendingName });
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

  function SocialBtn({ provider, icon, color, bg, href }: {
    provider: string; icon: React.ReactNode; color: string; bg: string; href?: string;
  }) {
    const handleClick = () => {
      if (href) {
        window.open(href, "_blank");
      } else {
        alert(`Integración con ${provider} próximamente 🚀\n\nPor ahora puedes registrarte con tu correo electrónico.`);
      }
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
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 440,
        boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
        overflow: "hidden", position: "relative",
        maxHeight: "95vh", overflowY: "auto",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          padding: "24px 28px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <GroobLogo size={30} variant="white" />
          <button onClick={onClose} id="auth-close" style={{
            background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18,
          }}>✕</button>
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
              <SocialBtn provider="Google" color="#1a1a1a" bg="#fff"
                href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1099390134906-tlugf8rj47v3o1v211t7560d8kpo7nov.apps.googleusercontent.com'}&redirect_uri=${encodeURIComponent('http://localhost:3000/auth/callback')}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`}
                icon={<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
              />
              <SocialBtn provider="Facebook" color="#fff" bg="#1877f2"
                href="https://www.facebook.com/login"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
              />
              <SocialBtn provider="Instagram" color="#fff" bg="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
                href="https://www.instagram.com/accounts/login"
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
                <a href="#" style={{ color: "#6c4dff" }}>Términos de Uso</a>{" "}
                y <a href="#" style={{ color: "#6c4dff" }}>Política de Privacidad</a>
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
              {[
                { label: "Nombre completo *", val: rName, set: setRName, placeholder: "Andrés García", type: "text" },
                { label: "Correo electrónico *", val: rEmail, set: setREmail, placeholder: "tu@email.com", type: "email" },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder} required style={inputStyle} />
                </div>
              ))}
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
                  Acepto los <a href="#" style={{ color: "#6c4dff", fontWeight: 600 }}>Términos y Condiciones</a> y la{" "}
                  <a href="#" style={{ color: "#6c4dff", fontWeight: 600 }}>Política de Privacidad</a>
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

              <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }}
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

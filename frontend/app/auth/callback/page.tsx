"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Procesando inicio de sesión...");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      handleGoogleLogin(code);
    } else {
      setError("No se recibió ningún código de autorización de Google.");
    }
  }, [searchParams]);

  async function handleGoogleLogin(code: string) {
    try {
      setStatus("Validando con el servidor...");
      const res = await fetch(`${API}/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Error al autenticar con Google");
      }

      const data = await res.json();
      
      // Guardar sesión
      localStorage.setItem("groob_token", data.access || "");
      localStorage.setItem("groob_refresh", data.refresh || "");
      localStorage.setItem("groob_user", JSON.stringify({
        email: data.user?.email || "",
        name: data.user?.name || "Usuario Google",
        picture: data.user?.picture || "",
        avatar_icon: data.user?.avatar_icon || "",
      }));

      // Notificar a la app
      window.dispatchEvent(new Event("groob_auth_update"));
      
      setStatus("¡Inicio de sesión exitoso! Redirigiendo...");
      setTimeout(() => router.push("/"), 1500);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fatal en la autenticación");
    }
  }

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif", background: "#f8fafc"
    }}>
      <div style={{
        background: "#fff", padding: "40px", borderRadius: "24px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "400px"
      }}>
        <div style={{ fontSize: "40px", marginBottom: "20px" }}>
          {error ? "❌" : "🚀"}
        </div>
        <h2 style={{ margin: "0 0 10px", color: error ? "#ef4444" : "#0f172a" }}>
          {error ? "Oops! Algo salió mal" : "Groob Market"}
        </h2>
        <p style={{ color: "#64748b", margin: 0 }}>{error || status}</p>
        
        {error && (
          <button 
            onClick={() => router.push("/")}
            style={{
              marginTop: "24px", padding: "12px 24px", borderRadius: "12px",
              background: "#6c4dff", color: "#fff", border: "none", fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, sans-serif", background: "#f8fafc"
      }}>
        <p>Cargando autenticación...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}


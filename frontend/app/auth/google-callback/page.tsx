"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GroobLogo from "../../components/GroobLogo";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processAuth() {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        
        let idToken = "";
        
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          idToken = params.get("id_token") || "";
        }
        
        if (!idToken && search) {
          const params = new URLSearchParams(search);
          idToken = params.get("id_token") || "";
        }

        if (!idToken) {
          throw new Error("No se recibió el token de autenticación de Google.");
        }

        const res = await fetch(`${API}/auth/social-login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: idToken,
            provider: "Google",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.detail || "Error validando credenciales de Google");
        }

        const data = await res.json();
        
        // Almacenar tokens y datos del usuario
        localStorage.setItem("groob_token", data.access || "");
        localStorage.setItem("groob_refresh", data.refresh || "");
        localStorage.setItem("groob_user", JSON.stringify(data.user));
        
        // Notificar cambios globales
        window.dispatchEvent(new Event("groob_auth_update"));
        
        // Redirigir al inicio tras una breve pausa para la animación
        setTimeout(() => {
          router.replace("/");
        }, 1200);

      } catch (err: any) {
        setError(err?.message || "Ocurrió un error inesperado durante la autenticación.");
        setLoading(false);
      }
    }

    processAuth();
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, #1e1b4b 0%, #0f172a 100%)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: 24,
    }}>
      <div style={{
        background: "rgba(30, 41, 59, 0.4)",
        backdropFilter: "blur(16px)",
        border: "1.5px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 24,
        padding: "48px 32px",
        width: "100%",
        maxWidth: 420,
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}>
        {/* Logo Container */}
        <div style={{
          display: "inline-flex",
          padding: 16,
          background: "linear-gradient(135deg, #6c4dff 0%, #9b8cff 100%)",
          borderRadius: "50%",
          boxShadow: "0 8px 30px rgba(108, 77, 255, 0.4)",
          marginBottom: 24,
        }}>
          <GroobLogo size={36} variant="white" />
        </div>

        {loading ? (
          <div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 12,
              color: "#fff",
            }}>
              Verificando cuenta...
            </h1>
            <p style={{
              color: "#94a3b8",
              fontSize: 14,
              marginBottom: 32,
              lineHeight: 1.5,
            }}>
              Estamos estableciendo una conexión segura con Google. Por favor espera un momento.
            </p>
            {/* Spinning Indicator */}
            <div style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(108, 77, 255, 0.2)",
              borderTopColor: "#6c4dff",
              borderRadius: "50%",
              margin: "0 auto",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : error ? (
          <div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 12,
              color: "#ef4444",
            }}>
              ¡Ups! Error de autenticación
            </h1>
            <p style={{
              color: "#cbd5e1",
              fontSize: 13,
              marginBottom: 32,
              lineHeight: 1.6,
            }}>
              {error}
            </p>
            
            <button
              onClick={() => router.replace("/")}
              style={{
                width: "100%",
                padding: "12px 24px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #6c4dff 0%, #4f37cc 100%)",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(108, 77, 255, 0.3)",
              }}
            >
              Volver a la tienda
            </button>
          </div>
        ) : (
          <div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: 12,
              color: "#2ec27e",
            }}>
              ¡Ingreso exitoso!
            </h1>
            <p style={{
              color: "#cbd5e1",
              fontSize: 14,
              marginBottom: 32,
              lineHeight: 1.5,
            }}>
              Te hemos autenticado correctamente. Redirigiéndote al inicio...
            </p>
            <div style={{
              fontSize: 32,
              color: "#2ec27e",
            }}>
              🎉
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

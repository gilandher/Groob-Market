"use client";

import { useEffect, useState } from "react";

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 2,
            fontSize: 30, lineHeight: 1,
            color: star <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.15s",
            transform: star <= (hovered || value) ? "scale(1.15)" : "scale(1)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "😞 Muy malo",
  2: "😐 Regular",
  3: "😊 Bueno",
  4: "😁 Muy bueno",
  5: "🤩 ¡Excelente!",
};

export default function ReviewForm({
  productId,
  onCreated,
}: {
  productId: number;
  onCreated: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("groob_token");
    setIsLoggedIn(!!token);

    // Check if user already reviewed this product
    if (token) {
      const key = `groob_reviewed_${productId}`;
      setAlreadyReviewed(sessionStorage.getItem(key) === "1");
    }
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      setMsg("Por favor escribe un comentario.");
      return;
    }

    setLoading(true);
    setMsg("");
    const token = localStorage.getItem("groob_token");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${apiBase}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product: productId, rating, comment }),
      });

      if (res.status === 400) {
        const data = await res.json();
        const errMsg = data?.non_field_errors?.[0] || data?.detail || "Error enviando reseña.";
        if (errMsg.toLowerCase().includes("ya") || errMsg.toLowerCase().includes("once")) {
          setAlreadyReviewed(true);
          sessionStorage.setItem(`groob_reviewed_${productId}`, "1");
          setMsg("Ya enviaste una reseña para este producto.");
        } else {
          setMsg(errMsg);
        }
        return;
      }

      if (!res.ok) throw new Error("Error enviando reseña.");

      sessionStorage.setItem(`groob_reviewed_${productId}`, "1");
      setAlreadyReviewed(true);
      setSuccess(true);
      setComment("");
      setRating(5);
      onCreated();
    } catch (err: any) {
      setMsg(err?.message || "Error enviando reseña.");
    } finally {
      setLoading(false);
    }
  }

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        borderRadius: 16, padding: "24px",
        border: "1px solid rgba(108,77,255,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <p style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>
          ¿Compraste este producto?
        </p>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Inicia sesión para dejar tu reseña y ayudar a otros clientes.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("groob_open_auth"))}
          style={{
            padding: "11px 28px", borderRadius: 12,
            background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
            border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          Iniciar sesión para opinar
        </button>
      </div>
    );
  }

  // ── Already reviewed ────────────────────────────────────────────────────────
  if (alreadyReviewed || success) {
    return (
      <div style={{
        background: "#f0fdf4", borderRadius: 16, padding: "24px",
        border: "1px solid #86efac", textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <p style={{ fontWeight: 800, fontSize: 16, color: "#166534" }}>
          {success ? "¡Gracias por tu reseña!" : "Ya enviaste una reseña"}
        </p>
        <p style={{ fontSize: 13, color: "#166534", marginTop: 4 }}>
          {success
            ? "Tu opinión ha sido publicada. ¡Mucho éxito!"
            : "Solo puedes dejar una reseña por producto."}
        </p>
      </div>
    );
  }

  // ── Review form ─────────────────────────────────────────────────────────────
  return (
    <div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
        ✍️ Escribe tu opinión
      </h3>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Star picker */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Calificación
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StarPicker value={rating} onChange={setRating} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#6c4dff" }}>
              {RATING_LABELS[rating]}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Comentario
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Cuéntanos tu experiencia con este producto... ¿Qué te gustó? ¿Llegó en buen estado?"
            required
            style={{
              width: "100%", padding: "12px 16px",
              border: "1.5px solid #e2e8f0", borderRadius: 12,
              fontSize: 14, fontFamily: "'Inter', sans-serif",
              outline: "none", resize: "vertical", color: "#0f172a",
              boxSizing: "border-box",
            }}
            onFocus={e => { e.target.style.borderColor = "#6c4dff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            {comment.length}/500 caracteres
          </p>
        </div>

        {msg && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "#fef2f2", border: "1px solid #fecaca",
            color: "#dc2626", fontSize: 13, fontWeight: 600,
          }}>
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "13px 28px", borderRadius: 12,
            background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
            border: "none", color: "#fff", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif",
            boxShadow: "0 4px 16px rgba(108,77,255,0.3)",
            opacity: loading ? 0.7 : 1,
            width: "fit-content",
            transition: "opacity 0.2s",
          }}
        >
          {loading ? "Enviando..." : "⭐ Publicar reseña"}
        </button>
      </form>
    </div>
  );
}
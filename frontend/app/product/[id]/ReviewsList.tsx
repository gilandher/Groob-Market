"use client";

import { useEffect, useState } from "react";

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: 15, color: i < rating ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name?.slice(0, 2).toUpperCase() || "??";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  return `Hace ${Math.floor(months / 12)} año${Math.floor(months / 12) > 1 ? "s" : ""}`;
}

interface Props {
  productId: number;
  reloadKey: number;
  onStatsUpdate?: (avg: number, count: number) => void;
}

export default function ReviewsList({ productId, reloadKey, onStatsUpdate }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiBase}/products/${productId}/reviews/`);
        if (!res.ok) return;
        const data = (await res.json()) as Review[];
        setReviews(data);

        // Stats
        if (onStatsUpdate && data.length > 0) {
          const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
          onStatsUpdate(avg, data.length);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId, reloadKey]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
        ))}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div style={{
        textAlign: "center", padding: "32px 20px",
        background: "#f8fafc", borderRadius: 16,
        border: "1px dashed #e2e8f0",
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
        <p style={{ fontWeight: 700, color: "#374151", fontSize: 15 }}>Sé el primero en opinar</p>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          Aún no hay reseñas para este producto.
        </p>
      </div>
    );
  }

  // Summary stats
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const starCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100),
  }));

  return (
    <div>
      {/* Summary box */}
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr", gap: 24,
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        border: "1px solid rgba(108,77,255,0.15)",
      }}>
        {/* Big number */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 52, fontWeight: 900, color: "#6c4dff", lineHeight: 1 }}>{avgRating.toFixed(1)}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ fontSize: 16, color: i < Math.round(avgRating) ? "#f59e0b" : "#d1d5db" }}>★</span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Bar chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          {starCounts.map(({ star, count, pct }) => (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b", width: 14, textAlign: "right" }}>{star}</span>
              <span style={{ fontSize: 12, color: "#f59e0b" }}>★</span>
              <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: "linear-gradient(90deg, #6c4dff, #9b8cff)",
                  borderRadius: 4, transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", width: 24 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {reviews.map(r => (
          <div key={r.id} style={{
            background: "#fff", borderRadius: 16, padding: "18px 20px",
            border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 14,
              }}>
                {getInitials(r.user_name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{r.user_name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <StarDisplay rating={r.rating} />
                      {r.is_verified_purchase && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "#166534",
                          background: "#dcfce7", padding: "1px 7px", borderRadius: 10,
                        }}>
                          ✅ Compra verificada
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(r.created_at)}</span>
                </div>
                {r.comment && (
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginTop: 10 }}>
                    {r.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import type { Review } from "../../../types/review";

function stars(rating: number) {
  const r = Math.max(0, Math.min(5, rating));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

export default function ReviewsList({
  productId,
  reloadKey,
}: {
  productId: number;
  reloadKey: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr("");

        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

        const res = await fetch(`${apiBase}/products/${productId}/reviews/`);
        if (!res.ok) throw new Error(await res.text());

        const data = (await res.json()) as Review[];
        setReviews(data);
      } catch (e: any) {
        setErr(e?.message || "Error cargando reseñas");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [productId, reloadKey]);

  if (loading) return <p className="mt-6 text-slate-600">Cargando reseñas…</p>;

  if (err)
    return (
      <p className="mt-6 text-sm text-red-600 whitespace-pre-wrap">
        ❌ {err}
      </p>
    );

  if (!reviews.length)
    return <p className="mt-6 text-slate-600">Aún no hay reseñas públicas.</p>;

  return (
    <div className="mt-6 space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{r.user_name}</p>
            <p className="text-sm text-slate-600">{stars(r.rating)}</p>
          </div>

          <p className="mt-2 text-slate-700">{r.comment}</p>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {r.is_verified_purchase ? "✅ Compra verificada" : "🕒 Sin verificación"}
            </span>
            <span>{new Date(r.created_at).toLocaleString("es-CO")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
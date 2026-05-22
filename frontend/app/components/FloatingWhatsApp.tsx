"use client";

import { useEffect, useState } from "react";

const PROMO_MESSAGES = [
  "🔥 ¡Envío GRATIS hoy en Medellín, Bello, Envigado e Itagüí!",
  "⚡ Escríbenos ahora y obtén un 10% de descuento en tu primera compra",
  "📱 ¿Buscas cargador o audífonos? ¡Pregúntanos por stock inmediato!",
  "🎁 Compra segura contra entrega: ¡Pagas cuando recibes tu producto!",
];

export default function FloatingWhatsApp() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [badgeCount, setBadgeCount] = useState(1);
  const [wiggle, setWiggle] = useState(false);

  useEffect(() => {
    // Initial delay before showing first promo message
    const initialTimeout = setTimeout(() => {
      setShowTooltip(true);
    }, 4000);

    // Rotate messages every 8 seconds
    const interval = setInterval(() => {
      setShowTooltip(false);
      // Wait for fade-out animation to complete, then change text and fade-in
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % PROMO_MESSAGES.length);
        setShowTooltip(true);
        setBadgeCount((prev) => (prev > 0 ? prev : 1));
      }, 500);
    }, 8500);

    // Periodic wiggle animation on button to draw attention
    const wiggleInterval = setInterval(() => {
      setWiggle(true);
      setTimeout(() => setWiggle(false), 1000);
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      clearInterval(wiggleInterval);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }
        @keyframes wa-wiggle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          15% { transform: scale(1.08) rotate(-8deg); }
          30% { transform: scale(1.08) rotate(8deg); }
          45% { transform: scale(1.08) rotate(-4deg); }
          60% { transform: scale(1.08) rotate(4deg); }
          75% { transform: scale(1.03) rotate(-2deg); }
          90% { transform: scale(1.03) rotate(2deg); }
        }
        @keyframes tooltip-in {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .wa-floating-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 58px;
          height: 58px;
          background-color: #25d366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
          cursor: pointer;
          z-index: 9999;
          transition: transform 0.2s, background-color 0.2s;
          text-decoration: none;
          animation: wa-pulse 2s infinite;
        }
        .wa-floating-btn:hover {
          background-color: #20ba5a;
          transform: scale(1.05);
        }
        .wa-floating-btn.wiggle {
          animation: wa-wiggle 1s ease-in-out, wa-pulse 2s infinite;
        }
        .wa-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 800;
          border-radius: 50%;
          width: 19px;
          height: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .wa-tooltip {
          position: fixed;
          bottom: 94px;
          right: 24px;
          max-width: 280px;
          background: white;
          border-radius: 16px;
          padding: 12px 32px 12px 14px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(108,77,255,0.1);
          z-index: 9998;
          font-size: 13px;
          color: #1e293b;
          font-weight: 500;
          line-height: 1.4;
          font-family: 'Inter', sans-serif;
          animation: tooltip-in 0.3s ease forwards;
        }
        .wa-tooltip::after {
          content: '';
          position: absolute;
          bottom: -8px;
          right: 20px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }
        .wa-tooltip-close {
          position: absolute;
          top: 6px;
          right: 8px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 2px;
          line-height: 1;
        }
        .wa-tooltip-close:hover {
          color: #ef4444;
        }
      `}</style>

      {showTooltip && (
        <div className="wa-tooltip">
          <button
            className="wa-tooltip-close"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(false);
              setBadgeCount(0);
            }}
            title="Cerrar"
          >
            ×
          </button>
          <span>{PROMO_MESSAGES[msgIndex]}</span>
        </div>
      )}

      <a
        href="https://wa.me/573001805448?text=Hola%20Groob%20Market%20👋,%20quiero%20hacer%20una%20consulta."
        target="_blank"
        rel="noreferrer"
        className={`wa-floating-btn ${wiggle ? "wiggle" : ""}`}
        onClick={() => {
          setBadgeCount(0);
          setShowTooltip(false);
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49" />
        </svg>

        {badgeCount > 0 && <span className="wa-badge">{badgeCount}</span>}
      </a>
    </>
  );
}

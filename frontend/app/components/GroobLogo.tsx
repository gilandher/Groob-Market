"use client";

interface Props {
  size?: number;
  showText?: boolean;
  variant?: "default" | "white";
}

export default function GroobLogo({ size = 36, showText = true, variant = "default" }: Props) {
  const blue = variant === "white" ? "#fff" : "#1565d8";
  const green = variant === "white" ? "rgba(255,255,255,0.85)" : "#2ec27e";
  const textDark = variant === "white" ? "#fff" : "#0f172a";
  const textPurple = variant === "white" ? "rgba(255,255,255,0.9)" : "#7c3aed";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* SVG Icon - G with power symbol and code brackets */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Left bracket < */}
        <path
          d="M18 22 L8 40 L18 58"
          stroke={green}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Right bracket > */}
        <path
          d="M62 22 L72 40 L62 58"
          stroke={green}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Power/G arc - the "G" shaped power button */}
        <path
          d="M52 20 A22 22 0 1 0 52 60"
          stroke={blue}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Power line top */}
        <line x1="40" y1="10" x2="40" y2="26" stroke={green} strokeWidth="6" strokeLinecap="round" />
        {/* G horizontal bar */}
        <line x1="40" y1="40" x2="52" y2="40" stroke={blue} strokeWidth="6" strokeLinecap="round" />
        {/* G inner corner square - the distinctive square inside G */}
        <rect x="46" y="38" width="8" height="8" rx="2" fill={green} />
      </svg>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{
            fontSize: size * 0.45,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontFamily: "'Inter', sans-serif",
          }}>
            <span style={{ color: textDark }}>Groob </span>
            <span style={{ color: textPurple }}>Market</span>
          </span>
          <span style={{
            fontSize: size * 0.22,
            color: variant === "white" ? "rgba(255,255,255,0.6)" : "#94a3b8",
            fontWeight: 500,
            letterSpacing: "0.05em",
            marginTop: 1,
          }}>
            Vitrina Virtual
          </span>
        </div>
      )}
    </div>
  );
}

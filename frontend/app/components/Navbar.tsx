"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart } from "../../lib/cart";
import { getWishlist } from "../../lib/wishlist";
import GroobLogo from "./GroobLogo";
import AuthModal from "./AuthModal";

type User = { name: string; email: string } | null;

export default function Navbar() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [searchQ, setSearchQ] = useState("");
  const [user, setUser] = useState<User>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cart sync
  useEffect(() => {
    function sync() {
      const items = getCart();
      setCartCount(items.reduce((acc, it) => acc + it.qty, 0));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("groob_cart_update", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("groob_cart_update", sync);
    };
  }, []);

  // Wishlist sync
  useEffect(() => {
    function syncWish() { setWishCount(getWishlist().length); }
    syncWish();
    window.addEventListener("groob_wishlist_update", syncWish);
    window.addEventListener("storage", syncWish);
    return () => {
      window.removeEventListener("groob_wishlist_update", syncWish);
      window.removeEventListener("storage", syncWish);
    };
  }, []);

  // Auth sync
  useEffect(() => {
    function syncUser() {
      try {
        const raw = localStorage.getItem("groob_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch { setUser(null); }
    }
    syncUser();
    window.addEventListener("groob_auth_update", syncUser);
    return () => window.removeEventListener("groob_auth_update", syncUser);
  }, []);

  // Open Auth Modal via internal Event
  useEffect(() => {
    const triggerAuth = () => setShowAuth(true);
    window.addEventListener("groob_open_auth", triggerAuth);
    return () => window.removeEventListener("groob_open_auth", triggerAuth);
  }, []);

  // Navbar scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQ.trim())}`);
    }
  }

  function logout() {
    localStorage.removeItem("groob_token");
    localStorage.removeItem("groob_refresh");
    localStorage.removeItem("groob_user");
    setUser(null);
    setShowUserMenu(false);
    window.dispatchEvent(new Event("groob_auth_update"));
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() || "";

  return (
    <>
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(u) => setUser(u)}
        />
      )}

      <header style={{ position: "sticky", top: 0, zIndex: 500 }}>
        {/* ── TOP BAR ── */}
        <div style={{
          background: "linear-gradient(90deg, #4f37cc, #6c4dff, #9b8cff)",
          padding: "6px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "rgba(255,255,255,0.9)",
        }}>
          <span>📍 Entregas el mismo día en Medellín, Bello, Itagüí, Envigado y Sabaneta</span>
          <a href="https://wa.me/573011963515" target="_blank" rel="noreferrer"
            style={{ color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/>
            </svg>
            301 196 3515
          </a>
        </div>

        {/* ── MAIN NAVBAR ── */}
        <nav style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #f1f5f9",
          boxShadow: scrolled ? "0 4px 24px rgba(108,77,255,0.1)" : "none",
          transition: "box-shadow 0.3s",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            height: 64, maxWidth: 1280, margin: "0 auto", padding: "0 20px",
          }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
              <GroobLogo size={38} />
            </Link>

            {/* Search bar - desktop */}
            <form onSubmit={handleSearch} style={{
              flex: 1, display: "flex", alignItems: "center",
              background: "#f8fafc", border: "1.5px solid #e2e8f0",
              borderRadius: 12, overflow: "hidden", maxWidth: 520,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
              onFocus={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#6c4dff";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(108,77,255,0.1)";
              }}
              onBlur={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
              className="search-form-desktop"
            >
              <input
                type="text"
                placeholder="Buscar productos, categorías..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                id="search-input"
                style={{
                  flex: 1, padding: "11px 16px", border: "none",
                  background: "transparent", fontSize: 14, color: "#0f172a",
                  fontFamily: "'Inter', sans-serif", outline: "none",
                }}
              />
              <button
                type="submit"
                aria-label="Buscar"
                style={{
                  padding: "10px 18px", background: "#6c4dff", border: "none",
                  color: "#fff", cursor: "pointer", transition: "background 0.2s",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="search-btn-text">Buscar</span>
              </button>
            </form>

            {/* Phone - desktop */}
            <a href="tel:+573011963515" style={{
              display: "flex", alignItems: "center", gap: 6, color: "#374151",
              fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
              flexShrink: 0,
            }} className="navbar-phone-label">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              301 196 3515
            </a>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>

              {/* Mobile search toggle */}
              <button
                onClick={() => setMobileSearchOpen(v => !v)}
                className="mobile-search-btn"
                style={{
                  width: 40, height: 40, borderRadius: 10, border: "none",
                  background: "#f8fafc", color: "#374151", cursor: "pointer",
                  display: "none", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* User button */}
              <div ref={userMenuRef} style={{ position: "relative" }}>
                {user ? (
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    id="btn-user-menu"
                    style={{
                      width: 40, height: 40, borderRadius: 10, border: "none",
                      background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
                      color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(108,77,255,0.3)",
                    }}
                  >
                    {initials}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    id="btn-login"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 10, border: "1.5px solid #6c4dff",
                      background: "#f5f3ff", color: "#6c4dff", cursor: "pointer",
                      fontWeight: 700, fontSize: 13, fontFamily: "'Inter', sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="login-btn-text">Ingresar</span>
                  </button>
                )}

                {/* User dropdown menu */}
                {showUserMenu && user && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.15)", minWidth: 220,
                    padding: "8px 0", zIndex: 100,
                    animation: "fadeInUp 0.2s ease",
                  }}>
                    <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6c4dff, #9b8cff)",
                        color: "#fff", display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 800, fontSize: 14,
                        marginBottom: 8,
                      }}>
                        {initials}
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{user.name}</p>
                      <p style={{ fontSize: 12, color: "#94a3b8" }}>{user.email}</p>
                    </div>
                    {[
                      { icon: "🛍️", label: "Mis pedidos", href: "/orders" },
                      { icon: "❤️", label: "Lista de deseos", href: "/wishlist" },
                      { icon: "👤", label: "Mi perfil", href: "/profile" },
                    ].map(item => (
                      <Link key={item.href} href={item.href}
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 16px", fontSize: 14, color: "#374151",
                          textDecoration: "none", transition: "background 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span>{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <div style={{ margin: "4px 0", borderTop: "1px solid #f1f5f9" }} />
                    <button onClick={logout} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 16px", fontSize: 14, color: "#ef4444",
                      background: "none", border: "none", cursor: "pointer", width: "100%",
                      fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    }}>
                      🚪 Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* Wishlist button */}
              <Link
                href="/wishlist"
                id="btn-wishlist"
                title="Lista de deseos"
                style={{
                  position: "relative", width: 40, height: 40, borderRadius: 10,
                  background: wishCount > 0 ? "#fef2f2" : "#f8fafc",
                  border: `1.5px solid ${wishCount > 0 ? "#fecaca" : "#e2e8f0"}`,
                  color: wishCount > 0 ? "#ef4444" : "#374151", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none", transition: "all 0.2s", fontSize: 18,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "#fef2f2";
                  (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = wishCount > 0 ? "#fef2f2" : "#f8fafc";
                  (e.currentTarget as HTMLElement).style.borderColor = wishCount > 0 ? "#fecaca" : "#e2e8f0";
                }}
              >
                {wishCount > 0 ? "❤️" : "🤍"}
                {wishCount > 0 && (
                  <span style={{
                    position: "absolute", top: -6, right: -6,
                    background: "#ef4444", color: "#fff",
                    fontSize: 10, fontWeight: 800,
                    width: 18, height: 18, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fff",
                  }}>
                    {wishCount > 9 ? "9+" : wishCount}
                  </span>
                )}
              </Link>

              {/* Cart button */}
              <Link
                href="/cart"
                id="btn-cart"
                title="Carrito"
                style={{
                  position: "relative", width: 40, height: 40, borderRadius: 10,
                  background: "#f8fafc", border: "1.5px solid #e2e8f0",
                  color: "#374151", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none", transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "#f5f3ff";
                  (e.currentTarget as HTMLElement).style.borderColor = "#6c4dff";
                  (e.currentTarget as HTMLElement).style.color = "#6c4dff";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                  (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                  (e.currentTarget as HTMLElement).style.color = "#374151";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span style={{
                    position: "absolute", top: -6, right: -6,
                    background: "#ef4444", color: "#fff",
                    fontSize: 10, fontWeight: 800,
                    width: 19, height: 19, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #fff",
                    animation: "pulseGlow 2s ease infinite",
                  }}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile search bar - expandable */}
          {mobileSearchOpen && (
            <div className="mobile-search-expanded" style={{ padding: "0 16px 12px" }}>
              <form onSubmit={handleSearch} style={{
                display: "flex", alignItems: "center",
                background: "#f8fafc", border: "1.5px solid #6c4dff",
                borderRadius: 12, overflow: "hidden",
                boxShadow: "0 0 0 3px rgba(108,77,255,0.1)",
              }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  style={{
                    flex: 1, padding: "11px 16px", border: "none",
                    background: "transparent", fontSize: 14, outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
                <button type="submit" style={{
                  padding: "10px 16px", background: "#6c4dff", border: "none",
                  color: "#fff", cursor: "pointer",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </nav>

        {/* ── CATEGORY TABS ── */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #f1f5f9",
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            maxWidth: 1280, margin: "0 auto", padding: "0 20px",
          }}>
            {[
              { slug: "all", label: "🏪 Todo", id: "tab-all" },
              { slug: "tecnologia", label: "💻 Tecnología", id: "tab-tecnologia" },
              { slug: "celulares", label: "📱 Celulares", id: "tab-celulares" },
              { slug: "hogar", label: "🏠 Hogar", id: "tab-hogar" },
              { slug: "moda", label: "👕 Moda", id: "tab-moda" },
              { slug: "belleza", label: "💄 Belleza", id: "tab-belleza" },
              { slug: "destacados", label: "⭐ Destacados", id: "tab-destacados" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug === "all" ? "/" : `/?cat=${cat.slug}`}
                id={cat.id}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "11px 16px", fontSize: 13, fontWeight: 600,
                  color: "#64748b", whiteSpace: "nowrap",
                  borderBottom: "2px solid transparent",
                  textDecoration: "none", transition: "all 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = "#6c4dff";
                  (e.currentTarget as HTMLElement).style.background = "#f5f3ff";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = "#64748b";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {cat.label}
              </Link>
            ))}

            <span style={{ marginLeft: "auto", flexShrink: 0, padding: "0 12px" }}>
              <a href="https://wa.me/573011963515" target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  background: "#25d366", padding: "5px 12px", borderRadius: 20,
                  textDecoration: "none",
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/>
                </svg>
                WhatsApp
              </a>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}

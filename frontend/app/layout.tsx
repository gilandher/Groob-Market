import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://groobmarket.com";
const SITE_NAME = "Groob Market";
const SITE_DESC = "Compra los mejores gadgets, celulares y accesorios tecnológicos con entrega el mismo día en Medellín, Bello, Itagüí, Envigado y Sabaneta. Pago contra entrega.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Tu Tecnología Favorita, Entregada Hoy Mismo`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "tecnología Medellín", "celulares baratos Medellín", "accesorios iPhone Colombia",
    "entrega mismo día Medellín", "pago contraentrega", "Groob Market", "gadgets Colombia",
    "smartwatch baratos", "audífonos bluetooth Colombia", "cargadores iPhone Colombia",
    "tienda online Bello", "tienda online Itagüí", "electrónicos Envigado",
    "vitrina virtual Medellín", "comprar celulares online Colombia",
  ],
  authors: [{ name: "Groob Code Technology", url: "https://groobcode.com" }],
  creator: "Groob Code Technology",
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Tu Tecnología Favorita, Entregada Hoy Mismo`,
    description: SITE_DESC,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Groob Market — Vitrina Virtual Tecnología Medellín",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Tu Tecnología Favorita`,
    description: SITE_DESC,
    images: [`${SITE_URL}/og-image.jpg`],
    creator: "@groobmarket",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// JSON-LD: Organization + LocalBusiness structured data
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness", "Store"],
  name: SITE_NAME,
  legalName: "Groob Code Technology",
  description: SITE_DESC,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  telephone: "+573011963515",
  email: "contacto@groobmarket.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Bello",
    addressLocality: "Bello",
    addressRegion: "Antioquia",
    addressCountry: "CO",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 6.3367,
    longitude: -75.5552,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday","Sunday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/groobmarket",
    "https://www.facebook.com/groobmarket",
    "https://wa.me/573011963515",
  ],
  areaServed: [
    { "@type": "City", name: "Medellín" },
    { "@type": "City", name: "Bello" },
    { "@type": "City", name: "Itagüí" },
    { "@type": "City", name: "Envigado" },
    { "@type": "City", name: "Sabaneta" },
  ],
  priceRange: "$$",
  currenciesAccepted: "COP",
  paymentAccepted: "Cash, Credit Card, Contra entrega",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESC,
  inLanguage: "es-CO",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" dir="ltr">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#6c4dff" />
        <meta name="msapplication-TileColor" content="#6c4dff" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preload critical resources */}
        <link rel="preload" href="/hero-products.png" as="image" />

        {/* Geo meta tags for local SEO */}
        <meta name="geo.region" content="CO-ANT" />
        <meta name="geo.placename" content="Medellín, Antioquia, Colombia" />
        <meta name="ICBM" content="6.2518, -75.5636" />
        <meta name="DC.language" content="es" />

        {/* WhatsApp */}
        <meta property="og:type" content="website" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Google Analytics - add GA_ID to env */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}

        <Navbar />
        <div style={{ flex: 1 }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}

import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://groobmarket.com";

const STATIC_ROUTES = [
  { url: "/", priority: 1.0, changeFrequency: "daily" as const },
  { url: "/?cat=tecnologia", priority: 0.9, changeFrequency: "daily" as const },
  { url: "/?cat=celulares", priority: 0.9, changeFrequency: "daily" as const },
  { url: "/?cat=hogar", priority: 0.8, changeFrequency: "weekly" as const },
  { url: "/?cat=moda", priority: 0.8, changeFrequency: "weekly" as const },
  { url: "/?cat=belleza", priority: 0.8, changeFrequency: "weekly" as const },
];

async function getProducts() {
  try {
    const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${API}/products/`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  const productRoutes = products.map((p: { id: number }) => ({
    url: `${BASE_URL}/product/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const staticRoutes = STATIC_ROUTES.map(r => ({
    url: `${BASE_URL}${r.url}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  return [...staticRoutes, ...productRoutes];
}

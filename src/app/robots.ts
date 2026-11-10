import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/api/",
        "/pay/",
        "/success",
        "/list",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/accept-invite",
        "/alerts/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

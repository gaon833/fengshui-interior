import type { Metadata, Viewport } from "next";
import site from "@/content/site.json";
import "@/styles/globals.css";
import "polotno/ui.css";
import SiteSettingsProvider from "@/components/site/SiteSettingsProvider";

const siteUrl = site.siteUrl || "https://fengshui-interior.pages.dev";
const keywords = site.seo.keywords
  .split(",")
  .map((keyword) => keyword.trim())
  .filter(Boolean);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.seo.title,
    template: `%s | ${site.brandName}`,
  },
  description: site.seo.description,
  keywords,
  applicationName: site.brandName,
  creator: site.company?.name || site.brandName,
  publisher: site.company?.name || site.brandName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: site.brandName,
    title: site.seo.title,
    description: site.seo.description,
    images: [{ url: site.seo.ogImage, alt: `${site.brandName} 대표 이미지` }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    images: [site.seo.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: site.seo.favicon || site.logo }],
    shortcut: [{ url: site.seo.favicon || site.logo }],
    apple: [{ url: site.seo.favicon || site.logo }],
  },
  manifest: "/manifest.webmanifest",
  category: "interior design",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><SiteSettingsProvider>{children}</SiteSettingsProvider></body>
    </html>
  );
}

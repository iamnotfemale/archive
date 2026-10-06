import type { Metadata } from "next";
import "./globals.css";
import InkSplash from "@/components/InkSplash";
import Chrome from "@/components/Chrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.yeoziphab.com"),
  title: { default: "yeoziphab", template: "%s — yeoziphab" },
  description: "A developer’s archive. Reads, builds, keeps.",
  openGraph: { siteName: "yeoziphab", type: "website", locale: "ko_KR" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        {children}
        <InkSplash />
        <Chrome />
      </body>
    </html>
  );
}

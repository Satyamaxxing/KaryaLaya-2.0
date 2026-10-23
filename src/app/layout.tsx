import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import SmoothScroll from "@/components/smooth-scroll/SmoothScroll";

export const viewport: Viewport = {
  themeColor: "#020408",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "KaryaLaya — The operating system for agencies",
  description:
    "Manage client work, team tasks, and client approvals in one place. Built exclusively for digital agencies, video editors, web developers, designers, and social media managers.",
  keywords: [
    "agency operating system",
    "digital agency workflow",
    "client approval portal",
    "video editing agency",
    "web development agency",
    "social media agency management",
    "client project management",
  ],
  authors: [{ name: "KaryaLaya" }],
  openGraph: {
    title: "KaryaLaya — The operating system for agencies",
    description: "Manage client work, team tasks, and client approvals in one place.",
    url: "https://karyalaya.work",
    siteName: "KaryaLaya",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaryaLaya — The operating system for agencies",
    description: "Manage client work, team tasks, and client approvals in one place.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }
                window.scrollTo(0, 0);
                if (window.location.hash) {
                  history.replaceState(null, '', window.location.pathname + window.location.search);
                }
              }
            `,
          }}
        />
      </head>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}

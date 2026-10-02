import type { ReactNode } from "react";
import { Nav } from "./nav";
import { LangProvider } from "./i18n";
import "./globals.css";

export const metadata = {
  title: { default: "Sizzly · Your flirty AI girlfriend", template: "%s · Sizzly" },
  description: "Things are heating up. Chat, flirt and connect with AI companions who remember you. English, Hindi & Hinglish. 18+ only.",
  openGraph: { title: "Sizzly · Your flirty AI girlfriend", description: "Things are heating up. 18+ AI companions.", siteName: "Sizzly", type: "website" },
};
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Bowlby+One&family=Pacifico&display=swap" />
      </head>
      <body>
        <LangProvider>
          <Nav />
          <div className="shell">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}

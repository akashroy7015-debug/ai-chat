import type { ReactNode } from "react";
import { Nav } from "./nav";
import { LangProvider } from "./i18n";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://flirtiq.online"),
  title: { default: "FlirtIQ · AI companion & virtual dating", template: "%s · FlirtIQ" },
  description: "Chat, flirt and connect with AI companions who remember you. English, Hindi & Hinglish. 18+ only.",
  openGraph: { title: "FlirtIQ · AI companion & virtual dating", description: "Chat with AI companions who remember you. 18+.", siteName: "FlirtIQ", type: "website", url: "https://flirtiq.online" },
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

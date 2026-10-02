import type { ReactNode } from "react";
import { Nav } from "./nav";
import { LangProvider } from "./i18n";
import "./globals.css";

export const metadata = { title: "AI Chat", description: "18+ AI companions" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
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

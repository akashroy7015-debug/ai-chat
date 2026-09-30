import type { ReactNode } from "react";
import { Nav } from "./nav";
import { LangProvider } from "./i18n";

export const metadata = { title: "AI Chat", description: "18+ AI companions" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0f0f14", color: "#eee" }}>
        <LangProvider>
          <Nav />
          <div className="shell">{children}</div>
        </LangProvider>
      </body>
    </html>
  );
}

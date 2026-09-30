import type { ReactNode } from "react";
import { Nav } from "./nav";

export const metadata = { title: "AI Chat", description: "18+ AI companions" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0f0f14", color: "#eee" }}>
        <Nav />
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
